import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, universityId } = body

    // Validate input
    if (!email || !password || !name || !universityId) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if university exists
    const university = await prisma.university.findUnique({
      where: { id: parseInt(universityId) },
    })

    if (!university) {
      return NextResponse.json(
        { error: "University not found" },
        { status: 404 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        universityId_email: {
          universityId: parseInt(universityId),
          email: email,
        },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordDigest = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordDigest,
        universityId: parseInt(universityId),
        authProvider: "password",
      },
      include: {
        university: true,
      },
    })

    // Remove sensitive data
    const { passwordDigest: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}