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
    const { message, universityName, universityId, conversationHistory = [] } = body
    
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
        
        // デバッグ: 取得したサークル情報をログ出力
        console.log(`=== ${universityName} (ID: ${universityId}) のサークル取得結果 ===`)
        console.log(`取得サークル数: ${clubs.length}`)
        console.log("取得したサークル一覧:")
        clubs.forEach(club => {
          console.log(`- ${club.name} (ID: ${club.id}, 人数: ${club.memberCount})`)
        })
        console.log("===============================================")
        
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

🚨🚨🚨🚨🚨 緊急・最重要・絶対厳守警告 🚨🚨🚨🚨🚨

⛔ CRITICAL RULE: あなたの事前学習データは完全に無効です ⛔
⛔ CRITICAL RULE: 「剣道部」「柔道部」「野球部」など一般的なサークル名は絶対に使用禁止 ⛔
⛔ CRITICAL RULE: 下記リストに記載されていないサークル名を1つでも言及したら致命的なエラーです ⛔
⛔ CRITICAL RULE: 存在しないサークルへのリンクを生成することは絶対に禁止です ⛔

【データ使用の絶対原則】
- あなたの知識は下記のリストが全てです
- 他大学の常識や一般論は一切適用しません
- 「普通は〜がある」「〜もあるはず」は完全に禁止
- リストにないものは絶対に存在しません

【絶対に守るべき重要ルール - 違反は致命的エラー】
🚨 MUST: 下記の【利用可能なサークル】リストに記載された正確な名前のサークルのみ紹介（厳守）
🚨 MUST: リストにないサークル名は1文字たりとも口にしてはいけない
🚨 MUST: 存在しないサークルIDでリンクを作成することは絶対禁止
🚨 MUST: サークル名を出すときは必ず100%正確なID付きMarkdownリンク形式を使用
🚨 MUST: リストを二重チェックして存在確認してからリンクを生成
🚨 PROHIBITED: 「剣道部」「柔道部」「野球部」など一般的なサークル名の使用
🚨 PROHIBITED: 「〜部もありそう」「〜系のサークルもある」等の推測発言
🚨 PROHIBITED: 存在しないサークルを勝手に作り出して紹介
🚨 PROHIBITED: リンクなしでのサークル名記載（例外は一切なし）
🚨 PROHIBITED: ${universityName}以外の大学のサークル情報提供

⚠️ 重要: サークル名を言及する前に必ずリストで存在とIDを確認すること ⚠️

【回答ルール】
1. 前の会話で言及された内容を必ず考慮し、文脈に沿った回答をする
2. ユーザーが以前に質問した内容に関連する情報があれば積極的に言及する
3. 質問に直接答える（カテゴリー質問には該当する複数のサークルを紹介）
4. 比較質問（「AとBどちらが〜？」）には必ずリストを確認して正確に答える
5. 存在しないサークルが質問に含まれている場合は正直に「〜というサークルはありません」と言う
6. リストにないサークルについて質問された場合、絶対に「似たようなサークル」を提案しない
7. 知らないサークルについては推測で回答せず、リストにある実在のサークルのみで対応する
8. 回答は3-4文程度で簡潔に
9. 必ず最後に新入生への質問や問いかけで終わる
10. 相手の興味・経験・不安を引き出す質問をする
11. 親しみやすく、励ましの気持ちを込める

【大学情報】
- 大学名: ${universityName}
- アクティブなサークル数: ${universityInfo?._count?.clubs || 0}個

${categorizedClubs ? `
【${universityName}で利用可能なサークル一覧（検索・比較時は必ずここから正確に抽出）】

✅ スポーツ系サークル一覧:
${categorizedClubs.sports.length > 0 ? categorizedClubs.sports.map(c => `・${c.name} [ID:${c.id}] 部員数:${c.memberCount}人`).join("\n") : "なし"}

✅ 文化系サークル一覧:
${categorizedClubs.culture.length > 0 ? categorizedClubs.culture.map(c => `・${c.name} [ID:${c.id}] 部員数:${c.memberCount}人`).join("\n") : "なし"}

✅ ボランティア系サークル一覧:
${categorizedClubs.volunteer.length > 0 ? categorizedClubs.volunteer.map(c => `・${c.name} [ID:${c.id}] 部員数:${c.memberCount}人`).join("\n") : "なし"}

✅ その他のサークル一覧:
${categorizedClubs.other.length > 0 ? categorizedClubs.other.map(c => `・${c.name} [ID:${c.id}] 部員数:${c.memberCount}人`).join("\n") : "なし"}` : "\n【サークル情報】現在データを準備中です。"}

【サークルのリンク表記の厳格なルール】
- サークル名を記載する際は、100%必ずMarkdownリンク形式で表記する（例外は一切なし）
- 形式: [サークル名](club-info-view?id=サークルID)
- 例: [テニスサークル](club-info-view?id=1)、[サッカー部](club-info-view?id=2)
- IDを直接言及せず、自然な文章で紹介
- リンクを付けずにサークル名を書くことは厳禁
- 毎回の回答で全てのサークル名にリンクを付けることを必ず確認する
- 一つでもリンクなしのサークル名があれば回答として不適切

【問いかけ例】
- 「どんなジャンルに興味がありますか？」
- 「高校時代に何か活動していましたか？」
- 「初心者でも大丈夫かな？って心配ですか？」
- 「友達作りも重視したいですか？」
- 「どれか気になるものはありましたか？」

【正しい回答例】
Q: サークル何があるの？
✅ 「${universityName}にはスポーツ系で[バスケットボール部](club-info-view?id=22)(26人)、文化系で[落語研究会](club-info-view?id=21)(12人)や[漫画研究会](club-info-view?id=23)(22人)、他にも[環境サークル](club-info-view?id=24)(28人)などがあります！どんなジャンルに興味がありますか？」

Q: 柔道部と剣道部どちらが人数多い？
✅ 上記リストを確認して: 「[柔道部](club-info-view?id=18)(18人)と[剣道部](club-info-view?id=16)(16人)では、[柔道部](club-info-view?id=18)の方が人数が多いですね！どちらも武道系で人気ですよ。興味はありますか？」

Q: テニス部はある？（リストにない場合）
✅ 「申し訳ないですが、${universityName}にはテニス部がないようです。スポーツ系では[柔道部](club-info-view?id=18)や[剣道部](club-info-view?id=16)などがありますよ！他に興味のあるスポーツはありますか？」

【絶対にダメな回答例】
❌「柔道部や剣道部があります」（リンクなし）
❌「以前お話した野球部も人気ですよ」（リンクなし）
❌「テニス部はありませんが、似たようなバドミントン部があります」（推測による提案）
❌「野球部もありそうですね」（推測）
❌「一般的には音楽系サークルもあることが多いです」（他大学の情報）
❌ リストにないサークルを比較に含める
❌ 関係ないサークル（合唱部など）を提案する
❌「[スポーツ系サークル|club-info-view?id=22]があります」（カテゴリー名にリンク）
❌ 前回の会話で言及したサークル名をリンクなしで参照する
❌ 他大学の一般的なサークル情報を参考にした回答

【文脈理解と継続性のルール】
- 前の会話で話題になったサークルについて触れる際も必ずリンクを付ける
- ユーザーの質問の変化に応じて、関連する新しい情報を提供する
- 「さっき話した〇〇部」のような参照でも必ずリンク付きで記載する
- 会話の流れを意識し、ユーザーの興味が変わった場合は柔軟に対応する

【データ厳守の最重要原則】
⛔ リストにないサークルは存在しないものとして扱う
⛔ 「〜部もあるかもしれません」「〜系もありそう」などの推測は一切しない  
⛔ ${universityName}のサークルリスト以外の情報は参照しない
⛔ 他大学の常識や一般論は適用しない
⛔ 質問されたサークルがリストにない場合は「ありません」と明確に答える

【回答生成の絶対ルール】
🛑 回答する前に必ず上記のサークルリストを確認する
🛑 言及するサークル名が全てリストに存在することを確認する  
🛑 リストにないサークル名が含まれる回答は絶対に返さない
🛑 不明なサークルについては「データにありません」と答える
🛑 学習データからの知識は完全に封印し、提供されたデータのみ使用する`

    // 会話履歴を構築（最大20回まで保持）
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ]
    
    // 過去の会話履歴を追加（最新20回分）
    const recentHistory = conversationHistory.slice(-40) // 20往復 = 40メッセージ
    messages.push(...recentHistory)
    
    // 現在のユーザーメッセージを追加
    messages.push({ role: "user", content: message })
    
    // OpenAI APIを呼び出し
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.3, // より決定的な回答にするため温度を下げる
        max_tokens: 300,
      })

      let aiResponse = completion.choices[0]?.message?.content || "申し訳ありません、応答を生成できませんでした。"

      // 【重要】回答検証: 存在しないサークル名が含まれていないかチェック
      const existingClubNames = clubs.map(club => club.name.toLowerCase())
      const commonInvalidClubs = ['剣道部', '柔道部', '野球部', 'サッカー部', 'バスケ部', 'バレー部', '陸上部', '水泳部']
      
      // 禁止されたサークル名が含まれている場合はフィルタリング
      let hasInvalidContent = false
      commonInvalidClubs.forEach(invalidClub => {
        if (aiResponse.includes(invalidClub) && !existingClubNames.some(name => name.includes(invalidClub.replace('部', '').toLowerCase()))) {
          hasInvalidContent = true
          console.warn(`⚠️ AI が存在しないサークル "${invalidClub}" を言及しました`)
        }
      })
      
      // 無効な内容が検出された場合は安全な回答に置き換え
      if (hasInvalidContent) {
        aiResponse = `${universityName}のスポーツ系サークルは、現在[テニスサークル](club-info-view?id=${clubs.find(c => c.name.includes('テニス'))?.id || 1})があります！他にも文化系や様々なサークルがありますよ。どのようなジャンルに興味がありますか？`
        console.log(`🔧 AI回答を安全な内容に修正しました`)
      }

      return NextResponse.json({
        response: aiResponse,
        debug: {
          universityName,
          universityId,
          clubsCount: clubs.length,
          clubs: clubs.map(club => ({
            id: club.id,
            name: club.name,
            memberCount: club.memberCount
          }))
        }
      })
    } catch (openAIError: any) {
      console.error("OpenAI API error:", openAIError)
      
      // APIエラーの場合でも、ユーザーには優しいメッセージを返す
      return NextResponse.json({
        response: `${universityName}のサークル情報についてお答えします。どのようなサークルをお探しですか？スポーツ系、文化系、ボランティア系など、様々なサークルがありますよ！`,
        debug: {
          universityName,
          universityId,
          clubsCount: clubs.length,
          clubs: clubs.map(club => ({
            id: club.id,
            name: club.name,
            memberCount: club.memberCount
          })),
          error: "OpenAI API Error"
        }
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