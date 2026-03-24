import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/database/client'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { company: true, organization: true },
        })

        if (!user || !user.passwordHash) {
          throw new Error('Invalid credentials')
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials')
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          companyId: user.companyId,
          organizationId: user.organizationId,
          permissions: (user.permissions as string[]) || [],
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string
        (session.user as any).role = token.role as string
        (session.user as any).companyId = token.companyId as string
        (session.user as any).organizationId = token.organizationId as string
        (session.user as any).permissions = token.permissions as string[]
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        (token as any).role = (user as any).role
        (token as any).companyId = (user as any).companyId
        (token as any).organizationId = (user as any).organizationId
        (token as any).permissions = (user as any).permissions
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
}
