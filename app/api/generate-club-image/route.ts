import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// OpenAIクライアントを関数内で遅延初期化
async function getOpenAIClient() {
  const { default: OpenAI } = await import('openai')

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { clubId, clubName, description } = await request.json()

    if (!clubId || !clubName) {
      return NextResponse.json(
        { error: 'クラブIDとクラブ名は必須です' },
        { status: 400 }
      )
    }

    // OpenAI APIキーが設定されているかチェック
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      )
    }

    // 既にクラブに画像があるかチェック
    const existingClub = await prisma.club.findUnique({
      where: { id: parseInt(clubId) },
      select: { images: true, name: true, description: true }
    })

    if (!existingClub) {
      return NextResponse.json(
        { error: 'クラブが見つかりません' },
        { status: 404 }
      )
    }

    if (existingClub.images && existingClub.images.length > 0) {
      return NextResponse.json({
        message: '既に画像が存在します',
        images: existingClub.images
      })
    }

    // プロンプトを作成（サークル名と説明文から）
    const prompt = `Create a vibrant and appealing illustration for a Japanese university club called "${clubName}". ${description ? `The club description: ${description}.` : ''} The image should be suitable for promoting the club to new students. Style: modern, colorful, and engaging. No text in the image.`

    console.log('Generating image with prompt:', prompt)

    // OpenAIクライアントを取得
    const openai = await getOpenAIClient()

    // OpenAI DALL-E 3で画像生成
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    })

    const imageUrl = response.data?.[0]?.url
    if (!imageUrl) {
      throw new Error('画像URLが取得できませんでした')
    }

    // 画像をダウンロード
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('画像のダウンロードに失敗しました')
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    // ファイル名を生成
    const filename = `club-${clubId}-${uuidv4()}.png`
    const publicDir = path.join(process.cwd(), 'public', 'generated-images')

    // ディレクトリが存在しない場合は作成
    try {
      await fs.access(publicDir)
    } catch {
      await fs.mkdir(publicDir, { recursive: true })
    }

    // ファイルを保存
    const filePath = path.join(publicDir, filename)
    await fs.writeFile(filePath, Buffer.from(imageBuffer))

    // 保存されたファイルの公開URL
    const savedImageUrl = `/generated-images/${filename}`

    // データベースに画像URLを保存
    await prisma.club.update({
      where: { id: parseInt(clubId) },
      data: {
        images: {
          push: savedImageUrl
        }
      }
    })

    return NextResponse.json({
      success: true,
      imageUrl: savedImageUrl,
      originalUrl: imageUrl
    })

  } catch (error) {
    console.error('画像生成エラー:', error)
    return NextResponse.json(
      {
        error: '画像生成に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}