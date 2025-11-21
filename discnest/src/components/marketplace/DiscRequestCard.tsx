"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import GradientButton from "@/components/ui/GradientButton";
import { MessageCircle } from "lucide-react";

type Props = {
  request: any;
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

    const res = await fetch("/api/threads/start", {
      method: "POST",
      body: JSON.stringify({
        otherUserId: requester._id,
        requestId: request._id,
      }),
    });

    const data = await res.json();
    if (res.ok && data.threadId) {
      router.push(`/messages/${data.threadId}`);
    }
  };

  return (
    <div className="p-4 rounded-xl shadow bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-3">
        {requester?.image ? (
          <Image
            src={requester.image}
            alt="avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-300 rounded-full" />
        )}
        <div>
          <p className="font-semibold">{requester?.name || "User"}</p>
          {distance && (
            <p className="text-sm text-gray-500">{distance} miles away</p>
          )}
        </div>
      </div>

      <h3 className="font-bold text-lg">{request.title}</h3>
      {request.description && (
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
          {request.description}
        </p>
      )}

      <div className="mt-4">
        <GradientButton
          label="Message Requester"
          icon={<MessageCircle className="w-4 h-4" />}
          onClick={handleMessage}
        />
      </div>
    </div>
  );
}
