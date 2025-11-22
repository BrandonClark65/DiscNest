"use client";

import Image from "next/image";
import { useState } from "react";
import GradientButton from "@/components/ui/GradientButton";

type ProfileHeaderProps = {
  name: string;
  discCount: number;
  avatarUrl?: string;
};

export default function ProfileHeader({
  name,
  discCount,
  avatarUrl,
}: ProfileHeaderProps) {
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState(avatarUrl);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "profile-pictures");

    setUploading(true);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setUploading(false);

    if (data.avatarUrl) setLocalAvatar(data.avatarUrl);
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      
      {/* LEFT SIDE: Avatar + Welcome */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative w-20 h-20 rounded-full overflow-hidden border border-[var(--muted)] shadow-md flex-shrink-0">
          <Image
            src={localAvatar || "/default-avatar.png"}
            alt="User avatar"
            fill
            className="object-cover"
          />
        </div>

        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] drop-shadow-sm">
            Welcome, {name}
          </h1>
          {/* Change avatar button */}
          <div className="mt-1">
            <input
              id="avatarUpload"
              type="file"
              accept="image/*"
              hidden
              onChange={handleAvatarUpload}
            />

            <GradientButton
              label={uploading ? "Uploading..." : "Change Avatar"}
              variant="muted"
              className="px-3 py-1 text-xs"
              disabled={uploading}
              onClick={() => {
                if (!uploading) document.getElementById("avatarUpload")?.click();
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Disc Count Badge */}
      <div className="bg-[var(--primary)] text-[var(--background)] px-3 py-1 rounded-full text-sm font-semibold shadow-sm w-fit">
        {discCount} Disc{discCount !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
