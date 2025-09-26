'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getPasswordStrength = () => {
    if (password.length < 6) return 'Weak';
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) return 'Strong';
    return 'Medium';
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isEmailValid) {
      setError('Please enter a valid email address');
      return;
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      return;
    }

    // ✅ Auto-login after signup
    const loginRes = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (loginRes?.error) {
      setError('Signup succeeded but login failed');
    } else {
      router.push('/onboarding'); // ✅ Redirect for first-time users
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-center">Create Your DiscNest Account</h1>

      <form onSubmit={handleSignup} className="space-y-4">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border px-4 py-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={`w-full border px-4 py-2 rounded ${email && !isEmailValid ? 'border-red-500' : ''}`}
          required
        />
        {!isEmailValid && email && (
          <p className="text-red-500 text-sm">Invalid email format</p>
        )}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 text-sm text-gray-500 hover:text-gray-700"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {password && (
          <p className={`text-sm ${getPasswordStrength() === 'Weak' ? 'text-red-500' : getPasswordStrength() === 'Medium' ? 'text-yellow-500' : 'text-green-600'}`}>
            Password strength: {getPasswordStrength()}
          </p>
        )}
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Sign Up
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
        Already have an account?{' '}
        <a href="/login" className="text-green-600 hover:underline">
          Log in
        </a>
      </p>
    </div>
  );
}