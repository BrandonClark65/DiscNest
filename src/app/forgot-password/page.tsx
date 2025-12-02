'use client';

import { useState } from 'react';
import { Disc } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong');
      } else {
        setMessage(
          'If an account with that email exists, a reset link has been sent.'
        );
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
            Reset Password
          </h1>
          <p className="text-sm text-secondary">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          {message && (
            <p className="text-sm text-center text-emerald-600">{message}</p>
          )}
          {error && (
            <p className="text-sm text-center text-red-500">{error}</p>
          )}

          <GradientButton
            label={submitting ? 'Sending link...' : 'Send reset link'}
            className="w-full"
            type="submit"
            disabled={submitting}
          />
        </form>

        <p className="text-center text-sm text-secondary mt-6">
          Remembered your password?{' '}
          <a
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}
