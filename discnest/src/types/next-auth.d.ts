import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      password?: string;
      hasOnboarded?: boolean;
      role?: string;
    };
  }

  interface User {
    id: string;
    name?: string;
    email?: string;
    image?: string;
    hasOnboarded?: boolean;
    role?: string;
  }
}