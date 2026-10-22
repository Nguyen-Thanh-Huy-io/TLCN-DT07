"use client";

import { useMemo } from "react";
import { ChipGroup, FilterDialog, FilterSection, PickedCount, type ChipOption } from "@/components/filters/ChipFilter";
import { EMPTY_FILTERS, withoutValue, type TimelineFilters } from "./FilterBar";
import type { Era } from "./sk-types";

/** Khu vực có sự kiện trong từng thời kỳ — để thu hẹp danh sách thời kỳ theo khu vực đã chọn. */
function eraRegions(era: Era): Set<string> {
  return new Set(era.subEras.flatMap((s) => s.timeNodes.flatMap((n) => n.events.map((e) => e.region))));
}

export function FilterSheet({
  open,
  value,
  onApply,
  onClose,
  countFor,
  eras,
  categories,
  regions,
}: {
  open: boolean;
  value: TimelineFilters;
  onApply: (filters: TimelineFilters) => void;
  onClose: () => void;
  countFor: (filters: TimelineFilters) => number;
  eras: Era[];
  categories: string[];
  regions: string[];
}) {
  const regionsByEra = useMemo(() => new Map(eras.map((e) => [e.id, eraRegions(e)])), [eras]);

  return (
    <FilterDialog open={open} value={value} empty={EMPTY_FILTERS} countFor={countFor} onApply={onApply} onClose={onClose}>
      {(draft, setDraft) => {
        const toggle = (key: keyof TimelineFilters, v: string) =>
          setDraft((d) => (d[key].includes(v) ? withoutValue(d, key, v, eras) : { ...d, [key]: [...d[key], v] }));
        // Đã chọn khu vực thì chỉ gợi ý thời kỳ có sự kiện ở khu vực đó (thời kỳ đã chọn vẫn giữ).
        const eraOptions: ChipOption[] = eras
          .filter(
            (e) =>
              draft.regions.length === 0 ||
              draft.eras.includes(e.id) ||
              draft.regions.some((r) => regionsByEra.get(e.id)?.has(r)),
          )
          .map((e) => ({ value: e.id, label: e.title, hint: e.periodLabel }));
        const narrowed = draft.regions.length > 0 && eraOptions.length < eras.length;

        return (
          <>
            {regions.length > 1 && (
              <FilterSection title="Quốc gia / khu vực" aside={<PickedCount count={draft.regions.length} />}>
                <ChipGroup
                  options={regions.map((r) => ({ value: r, label: r }))}
                  selected={draft.regions}
                  onToggle={(v) => toggle("regions", v)}
                  searchLabel="Tìm quốc gia / khu vực..."
                />
              </FilterSection>
            )}

            <FilterSection
              card
              title="Thời kỳ"
              aside={
                narrowed ? (
                  <span className="sk-fs-aside">Theo khu vực đã chọn</span>
                ) : (
                  <PickedCount count={draft.eras.length + draft.subs.length} />
                )
              }
            >
              <ChipGroup options={eraOptions} selected={draft.eras} onToggle={(v) => toggle("eras", v)} searchLabel="Tìm thời kỳ..." />
              {/* Chọn thời kỳ nào thì hiện giai đoạn của thời kỳ đó để thu hẹp thêm. */}
              {eras
                .filter((e) => draft.eras.includes(e.id) && e.subEras.length > 1)
                .map((e) => (
                  <div key={e.id}>
                    <div className="sk-fs-sublabel">Giai đoạn · {e.title}</div>
                    <ChipGroup
                      options={e.subEras.map((s) => ({ value: s.id, label: s.title }))}
                      selected={draft.subs}
                      onToggle={(v) => toggle("subs", v)}
                      searchLabel="Tìm giai đoạn..."
                    />
                  </div>
                ))}
            </FilterSection>

            {categories.length > 0 && (
              <FilterSection title="Danh mục sự kiện" aside={<PickedCount count={draft.categories.length} />}>
                <ChipGroup
                  options={categories.map((c) => ({ value: c, label: c }))}
                  selected={draft.categories}
                  onToggle={(v) => toggle("categories", v)}
                  searchLabel="Tìm danh mục..."
                />
              </FilterSection>
            )}
          </>
        );
      }}
    </FilterDialog>
  );
}
