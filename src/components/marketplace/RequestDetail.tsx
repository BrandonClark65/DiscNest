"use client";

import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GradientButton from "@/components/ui/GradientButton";
import { MessageCircle, MapPin, MoreVertical, ArrowBigLeft, Trash2, Edit } from "lucide-react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import type { DiscRequest as DiscRequestType } from "@/types/DiscRequest";

// Lazy load modals for better performance
const ReportModal = dynamic(() => import("@/components/modals/ReportModal"), {
  ssr: false,
});
const ConfirmModal = dynamic(() => import("@/components/modals/ConfirmModal"), {
  ssr: false,
});
const EditRequestModal = dynamic(() => import("@/components/modals/EditRequestModal"), {
  ssr: false,
});

interface DiscRequest {
  _id: string;
  title: string;
  description?: string;
  brand?: string;
  plastic?: string;
  weight?: number;
  color?: string;
  condition?: string;
  userId?: { _id: string; username?: string; name?: string; avatarUrl?: string };
  location?: { coordinates: [number, number] };
  [key: string]: unknown;
}

export default function RequestDetail({ request }: { request: DiscRequest }) {
  const { data: session } = useSession();
  const router = useRouter();

  const requester = request.userId;
  const [distance, setDistance] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  // Menu and modal state
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the owner
  const currentUserId = session?.user ? (session.user as { id?: string }).id : undefined;
  const isOwner = currentUserId && requester?._id && currentUserId === requester._id;

  /** --------------------------
   *  Distance Calculation
   * -------------------------- */
  useEffect(() => {
    if (!navigator.geolocation || !request.location?.coordinates) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      if (!request.location?.coordinates) return;
      const [lng, lat] = request.location.coordinates;

      const R = 6371; // km
      const dLat = ((pos.coords.latitude - lat) * Math.PI) / 180;
      const dLon = ((pos.coords.longitude - lng) * Math.PI) / 180;

      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat * (Math.PI / 180)) *
          Math.cos(pos.coords.latitude * (Math.PI / 180)) *
          Math.sin(dLon / 2) ** 2;

      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const miles = (R * c) / 1.609;

      setDistance(miles.toFixed(1));
    });
  }, [request.location]);

  /** --------------------------
   *  Message Handler
   * -------------------------- */
  async function handleMessage() {
    if (!session?.user) return router.push("/login");
    if (!requester) {
      console.error("Requester not found");
      return;
    }

    setMessaging(true);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId: requester._id,
        requestId: request._id,
        content: "Hi! I saw your disc request.",
      }),
    });

    const thread = await res.json();
    if (res.ok && thread._id) {
      router.push(`/messages?thread=${thread._id}`);
    }

    setMessaging(false);
  }

  /** --------------------------
   *  Delete Handler
   * -------------------------- */
  async function handleDelete() {
    if (!session?.user) return router.push("/login");
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/requests/${request._id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        toast.success("Request deleted successfully");
        router.push("/marketplace");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete request");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete request");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(false);
    }
  }

  /** --------------------------
   *  Render
   * -------------------------- */
  return (
    <>
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Back Button */}
          <GradientButton
            label="Back to Marketplace"
            href="/marketplace"
            variant="muted"
            icon={<ArrowBigLeft className="w-5 h-5" />}
            className="mb-4"
          />
        {/* Title Row */}
        <div className="flex justify-between items-start mb-6 relative">
          <h1 className="text-3xl font-extrabold text-[var(--foreground)]">
            {request.title}
          </h1>

          {/* Three-dot menu */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-full hover:bg-[var(--muted)]/20 transition"
          >
            <MoreVertical className="w-5 h-5 text-[var(--foreground)]/70" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 w-40 bg-[var(--surface)] border border-[var(--muted)]/40 shadow-lg rounded-xl p-1 z-20">
              {isOwner && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setEditOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--muted)]/20 text-[var(--foreground)] flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Request
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteConfirm(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Request
                  </button>
                </>
              )}
              {!isOwner && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setReportOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-600"
                >
                  Report User
                </button>
              )}
            </div>
          )}
        </div>

        {/* Card Wrapper */}
        <div className="bg-[var(--surface)] border border-[var(--muted)]/30 rounded-xl shadow p-6 space-y-6">
          {/* Requester Row */}
          <div className="flex items-center gap-4">
            {requester?.avatarUrl ? (
              <Image
                src={requester?.avatarUrl}
                alt={`${requester?.username || requester?.name || 'User'}'s profile picture`}
                width={56}
                height={56}
                className="rounded-full border border-[var(--muted)]/40"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[var(--muted)]/30" />
            )}

            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                {requester?.username ||requester?.name || "User"}
              </h2>

              {distance && (
                <p className="flex items-center gap-1 text-sm text-foreground/60">
                  <MapPin className="w-4 h-4" />
                  {distance} miles away
                </p>
              )}
            </div>
          </div>

          {/* Badge Section */}
          <div className="flex flex-wrap gap-2 pt-2">
            {request.brand && (
              <span className="px-3 py-1 text-xs rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
                Brand: {request.brand}
              </span>
            )}
            {request.plastic && (
              <span className="px-3 py-1 text-xs rounded bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
                Plastic: {request.plastic}
              </span>
            )}
            {request.weight && (
              <span className="px-3 py-1 text-xs rounded bg-[var(--muted)]/20 text-[var(--foreground)] font-medium">
                {request.weight}g
              </span>
            )}
            {request.color && (
              <span className="px-3 py-1 text-xs rounded bg-[var(--muted)]/20 text-[var(--foreground)] font-medium">
                Color: {request.color}
              </span>
            )}
            {request.condition && (
              <span className="px-3 py-1 text-xs rounded border border-[var(--muted)]/40 text-[var(--foreground)] font-medium">
                Condition: {request.condition}
              </span>
            )}
          </div>

          {/* Description */}
          {request.description && (
            <div className="pt-4 border-t border-[var(--muted)]/20 text-[var(--foreground)]">
              <h3 className="font-semibold text-lg mb-2">Description</h3>
              <p className="text-foreground/80 leading-relaxed">
                {request.description}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[var(--muted)]/20">
            <GradientButton
              label={messaging ? "Sending..." : "Message Requester"}
              onClick={handleMessage}
              icon={<MessageCircle className="w-5 h-5" />}
              variant="blueGradient"
            />
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        reportedUserId={request.userId?._id || ''}
        requestId={request._id}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Request"
        message="Are you sure you want to delete this request? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={isDeleting}
      />

      {/* Edit Request Modal */}
      <EditRequestModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        request={request as unknown as DiscRequestType}
        onSuccess={() => {
          // Refresh the request data
          window.location.reload();
        }}
      />
    </>
  );
}
