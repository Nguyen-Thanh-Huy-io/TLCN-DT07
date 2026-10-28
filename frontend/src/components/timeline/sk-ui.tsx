"use client";
import { KeyboardKey } from '@/constants/enums';

import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`sk-button ${className}`} {...props} />;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} />;
}

export function Badge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`sk-badge ${className}`}>{children}</span>;
}

export function Heading({
  children,
  className = "",
  level = 2,
}: {
  children: ReactNode;
  className?: string;
  level?: 1 | 2 | 3;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3";
  return <Tag className={className}>{children}</Tag>;
}

export function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
      {children}
    </select>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  sheet = false,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: ReactNode;
  sheet?: boolean;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === KeyboardKey.ESCAPE) onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="sk-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sk-modal-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="sk-content"
            role="dialog"
            aria-modal="true"
            className={`${sheet ? "sk-sheet" : "sk-dialog"} ${className}`}
            initial={sheet ? { x: "100%" } : { opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }}
            animate={sheet ? { x: 0 } : { opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={sheet ? { x: "100%" } : { opacity: 0, scale: 0.97, x: "-50%", y: "-50%" }}
            transition={sheet ? { type: "spring", damping: 28, stiffness: 260 } : { duration: 0.18 }}
          >
            <div className="sk-modal-heading">
              <h2>{title}</h2>
              <Button aria-label="Đóng" onClick={onClose}>
                <X size={20} />
              </Button>
            </div>
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
