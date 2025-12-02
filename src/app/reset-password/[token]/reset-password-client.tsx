'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Disc, Eye, EyeOff } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function ResetPasswordClientPage({ token }: { token: string }) {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setMessage('Password updated! Redirecting to login...');
        setTimeout(() => router.push('/login'), 1800);
      }
    } catch (err) {
      console.error(err);
      setError('Something went wrong');
    } finally {
      setSubmitting(false);
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
        <div className="text-center mb-6">
          <Disc className="w-10 h-10 mx-auto text-accent" />
          <h1 className="text-3xl font-heading font-bold mt-3 text-foreground">
            Set a New Password
          </h1>
          <p className="text-sm text-secondary">
            Enter and confirm your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* New Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
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

          {/* Confirm Password */}
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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

            <button
              type="button"
              onClick={() => setShowConfirm((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {message && (
            <p className="text-sm text-center text-emerald-600">{message}</p>
          )}
          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <GradientButton
            label={submitting ? 'Updating password...' : 'Update password'}
            className="w-full"
            disabled={submitting}
            type="submit"
          />
        </form>
      </div>
    </div>
  );
}
