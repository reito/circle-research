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
  id: { label: "ID", type: "text" },
  password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.id || !credentials?.password) {
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
  signIn: "/club-login",
    error: "/auth/error",
  },
})

export { handler as GET, handler as POST }