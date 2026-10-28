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
  /** Dải thông báo phía trên biểu mẫu (vd. phiên bản / bản sửa chờ duyệt). */
  banner?: React.ReactNode;
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
}: EntityDetailLayoutProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const totalSections = sections.length;
  const currentSection = sections[activeIndex] || sections[0];

  const handlePrev = () => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => Math.min(totalSections - 1, prev + 1));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-2">
      {/* Top Header Block (Giống abc.png) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-xs">
        <div className="flex flex-col gap-4">
          {/* Hàng 1: Breadcrumb + Badge trạng thái góc phải */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap"
            >
              {breadcrumbs.map((seg, idx) => (
                <React.Fragment key={`${seg.label}-${idx}`}>
                  {idx > 0 && <span className="text-slate-300">/</span>}
                  {seg.href ? (
                    <Link
                      href={seg.href}
                      className="hover:text-amber-700 transition font-medium"
                    >
                      {seg.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800 font-semibold">
                      {seg.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              {recordId && (
                <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  ID: {recordId.slice(0, 8)}...
                </span>
              )}
              <Badge tone={STATUS_TONE_MAP[status]}>
                {STATUS_LABEL_MAP[status]}
              </Badge>
            </div>
          </div>

          {/* Hàng 2: Tiêu đề & Mô tả phụ */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>

          {/* Hàng 3: Action Pill Buttons (Xem trước | Sao chép dữ liệu mẫu | Lưu nháp | ✓ Xuất bản) */}
          <div className="flex items-center justify-between gap-2.5 flex-wrap pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              {onPreview && (
                <button
                  type="button"
                  onClick={onPreview}
                  className="text-xs px-3.5 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Icon name={IconName.EYE} size={14} />
                  <span>Xem trước</span>
                </button>
              )}

              {onFillSampleData && (
                <button
                  type="button"
                  onClick={onFillSampleData}
                  className="text-xs px-3.5 py-2 rounded-full border border-slate-300 bg-white hover:bg-amber-50 hover:border-amber-300 text-slate-700 hover:text-amber-900 font-medium inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Icon name={IconName.SPARK} size={14} />
                  <span>Sao chép dữ liệu mẫu</span>
                </button>
              )}

              <button
                type="button"
                onClick={onSaveDraft}
                disabled={Boolean(savingAction)}
                className="text-xs px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                {savingAction === ContentAction.DRAFT && (
                  <span className="w-3 h-3 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                )}
                <span>
                  {savingAction === ContentAction.DRAFT ? 'Đang lưu nháp...' : 'Lưu nháp'}
                </span>
              </button>

              <button
                type="button"
                onClick={onPublish}
                disabled={Boolean(savingAction)}
                className="text-xs px-4 py-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-60 shadow-2xs"
              >
                {savingAction === ContentAction.PUBLISH ? (
                  <span className="w-3.5 h-3.5 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                ) : (
                  <Icon name={IconName.CHECK} size={14} />
                )}
                <span>
                  {savingAction === ContentAction.PUBLISH ? 'Đang xuất bản...' : 'Xuất bản'}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onCancel}
              disabled={Boolean(savingAction)}
              className="text-xs text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>

      {banner}

      {/* Main Split Layout: LEFT BAR ("CÁC PHẦN CỦA BIỂU MẪU") + RIGHT FORM PANEL */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onPublish();
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR: CÁC PHẦN CỦA BIỂU MẪU (4 cols trên Desktop) */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs lg:sticky lg:top-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-3 border-b border-slate-100">
              CÁC PHẦN CỦA BIỂU MẪU
            </div>

            <nav
              aria-label="Các phần của biểu mẫu"
              className="mt-2.5 space-y-1.5"
            >
              {sections.map((sec, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left text-xs transition cursor-pointer ${
                      isActive
                        ? 'bg-[#EFE3C8] text-[#5C3D1E] font-bold shadow-2xs border border-[#DFC99B]'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        name={sec.icon}
                        size={15}
                        className={
                          isActive ? 'text-[#6E4720] shrink-0' : 'text-slate-400 shrink-0'
                        }
                      />
                      <span className="truncate">
                        {sec.stepNumber}. {sec.title}
                      </span>
                      {sec.badgeCount !== undefined && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-auto shrink-0 ${
                            isActive
                              ? 'bg-[#5C3D1E] text-amber-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {sec.badgeCount}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs font-bold shrink-0 ml-1.5 ${
                        isActive ? 'text-[#6E4720]' : 'text-slate-300'
                      }`}
                    >
                      ›
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Tóm tắt tiến độ mục hiện tại ở dưới Left Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 px-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Đang mở mục</span>
              <span className="font-mono font-semibold text-slate-700">
                Mục {activeIndex + 1}/{totalSections}
              </span>
            </div>
          </aside>

          {/* RIGHT MAIN PANEL: Nội dung chi tiết của mục đang chọn + Thanh Trước / Tiếp theo (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between min-h-[480px]">
            <div>
              {/* Header của Mục hiện tại */}
              <div className="border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {currentSection.title}
                  </h2>
                  <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                    Mục {activeIndex + 1}/{totalSections}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {currentSection.subtitle}
                </p>
              </div>

              {/* Nội dung Form của mục đang mở */}
              <div className="py-1">{currentSection.content}</div>
            </div>

            {/* Footer Stepper Bar: ← Trước | Mục X/6 | Tiếp theo → (Giống abc.png) */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activeIndex === 0}
                className="text-xs px-4 py-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Trước
              </button>

              <span className="text-xs font-medium text-slate-500">
                Mục {activeIndex + 1}/{totalSections}
              </span>

              {activeIndex < totalSections - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold transition cursor-pointer shadow-2xs"
                >
                  Tiếp theo →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPublish}
                  disabled={Boolean(savingAction)}
                  className="text-xs px-4 py-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold transition cursor-pointer shadow-2xs"
                >
                  ✓ Hoàn tất & Xuất bản
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
