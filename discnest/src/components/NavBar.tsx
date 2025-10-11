'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react'; // if not already imported


export default function NavBar() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log('Session:', session);
  }, [session]);


  return (
    <nav className="bg-green-700 text-white px-6 py-3 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold hover:text-green-200">
        DiscNest
      </Link>

      <div className="space-x-4 text-sm flex items-center">
        <Link href='/marketplace' className="hover:text-green-200">Marketplace</Link>
        <Link href="/gear" className="hover:text-green-200">Gear</Link>
        <Link href="/catalog" className="hover:text-green-200">Catalog</Link>
        <Link href="/profile" className="hover:text-green-200">Profile</Link>

        {status === 'loading' ? null : session ? (
          <>
            <span className="italic">Hi, {session.user?.name?.split(' ')[0]}</span>
            {status === 'authenticated' && session?.user?.role === 'admin' && (
                <Link href="/admin" className="hover:text-green-200">Admin</Link>
            )}
            <button
              onClick={() => signOut()}
              className="ml-2 bg-white text-green-700 px-3 py-1 rounded hover:bg-green-100 transition"
            >
              Logout
            </button>
          </>
        ) : (
          <Link href="/login" className="hover:text-green-200">Login</Link>
        )}
      </div>
    </nav>
  );
}