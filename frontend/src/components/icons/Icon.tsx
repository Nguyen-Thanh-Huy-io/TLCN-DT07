import React from 'react';
import { IconName, IconNameType } from '@/constants/icons';

export const iconPaths: Record<IconName, React.ReactNode> = {
  [IconName.GRID]: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  [IconName.CLOCK]: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  [IconName.FOLDER]: <path d="M3 7.5h6l2-3h10v15H3z" />,
  [IconName.BOOK]: (
    <>
      <path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23z" />
      <path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23z" />
    </>
  ),
  [IconName.CALENDAR]: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </>
  ),
  [IconName.TAG]: (
    <>
      <path d="M20 13 12 21l-9-9V3h9z" />
      <circle cx="8" cy="8" r="1.5" />
    </>
  ),
  [IconName.CHECK]: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
    </>
  ),
  [IconName.USERS]: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6m3-3h-6" />
    </>
  ),
  [IconName.SEARCH]: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  [IconName.BELL]: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  [IconName.CHEVRON]: <path d="m9 18 6-6-6-6" />,
  [IconName.MORE]: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  [IconName.PLUS]: <path d="M12 5v14M5 12h14" />,
  [IconName.ARROW]: <path d="m9 18 6-6-6-6" />,
  [IconName.LOGOUT]: (
    <>
      <path d="M10 17l5-5-5-5m5 5H3" />
      <path d="M15 4h5v16h-5" />
    </>
  ),
  [IconName.MENU]: <path d="M4 6h16M4 12h16M4 18h16" />,
  [IconName.EDIT]: (
    <>
      <path d="m14 4 6 6L9 21H3v-6z" />
      <path d="m12 6 6 6" />
    </>
  ),
  [IconName.EYE]: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  [IconName.TRASH]: (
    <>
      <path d="M4 7h16M9 7V4h6v3m3 0-1 14H7L6 7" />
      <path d="M10 11v6m4-6v6" />
    </>
  ),
  [IconName.FILTER]: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  [IconName.SPARK]: (
    <>
      <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2z" />
      <path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7z" />
    </>
  ),
};

export interface IconProps {
  name: IconName | IconNameType;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 18, className }: IconProps) {
  const path = iconPaths[name as IconName];
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {path}
    </svg>
  );
}
