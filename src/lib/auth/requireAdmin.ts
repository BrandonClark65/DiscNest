// lib/auth/requireAdmin.ts
import { authOptions } from '../auth';
import { UnauthorizedError } from '@/lib/errors/UnauthorizedError';
import { Session } from 'next-auth';

export async function requireAdmin(): Promise<Session> {
  const nextAuth = await import('next-auth') as unknown as { getServerSession: (options: typeof authOptions) => Promise<Session | null> };
  const { getServerSession } = nextAuth;
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new UnauthorizedError('No session found');
  }

  if (session.user?.role !== 'admin') {
    throw new UnauthorizedError('User is not admin', {
      email: session.user?.email,
      role: session.user?.role,
    });
  }

  return session;
}