import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (id) {
      // id指定時は認証不要で単一クラブ情報を返す
      const club = await prisma.club.findUnique({
        where: { id: Number(id) },
        include: { university: true, owner: true },
      })
      if (!club) {
        return NextResponse.json({ error: "Club not found" }, { status: 404 })
      }
      return NextResponse.json(club)
    }

    // id指定なしは従来通り（認証必須）
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    // Get user with their clubs
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      include: {
        clubs: {
          include: {
            university: true,
          },
        },
      },
    })
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    return NextResponse.json(user.clubs)
  } catch (error) {
    console.error("Error fetching clubs:", error)
    return NextResponse.json(
      { error: "Internal server error!!!" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, memberCount, description, universityId } = body

    // Validate input
    if (!name || !universityId) {
      return NextResponse.json(
        { error: "Name and university are required" },
        { status: 400 }
      )
    }

    console.log(session)
    // Create club
    const club = await prisma.club.create({
      data: {
      name,
      memberCount: memberCount ? Number(memberCount) : 1,
      description: description || "",
      universityId: Number(universityId),
      ownerId: Number(session.user.id)
      },
      include: {
      university: true,
      owner: true,
      },
    })

    return NextResponse.json(club, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Club name already exists in this university!" },
        { status: 409 }
      )
    }

    console.error("Error creating club:", error)
    return NextResponse.json(
      { error: "Internal server error!" },
      { status: 500 }
    )
  }
}