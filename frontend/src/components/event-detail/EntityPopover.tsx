"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Landmark, UserRound } from "lucide-react";
import type { EntityMention } from "./ce-types";

export function EntityPopover({ entity, children }: { entity: EntityMention; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const isFigure = entity.type === "FIGURE";
  return (
    <span className="ce-entity-wrap" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        className={`ce-entity-trigger ${isFigure ? "" : "ce-location"}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {children}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            className="ce-entity-popover"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.98 }}
          >
            <span className="ce-entity-popover-head">
              <span className="ce-entity-avatar">
                {entity.imageUrl ? <img src={entity.imageUrl} alt="" /> : isFigure ? <UserRound /> : <Landmark />}
              </span>
              <span>
                <small>{isFigure ? "NHÂN VẬT LỊCH SỬ" : "ĐỊA DANH LỊCH SỬ"}</small>
                <strong>{entity.name}</strong>
                {entity.roleLabel && <em>{entity.roleLabel}</em>}
              </span>
            </span>
            {entity.summary && <span className="ce-entity-summary">{entity.summary}</span>}
            <Link href={entity.href}>
              {isFigure ? "Xem hồ sơ nhân vật" : "Xem các di tích"} <ArrowRight />
            </Link>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Renders plain text, turning every name of a linked figure/location into a popover trigger. */
export function MentionText({ text, mentions }: { text: string; mentions: EntityMention[] }) {
  const named = mentions.filter((m) => m.name.trim().length > 1).sort((a, b) => b.name.length - a.name.length);
  if (!named.length) return <>{text}</>;
  const byName = new Map(named.map((m) => [m.name.toLowerCase(), m]));
  const pattern = new RegExp(`(${named.map((m) => escapeRegExp(m.name)).join("|")})`, "gi");
  return (
    <>
      {text.split(pattern).map((part, i) => {
        const mention = byName.get(part.toLowerCase());
        return mention ? (
          <EntityPopover key={i} entity={mention}>
            {part}
          </EntityPopover>
        ) : (
          <span key={i}>{part}</span>
        );
      })}
    </>
  );
}
