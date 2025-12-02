"use client";

import useDiscRequests from "@/hooks/useDiscRequests";
import DiscRequestCard from "./DiscRequestCard";
import MarketplacePagination from "@/components/marketplace/MarketplacePagination";
import { Loader2 } from "lucide-react";

export default function RequestsTab({ currentUserId }: { currentUserId?: string }) {
  const { requests, loading, page, setPage, totalPages } = useDiscRequests();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return <p className="text-center text-gray-500">No disc requests yet.</p>;
  }

  return (
    <div>
      {/* GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {requests.map((req) => (
          <DiscRequestCard
            key={req._id}
            request={req}
            currentUserId={currentUserId}
          />
        ))}
      </div>

      {/* PAGINATION */}
      <MarketplacePagination
        totalPages={totalPages}
        currentPage={page}
        onPageChange={(newPage) => {
          window.scrollTo({ top: 0, behavior: "smooth" });
          setPage(newPage);
        }}
      />
    </div>
  );
}
