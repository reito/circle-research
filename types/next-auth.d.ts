import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      universityId: number
      universityName: string
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    universityId: number
    universityName: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    userId: string
    universityId: number
    universityName: string
  }
}