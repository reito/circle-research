import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// レート制限用のメモリストア（本番環境ではRedisを推奨）
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// レート制限チェック関数
function checkRateLimit(clientIdentifier: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const clientData = rateLimitStore.get(clientIdentifier)

  if (!clientData || now > clientData.resetTime) {
    rateLimitStore.set(clientIdentifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return true
  }

  if (clientData.count >= maxRequests) {
    return false
  }

  clientData.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    // クライアント識別子を取得（IPアドレスまたはセッションID）
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
    const clientIdentifier = `chat:${clientIp}`

    // レート制限チェック（1分間に10リクエストまで）
    if (!checkRateLimit(clientIdentifier, 10, 60000)) {
      return NextResponse.json(
        { error: "リクエストが多すぎます。しばらく待ってから再度お試しください。" },
        { status: 429 }
      )
    }

    const body = await req.json()
    const { message, universityName, universityId } = body
    
    console.log("Chat API called with:", { message, universityName, universityId })

    if (!message || !universityName) {
      return NextResponse.json(
        { error: "メッセージと大学名は必須です" },
        { status: 400 }
      )
    }

    // メッセージ長さの制限
    if (message.length > 500) {
      return NextResponse.json(
        { error: "メッセージは500文字以内で入力してください" },
        { status: 400 }
      )
    }

    // OpenAI APIキーのチェック
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key is not configured")
      // APIキーがない場合は、シンプルな返答を返す
      return NextResponse.json({
        response: `${universityName}のサークルについてですね。申し訳ありませんが、現在AI機能は利用できません。`,
      })
    }

    // 大学のサークル情報を取得
    let clubs: any[] = []
    let universityInfo: any = null
    
    if (universityId) {
      try {
        // 大学情報を取得
        universityInfo = await prisma.university.findUnique({
          where: {
            id: parseInt(universityId),
          },
          select: {
            name: true,
            _count: {
              select: {
                clubs: {
                  where: {
                    isActive: true,
                  },
                },
                users: true,
              },
            },
          },
        })

        // サークル情報を取得（より詳細に）
        clubs = await prisma.club.findMany({
          where: {
            universityId: parseInt(universityId),
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            memberCount: true,
            description: true,
            createdAt: true,
          },
          orderBy: [
            { memberCount: "desc" },
            { createdAt: "desc" },
          ],
        })
      } catch (error) {
        console.error("Error fetching university/clubs data:", error)
      }
    }

    // サークルをカテゴリー分け（改善版）
    const categorizeClubs = (clubs: any[]) => {
      const categories = {
        sports: [] as any[],
        culture: [] as any[],
        volunteer: [] as any[],
        other: [] as any[],
      }

      clubs.forEach((club) => {
        const name = club.name.toLowerCase()
        const desc = (club.description || "").toLowerCase()
        
        // スポーツ系の判定（拡張版）
        const sportsKeywords = [
          "野球", "サッカー", "テニス", "バスケ", "バレー", "陸上", "水泳",
          "スポーツ", "ラグビー", "アメフト", "ハンドボール", "卓球",
          "バドミントン", "ゴルフ", "剣道", "柔道", "空手", "合気道",
          "弓道", "なぎなた", "相撲", "レスリング", "ボクシング",
          "スキー", "スノボ", "スノーボード", "スケート", "ホッケー",
          "サーフィン", "ダイビング", "ヨガ", "フィットネス", "ジム",
          "ランニング", "マラソン", "トライアスロン", "自転車", "競技"
        ]
        
        // 文化系の判定（拡張版）
        const cultureKeywords = [
          "音楽", "美術", "演劇", "写真", "文芸", "映画", "書道",
          "茶道", "華道", "花道", "囲碁", "将棋", "チェス", "競技かるた",
          "研究会", "研究部", "学会", "勉強会", "ディベート", "模擬国連",
          "漫画", "アニメ", "イラスト", "文学", "小説", "詩", "俳句",
          "放送", "広報", "新聞", "雑誌", "出版", "映像", "メディア",
          "プログラミング", "コンピュータ", "ロボット", "科学", "実験"
        ]

        // ダンスは特別処理（競技ダンスはスポーツ、それ以外は文化系）
        const isDance = name.includes("ダンス") || name.includes("dance")
        const isCompetitiveDance = isDance && (name.includes("競技") || desc.includes("競技"))
        
        if (sportsKeywords.some(keyword => name.includes(keyword) || desc.includes(keyword)) || isCompetitiveDance) {
          categories.sports.push(club)
        } else if (cultureKeywords.some(keyword => name.includes(keyword) || desc.includes(keyword)) || (isDance && !isCompetitiveDance)) {
          categories.culture.push(club)
        } else if (name.includes("ボランティア") || name.includes("環境") || 
                   name.includes("国際") || name.includes("社会貢献") || 
                   desc.includes("ボランティア") || desc.includes("社会貢献")) {
          categories.volunteer.push(club)
        } else {
          categories.other.push(club)
        }
      })

      return categories
    }

    const categorizedClubs = clubs.length > 0 ? categorizeClubs(clubs) : null

    // システムプロンプト
    const systemPrompt = `あなたは${universityName}のフレンドリーなサークル相談アドバイザーです。新入生の質問に答えつつ、積極的に会話を広げて相手の興味を引き出してください。

【絶対に守るべき重要ルール】
⚠️ 下記の【利用可能なサークル】リストにある正確な名前のサークルのみ紹介する
⚠️ 「スポーツ系サークル」「文化系サークル」などの一般的な名称は使わない
⚠️ 存在しないサークルを勝手に作り出して紹介してはいけない
⚠️ リンク形式 [サークル名|club-info-view?id=ID] は実在するサークルにのみ使用
⚠️ 各カテゴリーの説明は「スポーツ系には〜」のように言及し、具体的なサークル名を列挙

【回答ルール】
1. 質問に直接答える（カテゴリー質問には該当する複数のサークルを紹介）
2. 回答は3-4文程度で簡潔に
3. 必ず最後に新入生への質問や問いかけで終わる
4. 相手の興味・経験・不安を引き出す質問をする
5. 親しみやすく、励ましの気持ちを込める

【大学情報】
- 大学名: ${universityName}
- アクティブなサークル数: ${universityInfo?._count?.clubs || 0}個

${categorizedClubs ? `
【${universityName}で利用可能なサークル（これ以外のサークルは存在しません）】
${categorizedClubs.sports.length > 0 ? `✅ スポーツ系(${categorizedClubs.sports.length}個): ${categorizedClubs.sports.map(c => `${c.name}[ID:${c.id}](${c.memberCount}人)`).join(", ")}` : "❌ スポーツ系: なし"}
${categorizedClubs.culture.length > 0 ? `\n✅ 文化系(${categorizedClubs.culture.length}個): ${categorizedClubs.culture.map(c => `${c.name}[ID:${c.id}](${c.memberCount}人)`).join(", ")}` : "\n❌ 文化系: なし"}
${categorizedClubs.volunteer.length > 0 ? `\n✅ ボランティア系(${categorizedClubs.volunteer.length}個): ${categorizedClubs.volunteer.map(c => `${c.name}[ID:${c.id}](${c.memberCount}人)`).join(", ")}` : "\n❌ ボランティア系: なし"}
${categorizedClubs.other.length > 0 ? `\n✅ その他(${categorizedClubs.other.length}個): ${categorizedClubs.other.map(c => `${c.name}[ID:${c.id}](${c.memberCount}人)`).join(", ")}` : "\n❌ その他: なし"}` : "\n【サークル情報】現在データを準備中です。"}

【サークルのリンク表記ルール】
- サークルを紹介する際は必ずサークル名をリンク形式で表記
- 形式: [サークル名|club-info-view?id=サークルID]
- 例: [テニスサークル|club-info-view?id=1]、[サッカー部|club-info-view?id=2]
- IDを直接言及せず、自然な文章で紹介

【問いかけ例】
- 「どんなジャンルに興味がありますか？」
- 「高校時代に何か活動していましたか？」
- 「初心者でも大丈夫かな？って心配ですか？」
- 「友達作りも重視したいですか？」
- 「どれか気になるものはありましたか？」

【正しい回答例】
Q: サークル何があるの？
→ 「${universityName}にはスポーツ系で[バスケットボール部|club-info-view?id=22](26人)、文化系で[落語研究会|club-info-view?id=21](12人)や[漫画研究会|club-info-view?id=23](22人)、他にも[環境サークル|club-info-view?id=24](28人)などがあります！どんなジャンルに興味がありますか？」

Q: スポーツ系はある？
→ リストにスポーツ系がある場合: 「はい！スポーツ系には[バスケットボール部|club-info-view?id=22](26人)があります。初心者歓迎ですよ！興味ありますか？」

【絶対にダメな回答例】
❌「[スポーツ系サークル|club-info-view?id=22]があります」（カテゴリー名にリンクを付ける）
❌「[文化系サークル|club-info-view?id=25]」（存在しない一般的な名称）
❌「テニス部やサッカー部があります」（リストにない場合）
❌ リンクなしでサークルを紹介する`

    // OpenAI APIを呼び出し
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
      })

      const aiResponse = completion.choices[0]?.message?.content || "申し訳ありません、応答を生成できませんでした。"

      return NextResponse.json({
        response: aiResponse,
      })
    } catch (openAIError: any) {
      console.error("OpenAI API error:", openAIError)
      
      // APIエラーの場合でも、ユーザーには優しいメッセージを返す
      return NextResponse.json({
        response: `${universityName}のサークル情報についてお答えします。どのようなサークルをお探しですか？スポーツ系、文化系、ボランティア系など、様々なサークルがありますよ！`,
      })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "内部エラーが発生しました" },
      { status: 500 }
    )
  }
}