import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
// import GoogleProvider from 'next-auth/providers/google';
// import FacebookProvider from 'next-auth/providers/facebook';
import User from '@/models/User';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

// ✅ Log session strategy at runtime
console.log('🧠 Session strategy:', 'jwt');

export const authOptions: NextAuthOptions = {
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

        userInDb.lastLogin = new Date();
        await userInDb.save();

        return {
          id: userInDb._id.toString(),
          email: userInDb.email,
          name: userInDb.name,
          image: userInDb.image,
          role: userInDb.role,
        };
      },
    }),
    // Uncomment these if you want to test OAuth later
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_ID!,
    //   clientSecret: process.env.GOOGLE_SECRET!,
    // }),
    // FacebookProvider({
    //   clientId: process.env.FACEBOOK_ID!,
    //   clientSecret: process.env.FACEBOOK_SECRET!,
    // }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      console.log('🔐 JWT callback triggered');
      if (user) {
        token.sub = user.id;
        token.role = user.role ?? 'user';
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🧾 Session callback triggered');
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt', // ✅ Force JWT strategy
  },
  secret: process.env.NEXTAUTH_SECRET, // ✅ Required for JWT encryption/decryption
};