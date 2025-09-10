import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clubId = parseInt(params.id)
    
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        university: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!club) {
      return NextResponse.json(
        { error: "Club not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(club)
  } catch (error) {
    console.error("Error fetching club:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const clubId = parseInt(params.id)
    const body = await req.json()
    const { name, memberCount, description } = body

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

    // Check if user owns this club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    })

    if (!club || club.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Update club
    const updatedClub = await prisma.club.update({
      where: { id: clubId },
      data: {
        name: name || club.name,
        memberCount: memberCount || club.memberCount,
        description: description !== undefined ? description : club.description,
      },
      include: {
        university: true,
        owner: true,
      },
    })

    return NextResponse.json(updatedClub)
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Club name already exists in this university" },
        { status: 409 }
      )
    }
    
    console.error("Error updating club:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const clubId = parseInt(params.id)

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

    // Check if user owns this club
    const club = await prisma.club.findUnique({
      where: { id: clubId },
    })

    if (!club || club.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Soft delete (set isActive to false)
    await prisma.club.update({
      where: { id: clubId },
      data: { isActive: false },
    })

    return NextResponse.json({ message: "Club deleted successfully" })
  } catch (error) {
    console.error("Error deleting club:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}