import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// Validate environment variables on module load
// This ensures auth configuration is valid before NextAuth initializes
if (typeof window === 'undefined') {
  // Only validate on server-side
  try {
    // Import validation (it will only run once due to module caching)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@/lib/env').validateEnv();
  } catch (error) {
    // Error already logged by validateEnv
    // Re-throw to prevent app from starting with invalid config
    throw error;
  }
}

export const authOptions = {
  session: {
    strategy: 'jwt',
  },

  providers: [
    // -------------------------------------------------------------
    // ⭐ CREDENTIALS LOGIN
    // -------------------------------------------------------------
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

        // User does not exist
        if (!userInDb) return null;

        // 🚫 Banned protection
        if (userInDb.role === 'banned') {
          throw new Error('Your account has been banned.');
        }

        // Prevent OAuth-only users from logging in with password
        if (!userInDb.password) {
          throw new Error(
            'This email is registered with Google. Please sign in with Google.'
          );
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          userInDb.password
        );
        if (!isValid) return null;

        // Update last login timestamp
        userInDb.lastLogin = new Date();
        await userInDb.save();

        return {
          id: userInDb._id.toString(),
          email: userInDb.email,
          name: userInDb.name,
          role: userInDb.role,
        };
      },
    }),

    // -------------------------------------------------------------
    // ⭐ GOOGLE LOGIN
    // -------------------------------------------------------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // -------------------------------------------------------------
  // ⭐ CALLBACKS
  // -------------------------------------------------------------
  callbacks: {
    /**
     * Runs on ANY login attempt (OAuth or Credentials)
     */
    async signIn({ user, account }: { user: { email?: string | null; name?: string | null; image?: string | null }; account?: { provider?: string; providerAccountId?: string } | null }) {
      await connectToDatabase();

      const existingUser = await User.findOne({ email: user.email });

      // 🚫 Banned users CANNOT login via Google or credentials
      if (existingUser && existingUser.role === 'banned') {
        return false; // Returning false blocks the login
      }

      // Handle Google Login auto-create or update login time
      if (account?.provider === 'google') {
        if (!existingUser) {
          // Create user automatically
          await User.create({
            name: user.name,
            email: user.email,
            avatarUrl: user.image ?? null,
            provider: 'google',
            providerId: account.providerAccountId,
            role: 'user',
            lastLogin: new Date(),
          });
        } else {
          existingUser.lastLogin = new Date();
          await existingUser.save();
        }
      }

      return true;
    },

    /**
     * Create JWT token
     * Ensures token.sub is always a MongoDB ObjectId, not a provider ID
     * For OAuth users, user.id is the provider ID (e.g., Google ID), so we look up the MongoDB user
     */
    async jwt({ token, user }: { token: { sub?: string; email?: string; role?: string }; user?: { id?: string; email?: string; role?: string } }) {
      if (user) {
        // Check if user.id is a valid MongoDB ObjectId (24 hex characters)
        // If not, or if we have email, look up the user in MongoDB to get the ObjectId
        const isMongoObjectId = user.id && /^[0-9a-fA-F]{24}$/.test(user.id);
        
        if (!isMongoObjectId && user.email) {
          // OAuth user - look up MongoDB ObjectId by email
          await connectToDatabase();
          const userInDb = await User.findOne({ email: user.email });
          if (userInDb) {
            token.sub = userInDb._id.toString();
            token.email = user.email;
            token.role = userInDb.role ?? 'user';
          } else {
            // Fallback (shouldn't happen after signIn callback)
            token.sub = user.id ?? token.sub;
            token.email = user.email;
            token.role = user.role ?? 'user';
          }
        } else {
          // Credentials login - user.id is already MongoDB ObjectId
          token.sub = user.id ?? token.sub;
          token.email = user.email;
          token.role = user.role ?? 'user';
        }
      }
      return token;
    },

    /**
     * Hydrate session.user with token fields
     */
    async session({ session, token }: { session: { user?: { id?: string; email?: string; name?: string; role?: string } }; token: { sub?: string; email?: string; role?: string } }) {
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
