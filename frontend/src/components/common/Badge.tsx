import React from 'react';
import { BadgeTone } from '@/constants/ui-theme';

export interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone | string;
  className?: string;
}

export function Badge({ children, tone = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      <span className="badge-dot" />
      {children}
    </span>
  );
}
