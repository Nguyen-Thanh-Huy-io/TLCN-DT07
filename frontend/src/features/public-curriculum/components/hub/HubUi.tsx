'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

export const HUB_BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-lh-brand text-white shadow-sm hover:bg-lh-brand-strong',
  secondary: 'bg-lh-brand-soft text-lh-brand hover:bg-lh-brand-soft/70',
  ghost: 'text-lh-muted hover:bg-lh-surface-2 hover:text-lh-ink',
  outline: 'border border-lh-line bg-lh-surface text-lh-ink hover:border-lh-brand/40 hover:text-lh-brand',
};

export const HUB_BUTTON_BASE =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-lh-brand/30 disabled:pointer-events-none disabled:opacity-40';

export function HubButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button type="button" className={`${HUB_BUTTON_BASE} ${HUB_BUTTON_VARIANTS[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

const BADGE_TONES = {
  neutral: 'bg-lh-surface-2 text-lh-ink/80 font-medium',
  brand: 'bg-lh-brand-soft text-lh-brand font-bold',
  gold: 'bg-lh-gold-soft text-lh-gold font-bold',
  red: 'bg-lh-red-soft text-lh-red font-bold',
} as const;

export function HubBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof BADGE_TONES }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  );
}

export function HubProgress({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-lh-surface-3">
      <motion.div
        className="h-full rounded-full bg-lh-brand"
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );
}
