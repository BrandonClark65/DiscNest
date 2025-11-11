'use client';

import DiscCardCatalog from '@/components/catalog/DiscCardCatalog';
import type { Disc } from '@/types/disc';

type Props = {
  discs: Disc[];
  addedDiscId: string | null;
  onAdd: (id: string, target: 'shelf' | 'bag') => void;
  onHover: (disc: Disc | null) => void;
};

export default function CatalogGrid({ discs, addedDiscId, onAdd, onHover }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {discs.map((disc) => (
        <DiscCardCatalog
          key={disc._id}
          disc={disc}
          actionLabel="Add to Shelf"
          onAction={() => onAdd(disc._id, 'shelf')}
          onHover={onHover}
          isRecentlyAdded={addedDiscId === disc._id}
        />
      ))}
    </div>
  );
}
