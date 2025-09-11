import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { prisma } from "@/lib/prisma"

// OpenAI クライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { message, universityName, universityId } = body
    
    console.log("Chat API called with:", { message, universityName, universityId })

    if (!message || !universityName) {
      return NextResponse.json(
        { error: "メッセージと大学名は必須です" },
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

    // 大学のサークル情報を取得（将来的な拡張用）
    let clubs: any[] = []
    if (universityId) {
      try {
        clubs = await prisma.club.findMany({
          where: {
            universityId: parseInt(universityId),
            isActive: true,
          },
          select: {
            name: true,
            memberCount: true,
            description: true,
          },
        })
      } catch (error) {
        console.error("Error fetching clubs:", error)
      }
    }

    // システムプロンプト
    const systemPrompt = `あなたは日本の大学のサークル・部活動に詳しいアドバイザーです。
新入生に対して親切で分かりやすくアドバイスを提供してください。
大学名: ${universityName}

以下の点に注意してください：
1. 親しみやすく、丁寧な言葉遣いで対応
2. 具体的で実用的なアドバイスを提供
3. 新入生の不安を取り除くような励ましの言葉を含める
4. サークル選びのポイントを適切にアドバイス

${clubs.length > 0 ? `
この大学には以下のようなサークルがあります：
${clubs.map(club => `- ${club.name}: ${club.description || '活動中'} (部員数: ${club.memberCount}人)`).join('\n')}
` : ''}
`

    // OpenAI APIを呼び出し
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
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