'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' ');

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'gold';

export function HlButton({
  children,
  variant = 'primary',
  className,
  onClick,
  type = 'button',
  disabled,
  href,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  href?: string;
}) {
  const cls = cn('hl-button', `hl-button-${variant}`, className);
  if (href) {
    return (
      <Link className={cls} href={href}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
}

export function HlBadge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('hl-badge', className)}>{children}</span>;
}

export function HlProgress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('hl-progress-track', className)}>
      <span className="hl-progress-bar" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="hl-section-head">
      <div>
        {eyebrow && (
          <div className="hl-eyebrow">
            <span />
            {eyebrow}
          </div>
        )}
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55 }}
    >
      {children}
    </motion.div>
  );
}

/** Ảnh có fallback: thiếu ảnh thì hiện nền chuyển sắc + chữ trang trí thay vì ảnh không liên quan. */
export function HlCover({ src, alt, fallbackText }: { src: string | null; alt: string; fallbackText: string }) {
  if (src) return <img src={src} alt={alt} />;
  return (
    <div className="hl-cover-fallback" aria-hidden="true">
      <span>{fallbackText}</span>
    </div>
  );
}
