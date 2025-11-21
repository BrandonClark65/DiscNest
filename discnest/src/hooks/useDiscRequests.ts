"use client";

import { useCallback, useEffect, useState } from "react";
import type { DiscRequest } from "@/types/DiscRequest";

type UseDiscRequestsOptions = {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  limit?: number;
};

export default function useDiscRequests(options: UseDiscRequestsOptions = {}) {
  const { latitude, longitude, radiusKm = 250, page = 1, limit = 20 } = options;

  const [requests, setRequests] = useState<DiscRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", limit.toString());

      if (latitude && longitude) {
        params.set("lat", latitude.toString());
        params.set("lng", longitude.toString());
        params.set("radiusKm", radiusKm.toString());
      }

      const res = await fetch(`/api/requests?${params.toString()}`);
      const data = await res.json();

      if (res.ok) {
        setRequests(data.requests || []);
        setTotalPages(Math.ceil((data.total || 0) / limit));
      } else {
        setError(data.error || "Failed to load disc requests");
      }
    } catch (err) {
      setError("Failed to fetch disc requests.");
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude, radiusKm, page, limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    page,
    totalPages,
    refetch: fetchRequests,
  };
}
