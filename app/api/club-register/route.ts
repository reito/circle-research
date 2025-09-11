import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { id, password } = await req.json()
    if (!id || !password) {
      return NextResponse.json({ success: false, error: "IDとパスワードは必須です" }, { status: 400 })
    }
    if (id.length < 3) {
      return NextResponse.json({ success: false, error: "IDは3文字以上で入力してください" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "パスワードは6文字以上で入力してください" }, { status: 400 })
    }

    // 既存IDチェック
    const exists = await prisma.user.findFirst({ where: { name: id } })
    if (exists) {
      return NextResponse.json({ success: false, error: "このIDは既に使われています" }, { status: 409 })
    }

    // パスワードハッシュ化
    const passwordDigest = await bcrypt.hash(password, 10)

    // ユーザー作成
    await prisma.user.create({
      data: {
        name: id,
        passwordDigest,
        email: `${id}@dummy.club`, // email必須のためダミー
        universityId: 2, // 必要に応じて修正
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "登録に失敗しました" }, { status: 500 })
  }
}
