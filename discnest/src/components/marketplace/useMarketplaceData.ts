'use client';

import { useEffect, useState } from 'react';
import type { Listing } from '@/types/listing';
import { useSession } from 'next-auth/react';

export function useMarketplaceData() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const [marketListings, setMarketListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [activeTab, setActiveTab] = useState<'market' | 'myListings'>('market');
  const [myListingsTab, setMyListingsTab] = useState<'active' | 'sold'>('active');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [marketPage, setMarketPage] = useState(1);
  const [marketTotalPages, setMarketTotalPages] = useState(1);
  const [myPage, setMyPage] = useState(1);
  const [myTotalPages, setMyTotalPages] = useState(1);

  // Fetch current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null)
    );
  }, []);

  // Generic fetch helper
  const fetchListings = async (mode: 'marketplace' | 'myListings', pageToFetch = 1) => {
    setLoading(true);
    try {
      let url = `/api/listings?mode=${mode}&page=${pageToFetch}&limit=${mode === 'marketplace' ? 20 : 100}`;

      if (mode === 'marketplace') {
        if (userLocation) url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
        if (brandFilter) url += `&brand=${encodeURIComponent(brandFilter)}`;
        if (conditionFilter) url += `&condition=${encodeURIComponent(conditionFilter)}`;
        if (userId) url += `&excludeUserId=${userId}`;
      } else if (mode === 'myListings' && userId) {
        url += `&userId=${userId}`;
      }

      const res = await fetch(url);
      const data: { listings: Listing[]; totalCount: number } = await res.json();

      const valid = (data.listings || []).filter(
        (l) => l && l._id && l.title && l.location?.coordinates?.length === 2
      );
      const totalPages = Math.ceil((data.totalCount || valid.length) / (mode === 'marketplace' ? 20 : 100));

      return { listings: valid, totalPages };
    } catch {
      return { listings: [], totalPages: 1 };
    } finally {
      setLoading(false);
    }
  };

  // Load marketplace
  useEffect(() => {
    if (activeTab !== 'market' || status === 'loading') return;
    const load = async () => {
      const { listings, totalPages } = await fetchListings('marketplace', marketPage);
      const filtered = userId
        ? listings.filter((l) => {
            const ownerId = typeof l.userId === 'string' ? l.userId : String((l.userId as any)?._id || '');
            return ownerId !== userId;
          })
        : listings;
      setMarketListings(filtered);
      setMarketTotalPages(totalPages);
    };
    load();
  }, [activeTab, userLocation, searchQuery, brandFilter, conditionFilter, marketPage, userId, status]);

  // Load my listings
  useEffect(() => {
    if (activeTab !== 'myListings' || !userId) return;
    const load = async () => {
      const { listings, totalPages } = await fetchListings('myListings', myPage);
      setMyListings(listings);
      setMyTotalPages(totalPages);
    };
    load();
  }, [activeTab, userId, myListingsTab, myPage]);

  // Reset and scroll
  useEffect(() => setMarketPage(1), [searchQuery, brandFilter, conditionFilter]);
  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [marketPage, myPage]);

  const listingsToShow =
    activeTab === 'market'
      ? marketListings
      : myListingsTab === 'active'
      ? myListings.filter((l) => !l.sold)
      : myListings.filter((l) => l.sold);

  return {
    session,
    loading,
    listingsToShow,
    activeTab,
    setActiveTab,
    myListingsTab,
    setMyListingsTab,
    searchQuery,
    setSearchQuery,
    brandFilter,
    setBrandFilter,
    conditionFilter,
    setConditionFilter,
    userLocation,
    marketPage,
    setMarketPage,
    marketTotalPages,
    myPage,
    setMyPage,
    myTotalPages,
    userId,
    setMyListings,
  };
}
