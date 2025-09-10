import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        universityId: { label: "University ID", type: "number" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.universityId) {
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              universityId_email: {
                universityId: parseInt(credentials.universityId),
                email: credentials.email,
              },
            },
            include: {
              university: true,
            },
          })

          if (!user || !user.passwordDigest) {
            return null
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordDigest
          )

          if (!isPasswordValid) {
            return null
          }

          // Update last sign in
          await prisma.user.update({
            where: { id: user.id },
            data: { lastSignInAt: new Date() },
          })

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
    signIn: "/login",
    error: "/auth/error",
  },
})

export { handler as GET, handler as POST }