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
    const systemPrompt = `あなたは${universityName}のサークル・部活動に詳しい親切なアドバイザーです。
新入生の質問に対して、具体的で実用的なアドバイスを提供してください。

【大学情報】
- 大学名: ${universityName}
${universityInfo ? `- アクティブなサークル数: ${universityInfo._count.clubs}
- 登録ユーザー数: ${universityInfo._count.users}` : ""}

【対応方針】
1. 親しみやすく、励ましのある言葉遣いで対応
2. 学生の興味や経験を考慮した具体的な提案
3. サークル選びの重要なポイントを説明
4. 複数のサークルを見学することを推奨
5. 新入生の不安を取り除くようなアドバイス

${categorizedClubs ? `
【サークル情報】
${categorizedClubs.sports.length > 0 ? `\n◆スポーツ系 (${categorizedClubs.sports.length}団体)
${categorizedClubs.sports.slice(0, 5).map(c => `- ${c.name}: ${c.description || "活発に活動中"} (部員${c.memberCount}人)`).join("\n")}` : ""}
${categorizedClubs.culture.length > 0 ? `\n\n◆文化系 (${categorizedClubs.culture.length}団体)
${categorizedClubs.culture.slice(0, 5).map(c => `- ${c.name}: ${c.description || "活発に活動中"} (部員${c.memberCount}人)`).join("\n")}` : ""}
${categorizedClubs.volunteer.length > 0 ? `\n\n◆ボランティア・社会貢献系 (${categorizedClubs.volunteer.length}団体)
${categorizedClubs.volunteer.slice(0, 5).map(c => `- ${c.name}: ${c.description || "活発に活動中"} (部員${c.memberCount}人)`).join("\n")}` : ""}
${categorizedClubs.other.length > 0 ? `\n\n◆その他 (${categorizedClubs.other.length}団体)
${categorizedClubs.other.slice(0, 5).map(c => `- ${c.name}: ${c.description || "活発に活動中"} (部員${c.memberCount}人)`).join("\n")}` : ""}
` : "\n現在、詳細なサークル情報を準備中です。"}

学生からの質問に対して、上記の情報を活用して具体的かつ実用的なアドバイスをしてください。`

    // OpenAI APIを呼び出し
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.8,
        max_tokens: 700,
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