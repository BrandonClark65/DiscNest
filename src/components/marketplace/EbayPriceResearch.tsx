'use client';

import { useState, useEffect } from 'react';
import { Search, ExternalLink, DollarSign, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type EbaySearchResponse = {
  success: boolean;
  source: 'url';
  searchUrl?: string;
  message?: string;
  error?: string;
};

type EbayPriceResearchProps = {
  title?: string;
  brand?: string;
  plastic?: string;
  condition?: string;
  onPriceSelect?: (price: number) => void;
};

export default function EbayPriceResearch({
  title,
  brand,
  plastic,
  condition,
  onPriceSelect,
}: EbayPriceResearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<EbaySearchResponse | null>(null);
  const [customSearch, setCustomSearch] = useState({
    title: title || '',
    brand: brand || '',
    plastic: plastic || '',
    condition: condition || '',
  });

  // Update custom search when props change
  useEffect(() => {
    setCustomSearch({
      title: title || '',
      brand: brand || '',
      plastic: plastic || '',
      condition: condition || '',
    });
  }, [title, brand, plastic, condition]);

  const handleSearch = async () => {
    // Validate that at least title or brand is provided
    if (!customSearch.title.trim() && !customSearch.brand.trim()) {
      toast.error('Please enter at least a title or brand to search');
      return;
    }

    setLoading(true);
    setSearchResults(null);

    try {
      const params = new URLSearchParams();
      if (customSearch.title) params.append('title', customSearch.title);
      if (customSearch.brand) params.append('brand', customSearch.brand);
      if (customSearch.plastic) params.append('plastic', customSearch.plastic);
      if (customSearch.condition) params.append('condition', customSearch.condition);

      const response = await fetch(`/api/ebay/search?${params.toString()}`);
      const data: EbaySearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search eBay');
      }

      setSearchResults(data);

      toast.success('Click the link to view sold listings on eBay', {
        duration: 5000,
      });
    } catch (error) {
      console.error('eBay search error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to search eBay');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="border border-[var(--muted)]/40 rounded-lg p-4 bg-[var(--surface)]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[var(--primary)]" />
          <span className="font-medium">Research eBay Sold Prices</span>
        </div>
        <span className="text-sm text-[var(--foreground)]/60">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-[var(--foreground)]/70">
            Search eBay for sold listings to help determine a fair price for your disc.
          </p>

          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ebay-search-title" className="block text-sm font-medium mb-1">Title/Disc Name</label>
              <input
                id="ebay-search-title"
                type="text"
                value={customSearch.title}
                onChange={(e) =>
                  setCustomSearch({ ...customSearch, title: e.target.value })
                }
                placeholder="e.g., Destroyer, Buzzz"
                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--muted)]/40 rounded"
              />
            </div>
            <div>
              <label htmlFor="ebay-search-brand" className="block text-sm font-medium mb-1">Brand</label>
              <input
                id="ebay-search-brand"
                type="text"
                value={customSearch.brand}
                onChange={(e) =>
                  setCustomSearch({ ...customSearch, brand: e.target.value })
                }
                placeholder="e.g., Innova, Discraft"
                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--muted)]/40 rounded"
              />
            </div>
            <div>
              <label htmlFor="ebay-search-plastic" className="block text-sm font-medium mb-1">Plastic (Optional)</label>
              <input
                id="ebay-search-plastic"
                type="text"
                value={customSearch.plastic}
                onChange={(e) =>
                  setCustomSearch({ ...customSearch, plastic: e.target.value })
                }
                placeholder="e.g., Star, Champion"
                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--muted)]/40 rounded"
              />
            </div>
            <div>
              <label htmlFor="ebay-search-condition" className="block text-sm font-medium mb-1">Condition</label>
              <select
                id="ebay-search-condition"
                value={customSearch.condition}
                onChange={(e) =>
                  setCustomSearch({ ...customSearch, condition: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-[var(--background)] border border-[var(--muted)]/40 rounded"
              >
                <option value="">Any Condition</option>
                <option value="New">New</option>
                <option value="Like New">Like New</option>
                <option value="Used">Used</option>
                <option value="Worn">Worn</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search eBay Sold Listings</span>
              </>
            )}
          </button>

          {/* Results */}
          {searchResults && searchResults.searchUrl && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-100 mb-3">
                  {searchResults.message ||
                    'Click the link below to view sold listings on eBay. The search will automatically filter for completed and sold items.'}
                </p>
                <a
                  href={searchResults.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Sold Listings on eBay</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
