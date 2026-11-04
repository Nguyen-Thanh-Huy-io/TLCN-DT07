'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { ContentAction, ContentStatus } from '@/constants/enums';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';

export interface BreadcrumbSegment {
  label: string;
  href?: string;
}

export interface DataCompletenessItem {
  label: string;
  description?: string;
  completed: boolean;
  required?: boolean;
}

export interface FormSectionConfig {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: IconName;
  badgeCount?: number | string;
  content: React.ReactNode;
}

export interface EntityDetailLayoutProps {
  breadcrumbs: BreadcrumbSegment[];
  title: string;
  subtitle?: string;
  recordId?: string;
  status: ContentStatus;
  savingAction: ContentAction | 'DRAFT' | 'PUBLISH' | null;
  onSaveDraft: () => void;
  onPublish: () => void;
  onCancel: () => void;
  onFillSampleData?: () => void;
  onPreview?: () => void;
  sections: FormSectionConfig[];
  banner?: React.ReactNode;
  navigationLayout?: 'SIDEBAR' | 'HORIZONTAL_STEPPER';
  activeSectionIndex?: number;
  onActiveSectionIndexChange?: (index: number) => void;
  hideHeaderPublish?: boolean;
}

export function EntityDetailLayout({
  breadcrumbs,
  title,
  subtitle = 'Quản lý thông tin và các mối liên hệ lịch sử.',
  recordId,
  status,
  savingAction,
  onSaveDraft,
  onPublish,
  onCancel,
  onFillSampleData,
  onPreview,
  sections,
  banner,
  navigationLayout = 'SIDEBAR',
  activeSectionIndex,
  onActiveSectionIndexChange,
  hideHeaderPublish = false,
}: EntityDetailLayoutProps) {
  const [internalActiveIndex, setInternalActiveIndex] = useState<number>(0);
  const isControlled = activeSectionIndex !== undefined;
  const activeIndex = isControlled ? activeSectionIndex : internalActiveIndex;

  const setActiveIndex = (idxOrFn: number | ((prev: number) => number)) => {
    const next = typeof idxOrFn === 'function' ? idxOrFn(activeIndex) : idxOrFn;
    if (!isControlled) {
      setInternalActiveIndex(next);
    }
    onActiveSectionIndexChange?.(next);
  };

  const totalSections = sections.length;
  const currentSection = sections[activeIndex] || sections[0];

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(totalSections - 1, prev + 1));
  };

  const isStudioSection = currentSection.id === 'content-detail';

  return (
    <div className="w-full px-1 sm:px-2 py-1 studio-full-bleed">
      {/* Header trang phẳng, không lồng card */}
      <div className="border-b border-stone-200 pb-4 mb-4">
        <div className="flex flex-col gap-3">
          {/* Hàng 1: Đường dẫn + Trạng thái góc phải */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <nav
              aria-label="Đường dẫn trang"
              className="flex items-center gap-2 text-sm text-stone-600 flex-wrap"
            >
              {breadcrumbs.map((seg, idx) => (
                <React.Fragment key={`${seg.label}-${idx}`}>
                  {idx > 0 && <span className="text-stone-400">/</span>}
                  {seg.href ? (
                    <Link
                      href={seg.href}
                      className="hover:text-stone-900 transition-colors font-medium text-stone-600"
                    >
                      {seg.label}
                    </Link>
                  ) : (
                    <span className="text-stone-900 font-semibold">
                      {seg.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {recordId && (
                <span className="text-xs font-mono text-stone-700 bg-white border border-stone-200 px-2.5 py-1 rounded-md">
                  Mã: {recordId.slice(0, 8)}...
                </span>
              )}
              <Badge tone={STATUS_TONE_MAP[status]}>
                {STATUS_LABEL_MAP[status]}
              </Badge>
            </div>
          </div>

          {/* Hàng 2: Tiêu đề & Mô tả phụ + Nút hành động */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-[28px] font-bold text-stone-900 tracking-tight leading-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-base text-stone-600 mt-1 max-w-[65ch]">{subtitle}</p>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {onPreview && (
                <button
                  type="button"
                  onClick={onPreview}
                  className="text-sm px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon name={IconName.EYE} size={15} />
                  <span>Xem trước</span>
                </button>
              )}

              {onFillSampleData && (
                <button
                  type="button"
                  onClick={onFillSampleData}
                  className="text-sm px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Icon name={IconName.SPARK} size={15} />
                  <span>Dữ liệu mẫu</span>
                </button>
              )}

              <button
                type="button"
                onClick={onSaveDraft}
                disabled={Boolean(savingAction)}
                className="text-sm px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>
                  {savingAction === ContentAction.DRAFT ? 'Đang lưu nháp...' : 'Lưu nháp'}
                </span>
              </button>

              {!hideHeaderPublish && (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={Boolean(savingAction)}
                  className="text-sm px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
                >
                  <Icon name={IconName.CHECK} size={15} />
                  <span>
                    {savingAction === ContentAction.PUBLISH ? 'Đang xuất bản...' : 'Xuất bản'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={onCancel}
                disabled={Boolean(savingAction)}
                className="text-sm text-stone-700 hover:text-stone-950 px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer font-medium"
              >
                Quay lại danh sách
              </button>
            </div>
          </div>
        </div>
      </div>

      {banner}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPublish();
        }}
      >
        {navigationLayout === 'HORIZONTAL_STEPPER' ? (
          <div className="space-y-4">
            {/* Thanh các bước ngang phẳng (Không tạo nested card, không chữ xám trên nền màu) */}
            <nav
              aria-label="Các phần của biểu mẫu"
              className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-2"
            >
              {sections.map((sec, index) => {
                const isActive = index === activeIndex;
                const isPassed = index < activeIndex;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-white border-stone-900'
                        : isPassed
                        ? 'bg-white text-stone-900 border-stone-300 hover:bg-stone-50'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isActive
                          ? 'bg-white text-stone-900'
                          : isPassed
                          ? 'bg-stone-900 text-white'
                          : 'border border-stone-300 text-stone-800 bg-white'
                      }`}
                    >
                      {isPassed ? '✓' : sec.stepNumber}
                    </span>
                    <span className="min-w-0 flex-1 text-sm truncate font-semibold leading-snug">
                      {sec.title}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Nội dung Bước */}
            {isStudioSection ? (
              <div className="space-y-4">
                <div>{currentSection.content}</div>

                {/* Chân trang điều hướng phẳng bên dưới trình dựng trang */}
                <div className="flex items-center justify-between pt-3">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    className="text-sm px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold transition-colors cursor-pointer disabled:opacity-40"
                  >
                    ← Quay lại mục trước
                  </button>

                  <span className="text-sm font-medium text-stone-700">
                    Bước {activeIndex + 1} / {totalSections}
                  </span>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-sm px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span>Tiếp tục: {sections[activeIndex + 1]?.title}</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-stone-200 rounded-xl p-6">
                <div className="border-b border-stone-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-[22px] font-bold text-stone-900">
                      Mục {currentSection.stepNumber}: {currentSection.title}
                    </h3>
                    <p className="text-base text-stone-600 mt-1 max-w-[65ch]">
                      {currentSection.subtitle}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-stone-800 border border-stone-300 px-3 py-1 rounded-full self-start sm:self-auto">
                    Bước {activeIndex + 1} / {totalSections}
                  </span>
                </div>

                <div className="min-h-[420px]">{currentSection.content}</div>

                <div className="border-t border-stone-200 flex items-center justify-between mt-8 pt-5">
                  <button
                    type="button"
                    onClick={handlePrev}
                    disabled={activeIndex === 0}
                    className="text-sm px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-semibold transition-colors cursor-pointer disabled:opacity-40"
                  >
                    ← Quay lại mục trước
                  </button>

                  <span className="text-sm font-medium text-stone-700">
                    Bước {activeIndex + 1} / {totalSections}
                  </span>

                  {activeIndex < totalSections - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="text-sm px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span>Tiếp tục: {sections[activeIndex + 1]?.title}</span>
                      <span>→</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onPublish}
                      disabled={Boolean(savingAction)}
                      className="text-sm px-5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <span>✓ Hoàn tất & Xuất bản</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <aside className="lg:col-span-4 bg-white border border-stone-200 rounded-xl p-4 lg:sticky lg:top-4">
              <div className="text-xs font-bold uppercase tracking-wider text-stone-700 px-2 pb-3 border-b border-stone-200">
                CÁC PHẦN CỦA BIỂU MẪU
              </div>

              <nav aria-label="Các phần của biểu mẫu" className="mt-2.5 space-y-1.5">
                {sections.map((sec, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-stone-900 text-white font-semibold'
                          : 'text-stone-800 hover:bg-stone-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          name={sec.icon}
                          size={16}
                          className={isActive ? 'text-white shrink-0' : 'text-stone-600 shrink-0'}
                        />
                        <span className="truncate">
                          {sec.stepNumber}. {sec.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </aside>

            <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-6 flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="border-b border-stone-200 pb-4 mb-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[22px] font-bold text-stone-900">
                      {currentSection.title}
                    </h3>
                    <span className="text-sm font-medium text-stone-800 border border-stone-300 px-3 py-1 rounded-full">
                      Mục {activeIndex + 1}/{totalSections}
                    </span>
                  </div>
                  <p className="text-base text-stone-600 mt-1 max-w-[65ch]">
                    {currentSection.subtitle}
                  </p>
                </div>

                <div className="py-1">{currentSection.content}</div>
              </div>

              <div className="mt-8 pt-4 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeIndex === 0}
                  className="text-sm px-4 py-2 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-medium transition-colors cursor-pointer disabled:opacity-40"
                >
                  ← Trước
                </button>

                <span className="text-sm font-medium text-stone-700">
                  Mục {activeIndex + 1}/{totalSections}
                </span>

                {activeIndex < totalSections - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="text-sm px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold transition-colors cursor-pointer"
                  >
                    Tiếp theo →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPublish}
                    disabled={Boolean(savingAction)}
                    className="text-sm px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-bold transition-colors cursor-pointer"
                  >
                    ✓ Hoàn tất & Xuất bản
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
