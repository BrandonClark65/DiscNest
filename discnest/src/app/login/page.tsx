'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid email or password');
    } else {
      router.push('/profile');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Login to DiscNest</h1>

      <form onSubmit={handleCredentialsLogin} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          required
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Login with Email
        </button>
      </form>

      <div className="text-center text-sm text-gray-500">or</div>

      <div className="space-y-2">
        <button
          onClick={() => signIn('google')}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn('facebook')}
          className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900"
        >
          Continue with Facebook
        </button>
      </div>

      <p className="text-center text-sm mt-4">
        Don’t have an account?{' '}
        <a href="/signup" className="text-green-600 hover:underline">
          Sign up
        </a>
      </p>
    </div>
  );
}