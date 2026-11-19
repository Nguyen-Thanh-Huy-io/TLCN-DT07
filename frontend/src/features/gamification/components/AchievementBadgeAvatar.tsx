'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { RemoteImage } from '@/components/common/RemoteImage';
import { ACHIEVEMENT_ICON_MAP } from '../constants/achievement-icons.constant';

interface AchievementBadgeAvatarProps {
  title: string;
  iconKey: string;
  imageUrl?: string | null;
  sizeClass?: string;
  iconSize?: number;
  containerClass?: string;
  dimmed?: boolean;
}

export function AchievementBadgeAvatar({
  title,
  iconKey,
  imageUrl,
  sizeClass = 'size-10',
  iconSize = 18,
  containerClass = 'bg-amber-50 text-amber-700 border border-amber-200',
  dimmed = false,
}: AchievementBadgeAvatarProps) {
  const Icon = ACHIEVEMENT_ICON_MAP[iconKey] ?? Award;

  if (imageUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl border border-amber-200 bg-white ${sizeClass} ${
          dimmed ? 'grayscale opacity-65' : ''
        }`}
      >
        <RemoteImage src={imageUrl} alt={title} className="size-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`grid shrink-0 place-items-center rounded-xl ${sizeClass} ${containerClass} ${
        dimmed ? 'opacity-70' : ''
      }`}
    >
      <Icon size={iconSize} />
    </div>
  );
}
