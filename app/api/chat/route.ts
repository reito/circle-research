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

    // サークルをカテゴリー分け（簡易的な分類）
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
        
        if (name.includes("野球") || name.includes("サッカー") || name.includes("テニス") || 
            name.includes("バスケ") || name.includes("バレー") || name.includes("陸上") ||
            name.includes("水泳") || name.includes("スポーツ") || desc.includes("運動")) {
          categories.sports.push(club)
        } else if (name.includes("音楽") || name.includes("美術") || name.includes("演劇") || 
                   name.includes("写真") || name.includes("文芸") || name.includes("映画") ||
                   name.includes("ダンス") || desc.includes("文化")) {
          categories.culture.push(club)
        } else if (name.includes("ボランティア") || name.includes("環境") || 
                   name.includes("国際") || desc.includes("社会貢献")) {
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
⚠️ 下記の【利用可能なサークル】リストにないサークルは絶対に言及しない
⚠️ 存在しないサークルを勝手に作り出して紹介してはいけない
⚠️ 一般的なサークル名で回答せず、必ずリストの正確な名前を使う

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
Q: スポーツ系はある？
→ リストにスポーツ系がある場合: 「はい！${universityName}には[テニスサークル|club-info-view?id=1](25人)、[サッカー部|club-info-view?id=2](28人)などがあります。どちらも初心者歓迎ですよ！どれか気になりますか？」
→ リストにスポーツ系がない場合: 「申し訳ないですが、${universityName}には現在スポーツ系のサークルがないようです。他のジャンルに興味はありますか？」

【絶対にダメな回答例】
❌「テニス部やサッカー部があります」（リストにない場合）
❌「一般的にはバスケ部などがあります」（推測で答える）
❌ リンクなしでサークルを紹介する
❌ IDを直接表示する「ID:1」「詳細はこちら」などの不自然な表現`

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