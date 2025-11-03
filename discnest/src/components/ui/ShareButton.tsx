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
      className={`
        flex items-center gap-2 px-3 py-2 rounded-full
        bg-[var(--primary)]/85 
        hover:bg-[var(--primary)]/95 
        text-[var(--background)]
        shadow-md hover:shadow-lg
        border border-[var(--primary)]/20
        transition-all duration-200
        ${className}
      `}
      title="Share this page"
    >
      {copied ? (
        <Copy size={16} className="opacity-90" />
      ) : (
        <Share2 size={16} className="opacity-90" />
      )}
      <span className="font-medium text-sm">
        {copied ? 'Copied!' : label}
      </span>
    </button>
  );
}
