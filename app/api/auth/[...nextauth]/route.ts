import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { NextAuthOptions } from "next-auth"
import { authOptions } from "@/lib/auth"


const handler = NextAuth(authOptions)

export { handler as GET, handler as POST , authOptions}