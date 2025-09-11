import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const kana = searchParams.get("kana")

    const universities = await prisma.university.findMany({
      where: kana ? {
        reading: {
          startsWith: kana,
        },
      } : undefined,
      select: {
        id: true,
        name: true,
        reading: true,
        domain: true,
        _count: {
          select: {
            clubs: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        reading: "asc",
      },
    })

    // レスポンス用に整形
    const formattedUniversities = universities.map((uni) => ({
      id: uni.id,
      name: uni.name,
      reading: uni.reading,
      domain: uni.domain,
      activeClubCount: uni._count.clubs,
    }))

    return NextResponse.json({
      universities: formattedUniversities,
      total: formattedUniversities.length,
    })
  } catch (error) {
    console.error("Error fetching universities:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, domain } = body

    if (!name) {
      return NextResponse.json(
        { error: "University name is required" },
        { status: 400 }
      )
    }

    const university = await prisma.university.create({
      data: {
        name,
        domain: domain || null,
      },
    })

    return NextResponse.json(university, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "University name already exists" },
        { status: 409 }
      )
    }
    
    console.error("Error creating university:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}