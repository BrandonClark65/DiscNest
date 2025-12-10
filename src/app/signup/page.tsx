'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import GradientButton from '@/components/ui/GradientButton';
import { Disc, UserPlus } from 'lucide-react';
import { useAnalytics } from '@/lib/useAnalytics';

export default function SignupPage() {
  const { trackEvent, trackConversion } = useAnalytics();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getPasswordStrength = () => {
    if (password.length < 6) return 'Weak';
    if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) 
      return 'Strong';
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

    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (parseError) {
      setError('Failed to process server response. Please try again.');
      return;
    }

    if (!res.ok) {
      setError(data.error || 'Something went wrong');
      return;
    }

    const loginRes = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (loginRes?.error) {
      setError('Signup succeeded but login failed');
    } else {
      // Track user signup event (conversion)
      trackEvent('user_signup', {
        user_email: email, // Note: GA4 will hash this automatically if configured
      });
      trackConversion('user_signup', 0, 'USD', {
        user_email: email,
      });
      
      router.push('/profile');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-background">
      <div
        className="
          w-full max-w-md 
          bg-surface 
          border border-gray-200/80 
          rounded-2xl 
          shadow-lg 
          p-8
        "
      >
        {/* Header */}
        <div className="text-center mb-6">
          <Disc className="w-10 h-10 mx-auto text-accent" />
          <h1 className="text-3xl font-heading font-bold mt-3 text-foreground">
            Create Your Account
          </h1>
          <p className="text-sm text-secondary">
            Join DiscNest and start building your bag
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSignup} className="space-y-4">
          {/* Name */}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="
              w-full px-4 py-3 
              rounded-xl 
              bg-background 
              border border-gray-300/80 
              focus:ring-2 focus:ring-primary
              outline-none text-foreground
              placeholder:text-gray-400
            "
            required
          />

          {/* Email */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`
              w-full px-4 py-3 rounded-xl 
              bg-background border 
              ${email && !isEmailValid ? 'border-red-500' : 'border-gray-300/80'}
              focus:ring-2 focus:ring-primary
              text-foreground outline-none
              placeholder:text-gray-400
            `}
            required
          />

          {!isEmailValid && email && (
            <p className="text-red-500 text-sm">Invalid email format</p>
          )}

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full px-4 py-3 
                rounded-xl 
                bg-background 
                border border-gray-300/80
                focus:ring-2 focus:ring-primary
                text-foreground outline-none
                placeholder:text-gray-400
              "
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-secondary text-sm hover:text-foreground"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {/* Password strength */}
          {password && (
            <p
              className={`
                text-sm 
                ${
                  getPasswordStrength() === 'Weak'
                    ? 'text-red-500'
                    : getPasswordStrength() === 'Medium'
                    ? 'text-yellow-500'
                    : 'text-green-600'
                }
              `}
            >
              Password strength: {getPasswordStrength()}
            </p>
          )}

          {/* Error */}
          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* Submit */}
          <GradientButton
            label="Sign Up"
            icon={<UserPlus className="w-5 h-5" />}
            className="w-full mt-2"
            type="submit"
          />
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-3 text-sm text-secondary">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Social */}
        <div className="space-y-3">
          <button
            onClick={async () => {
              // Track social signup attempt
              trackEvent('user_signup', {
                signup_method: 'google',
              });
              await signIn('google', { callbackUrl: '/profile' });
            }}
            className="
              w-full py-3 rounded-xl 
              bg-[#4285F4] text-white font-medium
              hover:bg-[#3574D4] transition
            "
          >
            Continue with Google
          </button>

          {/* <button
            onClick={() => signIn('facebook')}
            className="
              w-full py-3 rounded-xl 
              bg-[#1877F2] text-white font-medium
              hover:bg-[#1665d8] transition
            "
          >
            Continue with Facebook
          </button> */}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-secondary mt-6">
          Already have an account?{' '}
          <a
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
