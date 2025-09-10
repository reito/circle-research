import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user with their clubs
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
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
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
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

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Create club
    const club = await prisma.club.create({
      data: {
        name,
        memberCount: memberCount || 1,
        description: description || "",
        universityId: parseInt(universityId),
        ownerId: user.id,
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
        { error: "Club name already exists in this university" },
        { status: 409 }
      )
    }
    
    console.error("Error creating club:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}