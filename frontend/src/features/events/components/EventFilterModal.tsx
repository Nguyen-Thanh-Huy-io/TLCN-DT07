'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  SlidersHorizontal,
  Calendar,
  Tag,
  FileCheck,
  Search,
  RotateCcw,
  CornerDownRight,
  Check,
  Sparkles,
} from 'lucide-react';
import type { PeriodItem } from '@/types/models/period.type';
import type { TaxonomyTermItem } from '@/services/entities/taxonomy.service';
import { ContentStatus } from '@/constants/enums';
import { STATUS_LABEL_MAP } from '@/constants/ui-theme';
import type { EventFilterCriteria } from '../strategies/event-filter.specification';

export interface EventFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: EventFilterCriteria;
  periods: PeriodItem[];
  categoryTerms: TaxonomyTermItem[];
  countForDraft: (draft: EventFilterCriteria) => number;
  onApply: (criteria: EventFilterCriteria) => void;
  onReset: () => void;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái' },
  { value: ContentStatus.PUBLISHED, label: STATUS_LABEL_MAP[ContentStatus.PUBLISHED] },
  { value: ContentStatus.DRAFT, label: STATUS_LABEL_MAP[ContentStatus.DRAFT] },
  { value: ContentStatus.PENDING_REVIEW, label: STATUS_LABEL_MAP[ContentStatus.PENDING_REVIEW] },
  { value: ContentStatus.ARCHIVED, label: STATUS_LABEL_MAP[ContentStatus.ARCHIVED] },
];

export function EventFilterModal({
  isOpen,
  onClose,
  criteria,
  periods,
  categoryTerms,
  countForDraft,
  onApply,
  onReset,
}: EventFilterModalProps) {
  // Bản nháp tiêu chí lọc bên trong modal (Hỗ trợ Multi-Select)
  const [draft, setDraft] = useState<EventFilterCriteria>(criteria);

  // Ô tìm kiếm gợi ý thời kỳ
  const [periodQuery, setPeriodQuery] = useState<string>('');
  const [isPeriodSuggestOpen, setIsPeriodSuggestOpen] = useState<boolean>(false);
  const periodBoxRef = useRef<HTMLDivElement>(null);
  const periodInputRef = useRef<HTMLInputElement>(null);

  // Ô tìm kiếm gợi ý phân loại sự kiện
  const [categoryQuery, setCategoryQuery] = useState<string>('');
  const [isCategorySuggestOpen, setIsCategorySuggestOpen] = useState<boolean>(false);
  const categoryBoxRef = useRef<HTMLDivElement>(null);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ draft mỗi khi mở modal
  useEffect(() => {
    if (isOpen) {
      setDraft({
        selectedPeriodIds: criteria.selectedPeriodIds ? [...criteria.selectedPeriodIds] : [],
        selectedCategories: criteria.selectedCategories ? [...criteria.selectedCategories] : [],
        selectedStatus: criteria.selectedStatus || 'all',
      });
      setPeriodQuery('');
      setIsPeriodSuggestOpen(false);
      setCategoryQuery('');
      setIsCategorySuggestOpen(false);
    }
  }, [isOpen, criteria]);

  // Khóa cuộn trang nền khi mở modal
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, onClose]);

  // Click outside để đóng menu gợi ý
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (periodBoxRef.current && !periodBoxRef.current.contains(e.target as Node)) {
        setIsPeriodSuggestOpen(false);
      }
      if (categoryBoxRef.current && !categoryBoxRef.current.contains(e.target as Node)) {
        setIsCategorySuggestOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Danh sách các thời kỳ đang chọn (dạng đối tượng)
  const selectedPeriods = useMemo(() => {
    const idSet = new Set(draft.selectedPeriodIds);
    return periods.filter((p) => idSet.has(p.id));
  }, [periods, draft.selectedPeriodIds]);

  // Gợi ý nhanh: 3-4 thời kỳ đầu tiên chưa được chọn để người dùng dễ hình dung
  const quickPeriodSuggestions = useMemo(() => {
    const idSet = new Set(draft.selectedPeriodIds);
    return periods.filter((p) => !idSet.has(p.id)).slice(0, 4);
  }, [periods, draft.selectedPeriodIds]);

  // Toggle hoặc thêm một thời kỳ vào danh sách đã chọn
  const handleTogglePeriod = (periodId: string) => {
    setDraft((prev) => {
      const exists = prev.selectedPeriodIds.includes(periodId);
      const updated = exists
        ? prev.selectedPeriodIds.filter((id) => id !== periodId)
        : [...prev.selectedPeriodIds, periodId];
      return { ...prev, selectedPeriodIds: updated };
    });
    setPeriodQuery('');
    setIsPeriodSuggestOpen(false);
    setTimeout(() => periodInputRef.current?.focus(), 50);
  };

  const handleRemovePeriod = (periodId: string) => {
    setDraft((prev) => ({
      ...prev,
      selectedPeriodIds: prev.selectedPeriodIds.filter((id) => id !== periodId),
    }));
  };

  const handleClearAllPeriods = () => {
    setDraft((prev) => ({ ...prev, selectedPeriodIds: [] }));
  };

  // Danh sách gợi ý thời kỳ: Khi gõ thì lọc, khi chưa gõ thì hiển thị top 10 mục đầu tiên
  const suggestedPeriods = useMemo(() => {
    const q = periodQuery.trim().toLowerCase();
    if (!q) return periods.slice(0, 10);
    return periods
      .filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(q);
        const yearMatch =
          (p.startYear !== null && p.startYear !== undefined && String(p.startYear).includes(q)) ||
          (p.endYear !== null && p.endYear !== undefined && String(p.endYear).includes(q));
        return nameMatch || yearMatch;
      })
      .slice(0, 10);
  }, [periods, periodQuery]);

  // Danh sách các phân loại đang chọn (dạng đối tượng)
  const selectedCategoryTerms = useMemo(() => {
    const codeSet = new Set(draft.selectedCategories);
    return categoryTerms.filter((t) => codeSet.has(t.code));
  }, [categoryTerms, draft.selectedCategories]);

  // Gợi ý nhanh: 3-4 phân loại đầu tiên chưa được chọn để người dùng dễ hình dung
  const quickCategorySuggestions = useMemo(() => {
    const codeSet = new Set(draft.selectedCategories);
    return categoryTerms.filter((t) => !codeSet.has(t.code)).slice(0, 4);
  }, [categoryTerms, draft.selectedCategories]);

  // Toggle hoặc thêm một phân loại vào danh sách đã chọn
  const handleToggleCategory = (categoryCode: string) => {
    setDraft((prev) => {
      const exists = prev.selectedCategories.includes(categoryCode);
      const updated = exists
        ? prev.selectedCategories.filter((code) => code !== categoryCode)
        : [...prev.selectedCategories, categoryCode];
      return { ...prev, selectedCategories: updated };
    });
    setCategoryQuery('');
    setIsCategorySuggestOpen(false);
    setTimeout(() => categoryInputRef.current?.focus(), 50);
  };

  const handleRemoveCategory = (categoryCode: string) => {
    setDraft((prev) => ({
      ...prev,
      selectedCategories: prev.selectedCategories.filter((code) => code !== categoryCode),
    }));
  };

  const handleClearAllCategories = () => {
    setDraft((prev) => ({ ...prev, selectedCategories: [] }));
  };

  // Danh sách gợi ý phân loại: Khi gõ thì lọc, khi chưa gõ thì hiển thị top 10 mục đầu tiên
  const suggestedCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categoryTerms.slice(0, 10);
    return categoryTerms
      .filter((t) => {
        const labelMatch = t.label.toLowerCase().includes(q);
        const codeMatch = t.code.toLowerCase().includes(q);
        const aliasMatch = Boolean(t.aliases?.some((a) => a.toLowerCase().includes(q)));
        return labelMatch || codeMatch || aliasMatch;
      })
      .slice(0, 10);
  }, [categoryTerms, categoryQuery]);

  // Đếm số sự kiện phù hợp với draft hiện tại
  const previewCount = useMemo(() => {
    return countForDraft(draft);
  }, [countForDraft, draft]);

  const hasDraftChanges = useMemo(() => {
    return (
      draft.selectedPeriodIds.length > 0 ||
      draft.selectedCategories.length > 0 ||
      draft.selectedStatus !== 'all'
    );
  }, [draft]);

  const handleResetDraft = () => {
    const emptyCriteria: EventFilterCriteria = {
      selectedPeriodIds: [],
      selectedCategories: [],
      selectedStatus: 'all',
    };
    setDraft(emptyCriteria);
    setPeriodQuery('');
    setCategoryQuery('');
    onReset();
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] z-10"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-amber-50/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <SlidersHorizontal size={17} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    Phễu lọc sự kiện lịch sử (Đa tiêu chí)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bấm chọn nhanh từ gợi ý hoặc gõ từ khóa để chọn nhiều thời kỳ và phân loại
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
                title="Đóng (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Nhóm 1: Thời kỳ lịch sử (Hỗ trợ Multi-Select) */}
              <div ref={periodBoxRef} className="space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Calendar size={13} className="text-amber-700" />
                    Thời kỳ lịch sử
                    {selectedPeriods.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {selectedPeriods.length}
                      </span>
                    )}
                  </span>
                  {selectedPeriods.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllPeriods}
                      className="text-amber-800 hover:text-amber-950 text-[11px] font-semibold underline cursor-pointer"
                    >
                      Bỏ chọn tất cả thời kỳ
                    </button>
                  )}
                </div>

                {/* Danh sách thẻ Tags thời kỳ đã chọn */}
                {selectedPeriods.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50/50 border border-amber-200/80 rounded-xl">
                    {selectedPeriods.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-950 font-medium text-xs shadow-2xs group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        <span>{p.name}</span>
                        {p.startYear && (
                          <span className="text-[10px] font-mono text-amber-800 opacity-75">
                            ({p.startYear}
                            {p.endYear ? `–${p.endYear}` : ''})
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePeriod(p.id)}
                          className="ml-0.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 p-0.5 transition cursor-pointer"
                          title={`Gỡ bỏ ${p.name}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Ô nhập tìm kiếm để add thêm thời kỳ */}
                <div className="relative">
                  <input
                    ref={periodInputRef}
                    type="text"
                    placeholder={
                      selectedPeriods.length > 0
                        ? 'Gõ hoặc bấm gợi ý bên dưới để thêm thời kỳ khác...'
                        : 'Gõ hoặc bấm chọn thời kỳ (vd: Trần, Lý, 1225...)...'
                    }
                    value={periodQuery}
                    onChange={(e) => {
                      setPeriodQuery(e.target.value);
                      setIsPeriodSuggestOpen(true);
                    }}
                    onFocus={() => {
                      setIsPeriodSuggestOpen(true);
                    }}
                    className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-800 focus:outline-none placeholder:text-slate-400"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  {periodQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setPeriodQuery('');
                        setIsPeriodSuggestOpen(true);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}

                  {/* Dropdown gợi ý: Hiển thị khi focus hoặc khi gõ */}
                  {isPeriodSuggestOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto py-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span>{periodQuery.trim() ? 'Kết quả tìm kiếm' : 'Danh sách thời kỳ tiêu biểu'}</span>
                        <span className="font-normal lowercase">({suggestedPeriods.length} mục)</span>
                      </div>
                      {suggestedPeriods.length > 0 ? (
                        suggestedPeriods.map((p) => {
                          const isSelected = draft.selectedPeriodIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleTogglePeriod(p.id)}
                              className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-100/70 text-amber-950 font-bold'
                                  : 'hover:bg-amber-50/70 text-slate-800'
                              }`}
                            >
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1.5">
                                  {isSelected && (
                                    <Check size={13} className="text-amber-800 shrink-0" />
                                  )}
                                  <span className="font-semibold">{p.name}</span>
                                </div>
                                {p.parent && (
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1 ml-4">
                                    <CornerDownRight size={10} /> Thuộc: {p.parent.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {p.startYear && (
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {p.startYear}
                                    {p.endYear ? ` – ${p.endYear}` : ''}
                                  </span>
                                )}
                                {isSelected ? (
                                  <span className="text-[10px] text-amber-800 font-bold">
                                    Đã chọn
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">+ Thêm</span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3.5 py-3 text-center text-slate-400 italic text-[11px]">
                          Không tìm thấy thời kỳ nào khớp với "{periodQuery}".
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hàng GỢI Ý NHANH thời kỳ */}
                {quickPeriodSuggestions.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                      <Sparkles size={11} className="text-amber-600" />
                      Gợi ý nhanh:
                    </span>
                    {quickPeriodSuggestions.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleTogglePeriod(p.id)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-50 hover:border-amber-300 border border-slate-200/80 text-[11px] text-slate-600 hover:text-amber-900 transition cursor-pointer"
                        title={`Bấm để chọn nhanh ${p.name}`}
                      >
                        <span>+</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nhóm 2: Phân loại sự kiện (Taxonomy - Hỗ trợ Multi-Select) */}
              <div ref={categoryBoxRef} className="space-y-2 pt-3 border-t border-slate-100 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Tag size={13} className="text-amber-700" />
                    Phân loại sự kiện (Taxonomy)
                    {selectedCategoryTerms.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                        {selectedCategoryTerms.length}
                      </span>
                    )}
                  </span>
                  {selectedCategoryTerms.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAllCategories}
                      className="text-amber-800 hover:text-amber-950 text-[11px] font-semibold underline cursor-pointer"
                    >
                      Bỏ chọn tất cả phân loại
                    </button>
                  )}
                </div>

                {/* Danh sách thẻ Tags phân loại đã chọn */}
                {selectedCategoryTerms.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-amber-50/50 border border-amber-200/80 rounded-xl">
                    {selectedCategoryTerms.map((term) => (
                      <span
                        key={term.code}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-950 font-medium text-xs shadow-2xs group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        <span>{term.label}</span>
                        <span className="text-[10px] font-mono text-amber-800 opacity-70">
                          ({term.code})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(term.code)}
                          className="ml-0.5 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-50 p-0.5 transition cursor-pointer"
                          title={`Gỡ bỏ ${term.label}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Ô nhập tìm kiếm để add thêm phân loại */}
                <div className="relative">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    placeholder={
                      selectedCategoryTerms.length > 0
                        ? 'Gõ hoặc bấm gợi ý bên dưới để thêm phân loại khác...'
                        : 'Gõ hoặc bấm chọn phân loại (vd: Chiến dịch, Trận đánh...)...'
                    }
                    value={categoryQuery}
                    onChange={(e) => {
                      setCategoryQuery(e.target.value);
                      setIsCategorySuggestOpen(true);
                    }}
                    onFocus={() => {
                      setIsCategorySuggestOpen(true);
                    }}
                    className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-800 focus:outline-none placeholder:text-slate-400"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  {categoryQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryQuery('');
                        setIsCategorySuggestOpen(true);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}

                  {/* Dropdown gợi ý: Hiển thị khi focus hoặc khi gõ */}
                  {isCategorySuggestOpen && (
                    <div className="absolute left-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-52 overflow-y-auto py-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <span>{categoryQuery.trim() ? 'Kết quả tìm kiếm' : 'Danh sách phân loại tiêu biểu'}</span>
                        <span className="font-normal lowercase">({suggestedCategories.length} mục)</span>
                      </div>
                      {suggestedCategories.length > 0 ? (
                        suggestedCategories.map((term) => {
                          const isSelected = draft.selectedCategories.includes(term.code);
                          return (
                            <button
                              key={term.id || term.code}
                              type="button"
                              onClick={() => handleToggleCategory(term.code)}
                              className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-100/70 text-amber-950 font-bold'
                                  : 'hover:bg-amber-50/70 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {isSelected && (
                                  <Check size={13} className="text-amber-800 shrink-0" />
                                )}
                                <span className="font-semibold">{term.label}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-slate-400">
                                  {term.code}
                                </span>
                                {isSelected ? (
                                  <span className="text-[10px] text-amber-800 font-bold">
                                    Đã chọn
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400">+ Thêm</span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3.5 py-3 text-center text-slate-400 italic text-[11px]">
                          Không tìm thấy phân loại nào khớp với "{categoryQuery}".
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Hàng GỢI Ý NHANH phân loại */}
                {quickCategorySuggestions.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1.5 pt-1">
                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 shrink-0">
                      <Sparkles size={11} className="text-amber-600" />
                      Gợi ý nhanh:
                    </span>
                    {quickCategorySuggestions.map((term) => (
                      <button
                        key={term.code}
                        type="button"
                        onClick={() => handleToggleCategory(term.code)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-amber-50 hover:border-amber-300 border border-slate-200/80 text-[11px] text-slate-600 hover:text-amber-900 transition cursor-pointer"
                        title={`Bấm để chọn nhanh ${term.label}`}
                      >
                        <span>+</span>
                        <span>{term.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Nhóm 3: Trạng thái xuất bản (Gọn gàng 4 chip chuẩn hóa) */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <FileCheck size={13} className="text-amber-700" />
                    Trạng thái xuất bản
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map((opt) => {
                    const isSelected = draft.selectedStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setDraft((prev) => ({
                            ...prev,
                            selectedStatus: opt.value,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-800 border-amber-800 text-white font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleResetDraft}
                disabled={!hasDraftChanges}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                  hasDraftChanges
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer'
                    : 'text-slate-400 cursor-not-allowed opacity-50'
                }`}
              >
                <RotateCcw size={13} />
                <span>Bỏ chọn tất cả</span>
              </button>

              <button
                type="button"
                disabled={previewCount === 0}
                onClick={handleApply}
                className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer ${
                  previewCount > 0
                    ? 'bg-amber-800 hover:bg-amber-900 text-white shadow-amber-900/10'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {previewCount === 0
                  ? 'Không có sự kiện phù hợp'
                  : `Xem ${previewCount.toLocaleString('vi-VN')} sự kiện`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
