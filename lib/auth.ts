import { NextAuthOptions } from "next-auth"
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions : NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                id: { label: "ID", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.id || !credentials?.password) {
                    console.log("No credentials", credentials)
                    return null
                }

                try {
                    const user = await prisma.user.findFirst({
                        where: {
                            name: credentials.id,
                        },
                        include: {
                            university: true,
                        },
                    })
                    console.log("User found:", user)

                    if (!user || !user.passwordDigest) {
                        console.log("User not found or no password digest", user)
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(
                        credentials.password,
                        user.passwordDigest
                    )
                    console.log("Password valid:", isPasswordValid)

                    if (!isPasswordValid) {
                        console.log("Password invalid for user:", user.name)
                        return null
                    }

                    // Update last sign in
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { lastSignInAt: new Date() },
                    })

                    console.log("User authenticated:", user)
                    return {
                        id: user.id.toString(),
                        email: user.email,
                        name: user.name,
                        universityId: user.universityId,
                        universityName: user.university.name,
                    }
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.userId = user.id
                token.universityId = user.universityId
                token.universityName = user.universityName
            }
            return token
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.userId as string
                session.user.universityId = token.universityId as number
                session.user.universityName = token.universityName as string
            }
            return session
        },
    },
    pages: {
        signIn: "/club-login",
        error: "/auth/error",
    },
}
