import NextAuth, { type NextAuthOptions, type Session, type User } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import type { Role, Permission } from '@/lib/constants/permissions';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/constants/permissions';
import type { Plan } from '@/lib/constants/entitlements';
import { hasEntitlement } from '@/lib/constants/entitlements';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      organizationId?: string;
      avatarUrl?: string;
      plan?: Plan;
    };
    expires: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    organizationId?: string;
    avatarUrl?: string;
    plan?: Plan;
    iat?: number;
    exp?: number;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { organization: true },
        });

        if (!user || !user.password) {
          throw new Error('Invalid credentials');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId || undefined,
          avatarUrl: user.avatarUrl || undefined,
        } as User;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role || 'VIEWER';
        token.organizationId = (user as { organizationId?: string }).organizationId;
        token.avatarUrl = (user as { avatarUrl?: string }).avatarUrl;
      }

      if (trigger === 'update' && session) {
        token.avatarUrl = session.avatarUrl;
        token.name = session.name;
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

export async function refreshSession(session: Session): Promise<Session> {
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      organizationId: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return session;
  }

  return {
    ...session,
    user: {
      ...session.user,
      name: user.name,
      avatarUrl: user.avatarUrl || undefined,
      role: user.role,
      organizationId: user.organizationId || undefined,
    },
  };
}

export function checkPermission(userRole: string, permission: Permission): boolean {
  return hasPermission(userRole as Role, permission);
}

export function checkAnyPermission(userRole: string, permissions: Permission[]): boolean {
  return hasAnyPermission(userRole as Role, permissions);
}

export function checkAllPermissions(userRole: string, permissions: Permission[]): boolean {
  return hasAllPermissions(userRole as Role, permissions);
}

export function checkEntitlement(userPlan: Plan | undefined, feature: 'ai_assistant' | 'advanced_reporting' | 'custom_branding' | 'priority_support' | 'sso' | 'audit_logs' | 'unlimited_projects' | 'unlimited_storage' | 'restrictions_removal' | 'custom_integrations' | 'multi_org'): boolean {
  if (!userPlan) return false;
  return hasEntitlement(userPlan, feature);
}

export function requirePermission(userRole: string, permission: Permission): void {
  if (!checkPermission(userRole, permission)) {
    throw new Error(`Permission denied: ${permission} required`);
  }
}

export function requireAnyPermission(userRole: string, permissions: Permission[]): void {
  if (!checkAnyPermission(userRole, permissions)) {
    throw new Error(`One of the following permissions required: ${permissions.join(', ')}`);
  }
}

export function requireAllPermissions(userRole: string, permissions: Permission[]): void {
  if (!checkAllPermissions(userRole, permissions)) {
    throw new Error(`All of the following permissions required: ${permissions.join(', ')}`);
  }
}

import type { EntitlementFeature } from '@/lib/constants/entitlements';

export function requireEntitlement(userPlan: Plan | undefined, feature: EntitlementFeature): void {
  if (!userPlan || !hasEntitlement(userPlan, feature)) {
    throw new Error(`Feature not available on your current plan`);
  }
}

export { hasPermission, hasAnyPermission, hasAllPermissions };
export { hasEntitlement } from '@/lib/constants/entitlements';

export default NextAuth(authOptions);
