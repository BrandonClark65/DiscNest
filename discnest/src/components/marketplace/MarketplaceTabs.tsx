'use client';
import GradientButton from '@/components/ui/GradientButton';

type Props = {
  activeTab: 'market' | 'myListings';
  setActiveTab: (tab: 'market' | 'myListings') => void;
  myListingsTab: 'active' | 'sold';
  setMyListingsTab: (tab: 'active' | 'sold') => void;
  userId?: string;
};

export default function MarketplaceTabs({ activeTab, setActiveTab, myListingsTab, setMyListingsTab, userId }: Props) {
  return (
    <>
      <div className="flex justify-center sm:justify-start border-b border-[var(--muted)]/30 mb-6">
        {['market', 'myListings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm sm:text-base font-semibold transition-colors duration-200 ${
              activeTab === tab
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                : 'text-foreground/60 hover:text-[var(--primary)]'
            }`}
          >
            {tab === 'market' ? 'Marketplace' : 'My Listings'}
          </button>
        ))}
      </div>

      {activeTab === 'myListings' && userId && (
        <div className="flex gap-3 mb-6 ml-2">
          <GradientButton
            label="Active"
            onClick={() => setMyListingsTab('active')}
            variant={myListingsTab === 'active' ? 'blueGradient' : 'muted'}
            className="px-4 py-2 text-sm"
          />
          <GradientButton
            label="Sold"
            onClick={() => setMyListingsTab('sold')}
            variant={myListingsTab === 'sold' ? 'accent' : 'muted'}
            className="px-4 py-2 text-sm"
          />
        </div>
      )}
    </>
  );
}
