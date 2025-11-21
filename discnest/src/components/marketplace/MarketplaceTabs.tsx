'use client';
import GradientButton from '@/components/ui/GradientButton';

type TabType = 'market' | 'myListings' | 'requests';

type Props = {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  myListingsTab: 'active' | 'sold';
  setMyListingsTab: (tab: 'active' | 'sold') => void;
  userId?: string;
  includeRequestsTab?: boolean;
};

export default function MarketplaceTabs({
  activeTab,
  setActiveTab,
  myListingsTab,
  setMyListingsTab,
  userId,
  includeRequestsTab = false,
}: Props) {
  
  // Build the tab list dynamically
  const tabs: TabType[] = ['market', 'myListings'];
  if (includeRequestsTab) tabs.push('requests');

  const labelMap: Record<TabType, string> = {
    market: 'Marketplace',
    myListings: 'My Listings',
    requests: 'Requests',
  };

  return (
    <>
      {/* MAIN TABS */}
      <div className="flex justify-center sm:justify-start border-b border-[var(--muted)]/30 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm sm:text-base font-semibold transition-colors duration-200 ${
              activeTab === tab
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                : 'text-foreground/60 hover:text-[var(--primary)]'
            }`}
          >
            {labelMap[tab]}
          </button>
        ))}
      </div>

      {/* MY LISTINGS SUB-TABS */}
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
