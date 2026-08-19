'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Download, Twitter, Facebook } from 'lucide-react';
import toast from 'react-hot-toast';
import { trackEvent } from '@/lib/analytics';

type ShareMenuProps = {
  /** Page URL to share. */
  url: string;
  /** Pre-written share text. */
  text: string;
  /** Title for the native share sheet. */
  title: string;
  /** Absolute URL of the share image (PNG) for native share and download. */
  imageUrl?: string;
  /** Slug of the pro being compared, for analytics. */
  proSlug?: string;
  className?: string;
};

/**
 * Sharing for the pro comparison. Richer than the plain ShareButton (which is
 * left untouched for its existing callers): a native share sheet that carries
 * the generated image where the browser allows it, direct intents for the
 * places disc golfers actually gather (Reddit, Facebook, X), and a download so
 * there is always a path that works.
 */
export default function ShareMenu({
  url,
  text,
  title,
  imageUrl,
  proSlug,
  className = '',
}: ShareMenuProps) {
  const [copied, setCopied] = useState(false);

  const record = (channel: string) =>
    trackEvent('share_pro_handicap', { share_channel: channel, pro_slug: proSlug });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied!');
      record('copy');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link.');
    }
  };

  /** Fetch the share image as a File, or null if it cannot be loaded. */
  const fetchImageFile = async (): Promise<File | null> => {
    if (!imageUrl) return null;
    try {
      const res = await fetch(imageUrl);
      if (!res.ok) return null;
      const blob = await res.blob();
      return new File([blob], 'discnest-handicap.png', { type: 'image/png' });
    } catch {
      return null;
    }
  };

  const nativeShare = async () => {
    // Try to share the image itself where the browser and platform allow it -
    // this is what makes a one-tap post to Instagram or a story possible.
    const file = await fetchImageFile();
    const nav = navigator as Navigator & {
      canShare?: (data?: ShareData) => boolean;
    };

    if (file && nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title, text, url, files: [file] });
        record('native_image');
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        record('native');
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }

    // No share sheet available (most desktops): fall back to copying.
    await copyLink();
  };

  const downloadImage = async () => {
    const file = await fetchImageFile();
    if (!file) {
      toast.error('Image not ready yet. Try again in a moment.');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
    record('download');
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const intents: Array<{ label: string; href: string; channel: string; Icon: typeof Twitter }> = [
    {
      label: 'X',
      channel: 'x',
      Icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    },
    {
      label: 'Reddit',
      channel: 'reddit',
      // Reddit has no lucide glyph; reuse Share2 below via a text button instead.
      Icon: Share2,
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`,
    },
    {
      label: 'Facebook',
      channel: 'facebook',
      Icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ];

  const pill =
    'flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button
        onClick={nativeShare}
        className={`${pill} bg-[var(--primary)]/90 hover:bg-[var(--primary)] text-white shadow-md`}
        title="Share"
      >
        <Share2 size={16} /> Share
      </button>

      <button
        onClick={copyLink}
        className={`${pill} border border-[var(--muted)]/40 text-[var(--foreground)] hover:border-[var(--primary)]/60`}
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied' : 'Copy link'}
      </button>

      {intents.map(({ label, href, channel, Icon }) => (
        <a
          key={channel}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => record(channel)}
          className={`${pill} border border-[var(--muted)]/40 text-[var(--foreground)] hover:border-[var(--primary)]/60`}
        >
          <Icon size={16} /> {label}
        </a>
      ))}

      {imageUrl && (
        <button
          onClick={downloadImage}
          className={`${pill} border border-[var(--muted)]/40 text-[var(--foreground)] hover:border-[var(--primary)]/60`}
        >
          <Download size={16} /> Image
        </button>
      )}
    </div>
  );
}
