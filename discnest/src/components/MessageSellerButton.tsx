'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import ChatModal from '@/components/ChatModal';
import GradientButton from './ui/GradientButton';
import { MessageCircle } from 'lucide-react';

type MessageSellerButtonProps = {
  sellerId: string;
  listingId: string;
};

export default function MessageSellerButton({
  sellerId,
  listingId,
}: MessageSellerButtonProps) {
  const { data: session } = useSession();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClick() {
    if (!session?.user?.id) {
      alert('Log in to message seller'); // replace with toast if you have one
      return;
    }

    setIsLoading(true);
    try {
      // Create or get existing thread
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: sellerId,
          listingId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Error creating or finding thread:', data.error);
        return;
      }

      // Open chat modal with the thread
      setThreadId(data._id);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <GradientButton label={isLoading ? 'Loading...' : 'Message Seller'} 
        onClick={handleClick} 
        variant="blue" 
        icon={<MessageCircle className="w-5 h-5" />}
      />
      {threadId && (
        <ChatModal threadId={threadId} onClose={() => setThreadId(null)} />
      )}
    </>
  );
}
