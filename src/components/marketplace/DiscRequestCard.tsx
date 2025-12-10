"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import GradientButton from "@/components/ui/GradientButton";
import { MessageCircle, MapPin } from "lucide-react";

interface DiscRequest {
  _id: string;
  title: string;
  description?: string;
  brand?: string;
  plastic?: string;
  weight?: number;
  condition?: string;
  userId?: { _id: string; username?: string; name?: string; avatarUrl?: string };
  distanceMeters?: number;
  [key: string]: unknown;
}

type Props = {
  request: DiscRequest;
  currentUserId?: string;
};

export default function DiscRequestCard({ request, currentUserId }: Props) {
  const router = useRouter();

  const requester = request.userId;
  const distance =
    request.distanceMeters != null
      ? (request.distanceMeters / 1609).toFixed(1)
      : null;

  const handleMessage = async () => {
  if (!currentUserId) {
    router.push("/login");
    return;
  }

  if (!requester) {
    console.error("Requester not found");
    return;
  }

  const res = await fetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: requester._id,
      requestId: request._id,
      content: "Hi! I saw your disc request.",
    }),
  });

  const data = await res.json();
  if (res.ok && data._id) {
    router.push(`/messages?thread=${data._id}`);
  }
};


  return (
    <div
      onClick={() => router.push(`/requests/${request._id}`)}
      className="
        p-4 rounded-xl shadow 
        bg-[var(--surface)] border border-[var(--muted)]/30 
        hover:shadow-lg hover:border-[var(--primary)]/40 
        transition cursor-pointer
      "
    >
      {/* HEADER: User + Distance */}
      <div className="flex items-center gap-3 mb-4">
        {requester?.avatarUrl ? (
          <Image
            src={requester.avatarUrl}
            alt={`${requester?.username || requester?.name || 'User'}'s profile picture`}
            width={44}
            height={44}
            className="rounded-full border border-[var(--muted)]/40"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[var(--muted)]/30" />
        )}

        <div className="flex flex-col">
          <p className="font-semibold text-[var(--foreground)] leading-tight">
            {requester?.username ||requester?.name || "User"}
          </p>
          {distance && (
            <p className="flex items-center gap-1 text-xs text-foreground/60">
              <MapPin className="w-3 h-3" />
              {distance} miles away
            </p>
          )}
        </div>
      </div>

      {/* TITLE */}
      <h3 className="font-bold text-xl text-[var(--foreground)] mb-2">
        {request.title}
      </h3>

      {/* TAGS */}
      <div className="flex flex-wrap gap-2 mb-3">
        {request.brand && (
          <span className="px-2 py-1 text-xs rounded bg-[var(--primary)]/10 text-[var(--primary)] font-medium">
            {request.brand}
          </span>
        )}

        {request.plastic && (
          <span className="px-2 py-1 text-xs rounded bg-[var(--accent)]/10 text-[var(--accent)] font-medium">
            {request.plastic}
          </span>
        )}

        {request.weight && (
          <span className="px-2 py-1 text-xs rounded bg-[var(--muted)]/20 text-[var(--foreground)] font-medium">
            {request.weight}g
          </span>
        )}

        {request.condition && (
          <span className="px-2 py-1 text-xs rounded bg-[var(--surface)]/80 text-[var(--foreground)] font-medium border border-[var(--muted)]/30">
            {request.condition}
          </span>
        )}
      </div>

      {/* DESCRIPTION */}
      {request.description && (
        <p className="text-sm text-foreground/70 mb-4 line-clamp-3">
          {request.description}
        </p>
      )}

      {/* BOTTOM ACTIONS */}
      <div className="flex justify-start">
        <div onClick={(e) => e.stopPropagation()}>
            <GradientButton
                label="Message"
                icon={<MessageCircle className="w-4 h-4" />}
                onClick={handleMessage}
                variant="blueGradient"
                className="px-4 py-2 text-sm"
            />
            </div>
      </div>
    </div>
  );
}
