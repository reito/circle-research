import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const universities = await prisma.university.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(universities)
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