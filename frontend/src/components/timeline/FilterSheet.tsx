"use client";

import { ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";
import { EMPTY_FILTERS, withoutValue, type TimelineFilters } from "./FilterBar";
import type { SplitMode } from "./SubEraSection";
import type { Era } from "./sk-types";

const SPLIT_OPTIONS: Array<{ value: SplitMode; label: string }> = [
  { value: "alternating", label: "So le hai bên" },
  { value: "scope", label: "Việt Nam / Thế giới" },
  { value: "domain", label: "Chính trị / Văn hóa" },
];

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={`sk-fs-chip ${selected ? "sk-selected" : ""}`} aria-pressed={selected} onClick={onClick}>
      {children}
    </button>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="sk-fs-section">
      <div className="sk-fs-section-head">
        <h3>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

type SheetProps = {
  value: TimelineFilters;
  split: SplitMode;
  onApply: (filters: TimelineFilters, split: SplitMode) => void;
  onClose: () => void;
  countFor: (filters: TimelineFilters) => number;
  eras: Era[];
  categories: string[];
  regions: string[];
};

function SheetPanel({ value, split, onApply, onClose, countFor, eras, categories, regions }: SheetProps) {
  // Nháp: chỉ áp dụng khi bấm "Xem N kết quả".
  const [draft, setDraft] = useState(value);
  const [draftSplit, setDraftSplit] = useState(split);
  const toggle = (key: keyof TimelineFilters, v: string) =>
    setDraft((d) => (d[key].includes(v) ? withoutValue(d, key, v, eras) : { ...d, [key]: [...d[key], v] }));
  const selectedEras = eras.filter((e) => draft.eras.includes(e.id));
  const results = countFor(draft);
  const picked = (n: number) => (n ? <span className="sk-fs-aside">Đã chọn {n}</span> : undefined);

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

      <div className="sk-fs-body">
        {regions.length > 1 && (
          <Section title="Quốc gia / khu vực" aside={picked(draft.regions.length)}>
            <div className="sk-fs-chips">
              {regions.map((r) => (
                <Chip key={r} selected={draft.regions.includes(r)} onClick={() => toggle("regions", r)}>
                  {r}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        <div className="sk-fs-card">
          <div className="sk-fs-section-head">
            <h3>Thời kỳ</h3>
            {picked(draft.eras.length + draft.subs.length)}
          </div>
          <div className="sk-fs-chips">
            {eras.map((e) => (
              <Chip key={e.id} selected={draft.eras.includes(e.id)} onClick={() => toggle("eras", e.id)}>
                {e.title}
              </Chip>
            ))}
          </div>
          {/* Chọn thời kỳ nào thì hiện giai đoạn của thời kỳ đó để thu hẹp thêm. */}
          {selectedEras
            .filter((e) => e.subEras.length > 1)
            .map((e) => (
              <div key={e.id}>
                <div className="sk-fs-sublabel">Giai đoạn · {e.title}</div>
                <div className="sk-fs-chips">
                  {e.subEras.map((s) => (
                    <Chip key={s.id} selected={draft.subs.includes(s.id)} onClick={() => toggle("subs", s.id)}>
                      {s.title}
                    </Chip>
                  ))}
                </div>
              </div>
            ))}
        </div>

        {categories.length > 0 && (
          <Section title="Danh mục sự kiện" aside={picked(draft.categories.length)}>
            <div className="sk-fs-chips">
              {categories.map((c) => (
                <Chip key={c} selected={draft.categories.includes(c)} onClick={() => toggle("categories", c)}>
                  {c}
                </Chip>
              ))}
            </div>
          </Section>
        )}

        <Section title="Phân luồng trục dọc" aside={<span className="sk-fs-aside">Cách xếp thẻ hai bên trục</span>}>
          <div className="sk-fs-chips">
            {SPLIT_OPTIONS.map((o) => (
              <Chip key={o.value} selected={draftSplit === o.value} onClick={() => setDraftSplit(o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </Section>
      </div>

      <footer className="sk-fs-footer">
        <button type="button" className="sk-fs-reset" onClick={() => setDraft(EMPTY_FILTERS)}>
          Bỏ chọn
        </button>
        <button type="button" className="sk-fs-apply" disabled={results === 0} onClick={() => onApply(draft, draftSplit)}>
          {results === 0 ? "Không có kết quả" : `Xem ${results.toLocaleString("vi-VN")} kết quả`}
        </button>
      </footer>
    </motion.div>
  );
}

export function FilterSheet({ open, ...props }: SheetProps & { open: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="sk-fs-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={props.onClose}
        >
          {/* Mount mới mỗi lần mở → nháp luôn bắt đầu từ bộ lọc đang áp dụng. */}
          <SheetPanel {...props} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
