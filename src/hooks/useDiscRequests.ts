"use client";

import { useEffect, useState } from "react";

export type DiscRequest = {
  _id: string;
  title: string;
  description?: string;
  brand?: string;
  plastic?: string;
  weight?: number;
  color?: string;
  condition?: string;
  distanceMeters?: number;
  userId: {
    _id: string;
    name?: string;
    image?: string;
  };
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
};

export default function useDiscRequests() {
  const [requests, setRequests] = useState<DiscRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      () => setUserLocation(null)
    );
  }, []);

  // Fetch requests
  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        let url = `/api/requests?page=${page}&limit=10`;

        if (userLocation) {
          url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        const reqs = (data.requests ?? []) as DiscRequest[];
        setRequests(reqs);

        // fallback for pagination if API doesn't send total
        const count = data.total ?? reqs.length;
        setTotalPages(Math.ceil(count / 10));
      } catch (err) {
        console.error("Failed to load disc requests:", err);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [page, userLocation]);

  return {
    requests,
    loading,
    page,
    setPage,
    totalPages,
  };
}
