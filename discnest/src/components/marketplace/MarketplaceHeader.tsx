'use client';
import GradientButton from '@/components/ui/GradientButton';
import { MessageCircle, PlusCircle } from 'lucide-react';

type Props = {
  onCreate: () => void;
};

export default function MarketplaceHeader({ onCreate }: Props) {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-8">
      <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] via-[var(--accent)] to-[var(--primary)] drop-shadow-md">
        Disc Marketplace
      </h1>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <GradientButton
          label="Messages"
          href="/messages"
          icon={<MessageCircle className="w-5 h-5" />}
          variant="blueGradient"
        />
        <GradientButton
          label="Create Listing"
          onClick={onCreate}
          icon={<PlusCircle className="w-5 h-5" />}
          variant="accentGradient"
        />
      </div>
    </header>
  );
}
