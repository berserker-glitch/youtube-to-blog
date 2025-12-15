import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      plan?: 'free' | 'pro' | 'premium';
      subscriptionStatus?: 'inactive' | 'active' | 'past_due' | 'canceled';
    };
  }
}



