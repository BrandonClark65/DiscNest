import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
// import FacebookProvider from 'next-auth/providers/facebook';

import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },

  providers: [
    // -------------------------------------------------------------------
    // ⭐ CREDENTIALS LOGIN
    // -------------------------------------------------------------------
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        await connectToDatabase();

        const userInDb = await User.findOne({ email: credentials.email });
        if (!userInDb || !userInDb.password) {
          // Prevent OAuth accounts from using credentials login
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          userInDb.password
        );
        if (!isValid) return null;

        await User.updateOne(
          { email: credentials.email },
          { $set: { lastLogin: new Date() } }
        );

        return {
          id: userInDb._id.toString(),
          email: userInDb.email,
          name: userInDb.name,
          role: userInDb.role,
        };
      },
    }),

    // -------------------------------------------------------------------
    // ⭐ GOOGLE LOGIN
    // -------------------------------------------------------------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // -------------------------------------------------------------------
    // ⭐ FACEBOOK LOGIN
    // -------------------------------------------------------------------
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_CLIENT_ID!,
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    // }),
  ],

  // -------------------------------------------------------------------
  // ⭐ CALLBACKS — Runs on login/session creation
  // -------------------------------------------------------------------
  callbacks: {
    async signIn({ user, account }) {
      await connectToDatabase();

      // If using Google or Facebook
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        const existingUser = await User.findOne({ email: user.email });

        if (!existingUser) {
          await User.create({
            name: user.name,
            email: user.email,
            avatarUrl: user.image ?? null,
            provider: account.provider,
            providerId: account.providerAccountId,
          });
        } else {
          // Update lastLogin for OAuth users
          existingUser.lastLogin = new Date();
          await existingUser.save();
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      // Only runs on initial login
      if (user) {
        token.sub = user.id ?? token.sub;
        token.email = user.email;
        token.role = user.role ?? 'user';
      }
      return token;
    },

    async session({ session, token }) {
      // Add user.id to session so we can use it everywhere
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};
