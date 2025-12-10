'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const whitelist = ['/login', '/signup', '/onboarding'];

  useEffect(() => {
    if (
      status === 'authenticated' &&
      session?.user ? (session.user as { hasOnboarded?: boolean }).hasOnboarded : undefined === false &&
      !whitelist.includes(pathname)
    ) {
      router.push('/onboarding');
    }
  }, [status, session, pathname, router]);

  return null;
}