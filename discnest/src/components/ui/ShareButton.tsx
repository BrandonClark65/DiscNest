'use client';

import { Share2, Copy } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

type ShareButtonProps = {
  title: string;
  text?: string;
  url: string;
  label?: string;
  className?: string;
};

export default function ShareButton({
  title,
  text,
  url,
  label = 'Share',
  className = '',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-90 transition ${className}`}
    >
      {copied ? <Copy size={16} /> : <Share2 size={16} />}
      <span>{copied ? 'Copied!' : label}</span>
    </button>
  );
}
