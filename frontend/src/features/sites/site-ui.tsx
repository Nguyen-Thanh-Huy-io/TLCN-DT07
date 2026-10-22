'use client';

import { useState } from 'react';
import { Castle, Crown, Landmark, MapPin, Mountain, Pickaxe, Shield, Swords, Tent, type LucideIcon } from 'lucide-react';
import { LOCATION_TYPE_LABELS, LocationType } from '@/constants/enums';

export const SITE_TYPE_ICONS: Record<string, LucideIcon> = {
  [LocationType.ANCIENT_CAPITAL]: Crown,
  [LocationType.CITADEL]: Castle,
  [LocationType.PALACE]: Landmark,
  [LocationType.BATTLEFIELD]: Swords,
  [LocationType.RESISTANCE_BASE]: Tent,
  [LocationType.TEMPLE]: Mountain,
  [LocationType.ARCHAEOLOGICAL_SITE]: Pickaxe,
  [LocationType.MONUMENT]: Shield,
  [LocationType.OTHER]: MapPin,
};

export const siteTypeLabel = (code: string | undefined) =>
  LOCATION_TYPE_LABELS[(code as LocationType) ?? LocationType.OTHER] ?? LOCATION_TYPE_LABELS[LocationType.OTHER];

/**
 * Ảnh di tích; thiếu ảnh hoặc ảnh hỏng thì hiện nền + biểu tượng loại di tích,
 * KHÔNG dùng ảnh ngẫu nhiên (trước đây gắn ảnh Unsplash không phải của di tích).
 */
export function SiteImage({ src, alt, siteType, className = '' }: { src?: string | null; alt: string; siteType?: string; className?: string }) {
  const [broken, setBroken] = useState(false);
  const Icon = SITE_TYPE_ICONS[siteType ?? LocationType.OTHER] ?? MapPin;
  if (!src || broken) {
    return (
      <div className={`st-image-fallback ${className}`} role="img" aria-label={alt}>
        <Icon />
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setBroken(true)} />;
}
