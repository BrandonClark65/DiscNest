import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

const handler = NextAuth({
  providers: [
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

        if (!userInDb || !userInDb.password) return null;

        const isValid = await bcrypt.compare(credentials.password, userInDb.password);
        if (!isValid) return null;

        return {
            id: userInDb._id.toString(),
            email: userInDb.email,
            name: userInDb.name,
            image: userInDb.image,
        } satisfies {
            id: string;
            email: string;
            name?: string;
            image?: string;
        };
        }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_ID!,
      clientSecret: process.env.FACEBOOK_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
        if (user && !token.sub) {
            await connectToDatabase();
            let existingUser = await User.findOne({ email: user.email });

            if (!existingUser) {
            const newUser = await User.create({
                name: user.name,
                email: user.email,
                image: user.image,
            });
            token.sub = newUser._id.toString();
            } else {
            token.sub = existingUser._id.toString();
            }
        }
        return token;
      },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };