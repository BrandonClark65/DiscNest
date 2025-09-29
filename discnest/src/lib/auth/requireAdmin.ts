// lib/auth/requireAdmin.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth';
import { UnauthorizedError } from '@/lib/errors/UnauthorizedError';
import { Session } from 'next-auth';

export async function requireAdmin(): Promise<Session> {
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