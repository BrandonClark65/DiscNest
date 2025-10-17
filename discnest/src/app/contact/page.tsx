'use client';

import { useState } from 'react';

export default function ContactPage() {
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
        setStatus('Message sent successfully!');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        const { error } = await res.json();
        setStatus(`Error: ${error}`);
      }
    } catch (err) {
      setStatus('Something went wrong.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-700">Contact Us</h1>
      <p className="text-gray-600">
        Have questions or feedback? We'd love to hear from you.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="w-full border px-4 py-2 rounded"
        />
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          required
          className="w-full border px-4 py-2 rounded"
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Your message"
          required
          className="w-full border px-4 py-2 rounded h-32"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Send Message
        </button>
        {status && (
          <p
            className={`text-sm ${
              status.includes('Error') ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {status}
          </p>
        )}
      </form>
    </div>
  );
}
