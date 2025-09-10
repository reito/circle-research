import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const universityId = parseInt(params.id)
    
    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    })

    if (!university) {
      return NextResponse.json(
        { error: "University not found" },
        { status: 404 }
      )
    }

    // Get active clubs for this university
    const clubs = await prisma.club.findMany({
      where: {
        universityId: universityId,
        isActive: true,
      },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json({
      university,
      clubs,
    })
  } catch (error) {
    console.error("Error fetching university clubs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}