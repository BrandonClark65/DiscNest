'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import GradientButton from '@/components/ui/GradientButton';
import { Disc, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAnalytics } from '@/lib/useAnalytics';

export default function LoginPage() {
  const { trackEvent } = useAnalytics();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      // Track user login event
      trackEvent('user_login', {
        login_method: 'credentials',
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
            Welcome Back
          </h1>
          <p className="text-sm text-secondary">
            Login to continue exploring DiscNest
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCredentialsLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="
              w-full px-4 py-3 
              rounded-xl 
              bg-background 
              border border-gray-300/80 
              focus:ring-2 focus:ring-primary outline-none
              text-foreground
              placeholder:text-gray-400
            "
            required
          />

          {/* Password Input With Toggle */}
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
                focus:ring-2 focus:ring-primary outline-none
                text-foreground
                placeholder:text-gray-400
              "
              required
            />

            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Forgot Password */}
          <div className="text-right">
            <a
              href="/forgot-password"
              className="text-primary text-sm hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <GradientButton
            label="Login with Email"
            icon={<LogIn className="w-5 h-5" />}
            className="w-full mt-1"
            type="submit"
          />
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="px-3 text-sm text-secondary">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Social Logins */}
        <div className="space-y-3">
          <button
            onClick={async () => {
              // Track social login attempt
              trackEvent('user_login', {
                login_method: 'google',
              });
              await signIn('google');
            }}
            className="
              w-full py-3 rounded-xl 
              bg-[#4285F4] text-white font-medium
              hover:bg-[#3574D4] transition
            "
          >
            Continue with Google
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-secondary mt-6">
          Don’t have an account?{' '}
          <a
            href="/signup"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
