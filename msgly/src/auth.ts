// src/auth.ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import clientPromise from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const client = await clientPromise
        const db = client.db("brochat")
        
        // User ko find karo
        const user = await db.collection("users").findOne({ email: credentials.email })

        if (!user || !user.password) return null

        // Password check karo
        const isMatch = await bcrypt.compare(credentials.password as string, user.password)

        if (!isMatch) return null

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET, // Note: v5 mein NEXTAUTH_SECRET ki jagah AUTH_SECRET use hota hai
})