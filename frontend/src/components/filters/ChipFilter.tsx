"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";

/*
 * Bộ lọc dạng bảng chip dùng chung (Dòng thời gian, Nhân vật...).
 * Style nằm trong components/timeline/sk-timeline.css (lớp sk-fs-*), dùng biến màu của .sk-app.
 */

/** Quá ngưỡng này nhóm thu gọn kèm "Xem thêm"; dài hơn nữa thì có ô tìm trong nhóm. */
const COLLAPSE_AFTER = 8;
const SEARCHABLE_AFTER = 12;

export type ChipOption = { value: string; label: string; hint?: string };

const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();

/** Bật/tắt một giá trị trong danh sách chọn nhiều. */
export function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/**
 * Nhóm chip chọn nhiều, chịu được danh sách dài: mục đã chọn luôn hiện,
 * phần còn lại thu gọn sau COLLAPSE_AFTER mục và tìm được khi danh sách dài.
 */
export function ChipGroup({
  options,
  selected,
  onToggle,
  searchLabel,
}: {
  options: ChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
  searchLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [term, setTerm] = useState("");
  const matched = term ? options.filter((o) => normalize(`${o.label} ${o.hint ?? ""}`).includes(normalize(term))) : options;
  const shown =
    expanded || term || matched.length <= COLLAPSE_AFTER
      ? matched
      : matched.filter((o, i) => i < COLLAPSE_AFTER || selected.includes(o.value));
  const hidden = matched.length - shown.length;

  return (
    <>
      {options.length > SEARCHABLE_AFTER && (
        <label className="sk-fs-search">
          <Search size={15} />
          <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={searchLabel} aria-label={searchLabel} />
          {term && (
            <button type="button" onClick={() => setTerm("")} aria-label="Xóa từ khóa">
              <X size={14} />
            </button>
          )}
        </label>
      )}
      <div className="sk-fs-chips">
        {shown.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`sk-fs-chip ${selected.includes(o.value) ? "sk-selected" : ""}`}
            aria-pressed={selected.includes(o.value)}
            onClick={() => onToggle(o.value)}
          >
            {o.label}
            {o.hint && <small>{o.hint}</small>}
          </button>
        ))}
        {matched.length === 0 && <p className="sk-fs-none">Không có mục nào khớp “{term}”.</p>}
      </div>
      {(hidden > 0 || (expanded && matched.length > COLLAPSE_AFTER && !term)) && (
        <button type="button" className="sk-fs-more" onClick={() => setExpanded(!expanded)}>
          {expanded ? "Thu gọn" : `Xem thêm ${hidden} mục`}
          <ChevronDown size={15} style={{ transform: expanded ? "rotate(180deg)" : undefined }} />
        </button>
      )}
    </>
  );
}

export function FilterSection({
  title,
  aside,
  card,
  children,
}: {
  title: string;
  aside?: ReactNode;
  card?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={card ? "sk-fs-card" : "sk-fs-section"}>
      <div className="sk-fs-section-head">
        <h3>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function PickedCount({ count }: { count: number }) {
  return count ? <span className="sk-fs-aside">Đã chọn {count}</span> : null;
}

function DialogPanel({
  onClose,
  onReset,
  onApply,
  resultCount,
  children,
}: {
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
  resultCount: number;
  children: ReactNode;
}) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      className="sk-fs-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sk-fs-title"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.22 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <header className="sk-fs-header">
        <SlidersHorizontal size={20} />
        <h2 id="sk-fs-title">Bộ lọc</h2>
        <button type="button" className="sk-fs-close" onClick={onClose} aria-label="Đóng bộ lọc">
          <X size={20} />
        </button>
      </header>
      <div className="sk-fs-body">{children}</div>
      <footer className="sk-fs-footer">
        <button type="button" className="sk-fs-reset" onClick={onReset}>
          Bỏ chọn
        </button>
        <button type="button" className="sk-fs-apply" disabled={resultCount === 0} onClick={onApply}>
          {resultCount === 0 ? "Không có kết quả" : `Xem ${resultCount.toLocaleString("vi-VN")} kết quả`}
        </button>
      </footer>
    </motion.div>
  );
}

/**
 * Khung hộp thoại bộ lọc. `children` là một render-prop nhận nháp hiện tại,
 * để mỗi trang tự quyết các nhóm chip; nháp chỉ được áp dụng khi bấm "Xem N kết quả".
 */
export function FilterDialog<T>({
  open,
  value,
  empty,
  countFor,
  onApply,
  onClose,
  children,
}: {
  open: boolean;
  value: T;
  empty: T;
  countFor: (draft: T) => number;
  onApply: (draft: T) => void;
  onClose: () => void;
  children: (draft: T, setDraft: (update: (d: T) => T) => void) => ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sk-fs-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
          {/* Mount mới mỗi lần mở → nháp luôn bắt đầu từ bộ lọc đang áp dụng. */}
          <DraftHolder value={value} empty={empty} countFor={countFor} onApply={onApply} onClose={onClose}>
            {children}
          </DraftHolder>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DraftHolder<T>({
  value,
  empty,
  countFor,
  onApply,
  onClose,
  children,
}: {
  value: T;
  empty: T;
  countFor: (draft: T) => number;
  onApply: (draft: T) => void;
  onClose: () => void;
  children: (draft: T, setDraft: (update: (d: T) => T) => void) => ReactNode;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <DialogPanel onClose={onClose} onReset={() => setDraft(empty)} onApply={() => onApply(draft)} resultCount={countFor(draft)}>
      {children(draft, setDraft)}
    </DialogPanel>
  );
}
