'use client';

import { useState } from 'react';
import GradientButton from '@/components/ui/GradientButton';
import Breadcrumbs from '@/components/Breadcrumbs';
import { useAnalytics } from '@/lib/useAnalytics';

export default function ContactPage() {
  const { trackEvent } = useAnalytics();
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Sending...');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      });

      if (res.ok) {
        setStatus('✅ Message sent successfully!');
        
        // Track contact form submission
        trackEvent('contact_form_submit', {
          subject: subject,
        });
        
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        const { error } = await res.json();
        setStatus(`Error: ${error}`);
      }
    } catch {
      setStatus('Something went wrong. Please try again later.');
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6 sm:p-10 space-y-6 text-[var(--foreground)]">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Contact', href: '/contact' }]} className="mb-4" />
      
      {/* Header */}
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-sm">
          Contact Us
        </h1>
        <p className="text-[var(--foreground)]/70 text-sm sm:text-base">
          Have questions, feedback, or ideas? We’d love to hear from you.
        </p>
      </header>

      {/* Form */}
      <section>
        <form
          onSubmit={handleSubmit}
        className="
          bg-[var(--surface)] border border-[var(--muted)]/30 rounded-2xl shadow-sm
          p-5 sm:p-8 space-y-5 transition-all
        "
      >
        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]/90">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="
              w-full bg-[var(--background)] border border-[var(--muted)]/40
              rounded-lg px-4 py-2 text-sm
              text-[var(--foreground)] placeholder-[var(--foreground)]/50
              focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]/90">
            Subject
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's this about?"
            required
            className="
              w-full bg-[var(--background)] border border-[var(--muted)]/40
              rounded-lg px-4 py-2 text-sm
              text-[var(--foreground)] placeholder-[var(--foreground)]/50
              focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40
            "
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-[var(--foreground)]/90">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            required
            className="
              w-full bg-[var(--background)] border border-[var(--muted)]/40
              rounded-lg px-4 py-2 text-sm h-32 resize-none
              text-[var(--foreground)] placeholder-[var(--foreground)]/50
              focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40
            "
          />
        </div>

        <div className="flex justify-center sm:justify-end">
          <GradientButton
            label="Send Message"
            type="submit"
            variant="primary"
            className="px-8 py-3"
          />
        </div>

        {status && (
          <p
            className={`text-sm text-center mt-2 ${
              status.startsWith('Error') || status.includes('wrong')
                ? 'text-red-500'
                : 'text-green-500'
            }`}
          >
            {status}
          </p>
        )}
      </form>
      </section>
    </main>
  );
}
