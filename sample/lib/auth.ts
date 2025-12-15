import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = (credentials?.email || '').toString().trim().toLowerCase();
        const password = (credentials?.password || '').toString();
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        if (!user.emailVerified) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  session: {
    // Required for Credentials provider in NextAuth v4
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Persist user id into the token on sign-in
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) return session;

      // Always load latest billing state from the database for this user
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub as string },
        select: {
          plan: true,
          subscriptionStatus: true,
          role: true,
        },
      });

      session.user.id = token.sub as string;
      session.user.plan = dbUser?.plan ?? 'free';
      session.user.subscriptionStatus = dbUser?.subscriptionStatus ?? 'inactive';
      session.user.role = (dbUser?.role as any) ?? 'user';

      return session;
    },
  },
  pages: {
    signIn: '/login',
    verifyRequest: '/login?check=1',
  },
};

export const nextAuthHandler = NextAuth(authOptions);


