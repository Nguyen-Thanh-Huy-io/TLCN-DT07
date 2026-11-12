"use client";

import { ChipGroup, FilterDialog, FilterSection, PickedCount, type ChipOption } from "@/components/filters/ChipFilter";
import { EMPTY_FILTERS, withoutValue, type TimelineFilters } from "./FilterBar";
import type { Era } from "./sk-types";

export function FilterSheet({
  open,
  value,
  onApply,
  onClose,
  countFor,
  eras,
  categories,
}: {
  open: boolean;
  value: TimelineFilters;
  onApply: (filters: TimelineFilters) => void;
  onClose: () => void;
  countFor: (filters: TimelineFilters) => number;
  eras: Era[];
  categories: string[];
}) {
  const eraOptions: ChipOption[] = eras.map((e) => ({ value: e.id, label: e.title, hint: e.periodLabel }));

  return (
    <FilterDialog open={open} value={value} empty={EMPTY_FILTERS} countFor={countFor} onApply={onApply} onClose={onClose}>
      {(draft, setDraft) => {
        const toggle = (key: keyof TimelineFilters, v: string) =>
          setDraft((d) => (d[key].includes(v) ? withoutValue(d, key, v, eras) : { ...d, [key]: [...d[key], v] }));

        return (
          <>
            <FilterSection card title="Thời kỳ" aside={<PickedCount count={draft.eras.length + draft.subs.length} />}>
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
