"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RequestDetail from "@/components/marketplace/RequestDetail";

export default function RequestPage() {
  const params = useParams();
  const id = params.id;

  interface DiscRequest {
    _id: string;
    title: string;
    description?: string;
    brand?: string;
    plastic?: string;
    weight?: number;
    color?: string;
    condition?: string;
    userId?: string | { _id: string; name?: string; username?: string };
    location?: { coordinates: [number, number] };
    [key: string]: unknown;
  }

  const [request, setRequest] = useState<DiscRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const res = await fetch(`/api/requests/${id}`);
        if (!res.ok) throw new Error("Failed to load request");
        const data = await res.json();
        setRequest(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error loading request";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) return <div className="p-8">Loading request...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!request) return <div className="p-8">Request not found.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <RequestDetail request={request} />
    </div>
  );
}
