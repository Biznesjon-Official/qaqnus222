import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: 'jwt' },
  // Cookie nomini bir xil qilib belgilash (local va production uchun)
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: false },
    },
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        login: { label: 'Login', type: 'text' },
        parol: { label: 'Parol', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.login || !credentials?.parol) return null

        const foydalanuvchi = await prisma.foydalanuvchi.findUnique({
          where: { login: credentials.login as string },
        })

        if (!foydalanuvchi || !foydalanuvchi.faol) return null

        const parolTogri = await bcrypt.compare(
          credentials.parol as string,
          foydalanuvchi.parolHash
        )

        if (!parolTogri) return null

        return {
          id: foydalanuvchi.id,
          name: foydalanuvchi.ism,
          email: foydalanuvchi.login,
          rol: foydalanuvchi.rol,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = (user as any).rol
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).rol = token.rol
      }
      return session
    },
  },
})
