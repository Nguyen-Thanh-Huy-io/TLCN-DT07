'use client';

/*
 * Thành phần giao diện theo quy chuẩn shadcn/ui (Button, Badge, Card, Input, Select, Tabs,
 * Sheet, Separator, ScrollArea) viết gọn tại chỗ — dự án chưa cài shadcn/ui nên không thêm
 * phụ thuộc. Màu lấy từ biến --hx-* (heritage.css) để hỗ trợ sáng / tối.
 */

import { ReactNode, useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: Parameters<typeof clsx>) => twMerge(clsx(inputs));

type ButtonVariant = 'default' | 'outline' | 'ghost' | 'gold';
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  default: 'bg-[var(--hx-primary)] text-white hover:bg-[var(--hx-primary-strong)] shadow-sm',
  outline: 'border border-[var(--hx-line)] bg-[var(--hx-surface)] text-[var(--hx-ink)] hover:border-[var(--hx-primary)]',
  ghost: 'text-[var(--hx-ink)] hover:bg-[var(--hx-surface-2)]',
  gold: 'bg-[var(--hx-gold)] text-[#1c1406] hover:brightness-105 shadow-sm',
};

export function Button({
  variant = 'default',
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hx-primary)] disabled:pointer-events-none disabled:opacity-50',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...props}
    />
  );
}

type BadgeTone = 'default' | 'gold' | 'outline' | 'dark';
const BADGE_TONES: Record<BadgeTone, string> = {
  default: 'bg-[var(--hx-primary-soft)] text-[var(--hx-primary)]',
  gold: 'bg-gradient-to-r from-[#f3d27a] to-[#d4a23c] text-[#2a1a03] shadow-sm',
  outline: 'border border-[var(--hx-line)] text-[var(--hx-muted)]',
  dark: 'bg-black/55 text-white backdrop-blur',
};

export function Badge({ tone = 'default', className, children }: { tone?: BadgeTone; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold', BADGE_TONES[tone], className)}>
      {children}
    </span>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('rounded-2xl border border-[var(--hx-line)] bg-[var(--hx-surface)]', className)}>{children}</div>;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-[var(--hx-line)] bg-[var(--hx-surface)] px-3 text-sm text-[var(--hx-ink)] placeholder:text-[var(--hx-muted)] outline-none focus:border-[var(--hx-primary)] focus:ring-2 focus:ring-[var(--hx-primary-soft)]',
        className,
      )}
      {...props}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label: string;
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cn(
        'h-10 rounded-xl border border-[var(--hx-line)] bg-[var(--hx-surface)] px-3 text-sm text-[var(--hx-ink)] outline-none focus:border-[var(--hx-primary)]',
        className,
      )}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Separator({ className }: { className?: string }) {
  return <div role="separator" className={cn('h-px w-full bg-[var(--hx-line)]', className)} />;
}

export function ScrollArea({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('hx-scroll overflow-y-auto', className)}>{children}</div>;
}

/** Tabs điều khiển ngoài; gạch chân trượt theo tab bằng layoutId. */
export function Tabs<T extends string>({
  value,
  onChange,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  items: Array<{ value: T; label: string; icon?: ReactNode }>;
}) {
  const id = useId();
  return (
    <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-[var(--hx-line)]">
      {items.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 px-3.5 py-3 text-sm font-semibold transition-colors',
              active ? 'text-[var(--hx-primary)]' : 'text-[var(--hx-muted)] hover:text-[var(--hx-ink)]',
            )}
          >
            {t.icon}
            {t.label}
            {active && (
              <motion.span layoutId={`tab-underline-${id}`} className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-[var(--hx-primary)]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Sheet toàn màn hình (trên điện thoại) / bảng trượt phải (màn rộng); Esc để đóng, khóa cuộn nền. */
export function Sheet({
  open,
  onClose,
  label,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120]">
          <motion.div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={panel}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 260 }}
            className={cn(
              'absolute inset-y-0 right-0 flex w-full flex-col bg-[var(--hx-bg)] text-[var(--hx-ink)] shadow-2xl outline-none lg:w-[min(1080px,92vw)]',
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
            >
              <X className="size-5" />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
