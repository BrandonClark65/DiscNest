'use client';

import type { Disc } from '@/types/disc';
import { getContrastColor } from '@/lib/colors';
import toast from 'react-hot-toast';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';

type DiscCardProps = {
  disc: Disc;
  actionLabel?: string;
  onAction?: () => void;
  onDelete?: () => void;
  onEdit?: (disc: Disc) => void;
  onHover?: (disc: Disc | null) => void;
  isRecentlyAdded?: boolean;
  className?: string;
  circleView?: boolean;

  // ✅ Optional drag handle props
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

export default function DiscCard({
  disc,
  actionLabel,
  onAction,
  onDelete,
  onEdit,
  onHover,
  isRecentlyAdded = false,
  className = '',
  circleView = false,
  dragHandleProps,
}: DiscCardProps) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const textColor = getContrastColor(disc.color ?? '#ffffff');

  const handleActionClick = () => {
    if (!isLoggedIn) {
      toast('Log in to Add Discs to Shelf');
      return;
    }
    onAction?.();
  };

  return (
    <div
      onMouseEnter={() => !isMobile && onHover?.(disc)}
      onMouseLeave={() => !isMobile && onHover?.(null)}
      onClick={() => isMobile && onHover?.(disc)}
      className={`transition cursor-pointer relative ${className} ${
        isRecentlyAdded
          ? 'ring-2 ring-green-500'
          : 'hover:ring-2 hover:ring-green-500'
      } ${
        circleView
          ? 'rounded-full border shadow-md flex items-center justify-center overflow-hidden'
          : 'border p-4 rounded shadow flex flex-col justify-between'
      }`}
      style={{
        backgroundColor: disc.color ?? '#ffffff',
        color: textColor,
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.4))',
        width: circleView ? 'clamp(260px, 28vw, 320px)' : undefined,
        height: circleView ? 'clamp(260px, 28vw, 320px)' : undefined,
        margin: circleView ? '0 auto' : undefined,
      }}
    >
      {/* ✅ Floating drag handle above the disc */}
      {circleView && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="absolute -top-5 left-1/2 -translate-x-1/2 cursor-grab z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/80 rounded-full shadow-sm p-0.5 hover:bg-white text-gray-700 hover:text-gray-900 transition">
            <GripVertical className="w-5 h-5 opacity-80" />
          </div>
        </div>
      )}

      {/* Inner Wrapper */}
      <div
        className={`transition-transform duration-300 ease-in-out ${
          circleView
            ? 'flex flex-col items-center justify-center scale-[0.9] md:scale-[0.95] lg:scale-[1]'
            : 'flex flex-col h-full'
        }`}
        style={{
          width: '90%',
          height: circleView ? 'auto' : '100%',
          transformOrigin: 'center center',
          margin: '0 auto',
        }}
      >
        {/* Image */}
        {disc.image && (
          <img
            src={disc.image}
            alt={disc.name}
            onError={(e) => ((e.target as HTMLImageElement).src = '/fallback.jpg')}
            className={`object-contain ${
              circleView
                ? 'w-28 h-28 md:w-36 md:h-36 rounded-full border border-white shadow-inner mb-2'
                : isMobile
                ? 'w-32 h-32 mx-auto object-contain mb-4'
                : 'w-20 h-20 mx-auto object-contain mb-2'
            }`}
          />
        )}

        {/* Info */}
        <div
          className={`text-center ${
            circleView
              ? 'flex flex-col items-center justify-center text-[0.75rem] sm:text-[0.8rem] md:text-[0.85rem] leading-tight mt-1'
              : 'flex flex-col items-center flex-grow space-y-1'
          }`}
        >
          <h3 className="font-bold" style={{ color: textColor }}>
            {disc.name}
          </h3>
          <p style={{ color: textColor }}>
            {disc.brand} • {disc.type} • {disc.stability}
          </p>
          {disc.plastic && (
            <p className="italic" style={{ color: textColor }}>
              Plastic: {disc.plastic}
            </p>
          )}
          {(disc.wearLevel !== undefined || disc.weight) && (
            <p className="italic" style={{ color: textColor }}>
              {disc.wearLevel !== undefined && `Wear: ${disc.wearLevel}`}
              {disc.wearLevel !== undefined && disc.weight ? ' • ' : ''}
              {disc.weight && `Weight: ${disc.weight}g`}
            </p>
          )}
        </div>

        {/* Edit / Delete */}
        {(onEdit || onDelete) && (
          <div className="flex justify-center gap-2 flex-wrap mt-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(disc);
                }}
                className="text-xs hover:underline"
                style={{ color: textColor }}
              >
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-xs hover:underline"
                style={{ color: textColor }}
              >
                🗑️ Remove
              </button>
            )}
          </div>
        )}

        {/* Action Button */}
        {actionLabel && (
          <div
            className={`${
              circleView
                ? 'mt-auto'
                : 'mt-auto pt-3 flex justify-center'
            }`}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleActionClick();
              }}
              className={`bg-green-600 text-white rounded transition-colors duration-200 ${
                circleView
                  ? 'py-1 px-3 text-xs hover:bg-green-700'
                  : isMobile
                  ? 'py-2 px-4 text-lg hover:bg-green-700'
                  : 'py-1.5 px-3 hover:bg-green-700'
              }`}
            >
              {actionLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
