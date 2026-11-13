'use client';

import React from 'react';
import Link from 'next/link';
import { CalendarDays, Clock, Landmark, ScrollText, Sparkles, Quote, ArrowUpRight, Share2, Compass, PanelRightClose, PanelRightOpen, ArrowUp, ArrowDown, BookOpen, PanelLeftClose, PanelLeftOpen, PanelLeft, Type, Printer, Maximize2, Minimize2 } from 'lucide-react';
import { EntityReaderModel, EntityAdjacent } from './entity-reader-adapter';
import { getEntityIconComponent, EntityIconName } from './entity-strategy';
import { PublicEntityStatementDto } from '@/services/entities/landing.service';
import { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';

// === EntityHero.tsx ===
interface EntityHeroProps {
  model: EntityReaderModel;
}

function BadgeIcon({ iconName }: { iconName: EntityIconName }) {
  return React.createElement(getEntityIconComponent(iconName), {
    size: 14,
    className: 'ue-hero-badge-icon',
  });
}

export const EntityHero: React.FC<EntityHeroProps> = ({ model }) => {
  return (
    <section className="ue-hero">
      {/* HỌA TIẾT NỀN HOA VĂN BẢO TÀNG SỐ */}
      <div className="ue-hero-pattern-overlay" aria-hidden="true" />

      <div className="ue-container relative z-10">
        {/* HERO GRID 2 CỘT CÂN ĐỐI */}
        <div className="ue-hero-grid">
          {/* CỘT TRÁI: TIÊU ĐỀ, MÔ TẢ & THẺ CHỈ SỐ NHANH */}
          <div className="ue-hero-left">
            <div className="ue-hero-badge-wrap">
              <div
                className="ue-hero-badge"
                style={{
                  color: model.strategy.themeColor,
                  backgroundColor: model.strategy.themeBg,
                  borderColor: `${model.strategy.themeColor}33`,
                }}
              >
                <BadgeIcon iconName={model.strategy.iconName} />
                <span>{model.strategy.badgeLabel}</span>
              </div>

              {model.hanziName && (
                <span className="ue-hero-hanzi-badge" title="Tên chữ Hán / Miếu hiệu">
                  {model.hanziName}
                </span>
              )}
            </div>

            <p className="ue-hero-eyebrow">{model.strategy.heroEyebrow}</p>
            
            <div className="ue-hero-title-group">
              <h1 className="ue-hero-title">{model.name}</h1>
              {model.hanziName && (
                <span className="ue-hero-title-hanzi">{model.hanziName}</span>
              )}
            </div>

            <div className="ue-hero-meta">
              <span className="ue-meta-item">
                <CalendarDays size={16} className="text-[#8C2D19]" />
                <span className="font-medium">{model.dateLabel}</span>
              </span>

              {model.periodName && model.periodHref && (
                <span className="ue-meta-item">
                  <Landmark size={16} className="text-[#8C6239]" />
                  <Link href={model.periodHref} className="hover:underline text-[#8C2D19] font-medium">
                    {model.periodName}
                  </Link>
                </span>
              )}

              <span className="ue-meta-item">
                <Clock size={16} className="text-[#8C6239]" />
                <span>{model.readMinutes} phút khảo cứu</span>
              </span>
            </div>

            {/* ĐOẠN DẪN NHẬP / TRÍCH LƯỢC CỦA HỒ SƠ */}
            {model.tagline && (
              <div className="ue-hero-lead-card">
                <Quote size={20} className="ue-hero-lead-quote-icon" />
                <p className="ue-hero-lead-text">{model.tagline}</p>
              </div>
            )}

            {/* QUICK STATS: CÁC KHỐI SỐ LIỆU NỔI BẬT ĐƯỢC CHUẨN HÓA LOGIC */}
            {model.quickStats && model.quickStats.length > 0 && (
              <div
                className={`ue-stats-grid ${
                  model.quickStats.length === 3 ? 'ue-stats-grid-3' : ''
                }`}
              >
                {model.quickStats.map((stat) => (
                  <div key={stat.id} className="ue-stat-card">
                    <span
                      className={`ue-stat-value ${
                        stat.value.length > 14 ? 'ue-stat-value-long' : ''
                      }`}
                      title={stat.value}
                    >
                      {stat.value}
                    </span>
                    <span className="ue-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CỘT PHẢI: KHUNG CHÂN DUNG HOÀNG GIA / HIỆN VẬT & HỒ SƠ TÓM LƯỢC */}
          <div className="ue-hero-right-pane">
            {model.imageUrl ? (
              <figure className="ue-hero-figure">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.imageUrl}
                  alt={model.name}
                  className="ue-hero-image"
                />
                {model.imageCaption && (
                  <figcaption className="ue-hero-caption">
                    {model.imageCaption}
                  </figcaption>
                )}
              </figure>
            ) : (
              /* KHUNG CHÂN DUNG BIỂU TRƯNG HOÀNG GIA KHI CHƯA CÓ ẢNH CHỤP */
              <div className="ue-hero-portrait-fallback">
                <div className="ue-portrait-inner">
                  <div className="ue-portrait-ornament-corner top-left" />
                  <div className="ue-portrait-ornament-corner top-right" />
                  <div className="ue-portrait-ornament-corner bottom-left" />
                  <div className="ue-portrait-ornament-corner bottom-right" />

                  <div className="ue-portrait-header">
                    <Sparkles size={14} className="text-[#B8860B]" />
                    <span className="ue-portrait-category">
                      {model.strategy.heroPortraitBadge}
                    </span>
                    <Sparkles size={14} className="text-[#B8860B]" />
                  </div>

                  {/* HUY HIỆU CON DẤU / CHỮ HÁN THƯ PHÁP CỔ */}
                  <div className="ue-portrait-emblem">
                    <div className="ue-portrait-seal">
                      <span className="ue-portrait-seal-text">
                        {model.hanziName || model.name.slice(0, 2)}
                      </span>
                    </div>
                  </div>

                  <h3 className="ue-portrait-name">{model.name}</h3>
                  <p className="ue-portrait-period">
                    {model.periodName ?? 'Đại Việt Sử Ký Toàn Thư'}
                  </p>
                  
                  <div className="ue-portrait-timeline-pill">
                    <span>{model.dateLabel}</span>
                  </div>
                </div>
              </div>
            )}

            {/* HỒ SƠ TÓM LƯỢC SANG TRỌNG PHONG CÁCH THƯ TỊCH CỔ */}
            {model.facts && model.facts.length > 0 && (
              <div className="ue-hero-infobox">
                <div className="ue-hero-infobox-header">
                  <div className="flex items-center gap-2">
                    <ScrollText size={16} className="text-[#8C2D19]" />
                    <span>HỒ SƠ TÓM LƯỢC</span>
                  </div>
                  <span className="ue-infobox-archive-tag">Tư liệu số</span>
                </div>

                <div className="ue-hero-facts-list">
                  {model.facts.map((fact) => (
                    <div key={fact.id} className="ue-hero-fact-row">
                      <span className="ue-hero-fact-label">{fact.label}</span>
                      <div className="ue-hero-fact-value">
                        {fact.href ? (
                          <Link href={fact.href} className="hover:underline">
                            {fact.value}
                          </Link>
                        ) : (
                          <span>{fact.value}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// === EntityKnowledgeGraph.tsx ===
interface EntityKnowledgeGraphProps {
  statements: PublicEntityStatementDto[];
}

function resolveEntityHref(type: string | null, slug: string | null): string {
  if (!slug) return '#';
  // Luôn dẫn tới trang Universal Entity Reader với đầy đủ Block Builder & Focus Mode
  return `/thuc-the/${slug}`;
}

export const EntityKnowledgeGraph: React.FC<EntityKnowledgeGraphProps> = ({
  statements,
}) => {
  if (!statements || statements.length === 0) return null;

  return (
    <section className="ue-kg-section" id="mang-luoi-tri-thuc">
      <div className="flex items-center gap-2 mb-2">
        <Share2 size={22} className="text-[#8C2D19]" />
        <h2 className="ue-kg-title m-0">Mạng lưới Liên kết Tri thức</h2>
      </div>
      <p className="ue-kg-desc">
        Các mối liên hệ nhân – quả, quan hệ phả hệ, quyền lực và không gian lịch sử được kết nối trong đồ thị tri thức:
      </p>

      <div className="ue-kg-grid">
        {statements.map((stmt) => {
          const href = resolveEntityHref(stmt.relatedEntityType, stmt.relatedEntitySlug);
          const targetName = stmt.relatedEntityName || 'Thực thể liên quan';
          const badgeText = stmt.roleLabel || stmt.predicateLabel;

          return (
            <Link key={stmt.id} href={href} className="ue-kg-card group">
              <div>
                <span className="ue-kg-badge">{badgeText}</span>
                <h3 className="ue-kg-target group-hover:text-[#8C2D19] transition-colors flex items-center justify-between">
                  <span>{targetName}</span>
                  <ArrowUpRight size={16} className="text-stone-400 group-hover:text-[#8C2D19] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </h3>
                {stmt.note && <p className="ue-kg-note">{stmt.note}</p>}
              </div>

              {(stmt.validFromYear != null || stmt.validToYear != null) && (
                <div className="text-xs text-stone-500 font-semibold mt-3 pt-2 border-t border-stone-200">
                  Thời gian: {stmt.validFromYear ?? '...'} – {stmt.validToYear ?? '...'}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

// === EntityReadingTimeline.tsx ===
interface EntityReadingTimelineProps {
  hasTimeline: boolean;
  isTimelineOpen: boolean;
  isFocusMode: boolean;
  previous: EntityAdjacent | null;
  next: EntityAdjacent | null;
  currentName: string;
  currentDateLabel: string;
  onToggleTimeline: () => void;
}

export function EntityReadingTimeline({
  hasTimeline,
  isTimelineOpen,
  isFocusMode,
  previous,
  next,
  currentName,
  currentDateLabel,
  onToggleTimeline,
}: EntityReadingTimelineProps) {
  if (!hasTimeline) return null;

  if (isTimelineOpen) {
    return (
      <aside className="ue-timeline-col hidden xl:block">
        <div className="ue-timeline-nav-card">
          <div className="ue-timeline-nav-header">
            <div className="flex items-center gap-1.5 flex-1">
              <Compass size={14} className="text-[#8C2D19]" />
              <span>TIẾN TRÌNH LỊCH SỬ</span>
            </div>
            <button
              type="button"
              onClick={onToggleTimeline}
              className="ue-sidebar-collapse-btn"
              title="Thu gọn tiến trình"
            >
              <PanelRightClose size={14} />
            </button>
          </div>

          <div className="ue-timeline-track">
            {/* 1. MỐC TRIỀU ĐẠI TRƯỚC */}
            {previous && (
              <Link
                href={previous.href}
                className="ue-track-step prev"
                title={`Xem triều đại trước: ${previous.name}`}
              >
                <div className="ue-track-node prev">
                  <ArrowUp size={12} />
                </div>
                <div className="ue-track-info">
                  <span className="ue-track-tag">Triều đại trước</span>
                  <strong className="ue-track-name">{previous.name}</strong>
                  {previous.dateLabel && (
                    <span className="ue-track-date">{previous.dateLabel}</span>
                  )}
                </div>
              </Link>
            )}

            {/* ĐƯỜNG NỐI DÒNG THỜI GIAN */}
            {previous && <div className="ue-track-line" />}

            {/* 2. MỐC TRIỀU ĐẠI HIỆN TẠI (ACTIVE) */}
            <div className="ue-track-step active">
              <div className="ue-track-node active">
                <span className="ue-track-pulse" />
              </div>
              <div className="ue-track-info">
                <span className="ue-track-tag active">Đang khảo cứu</span>
                <strong className="ue-track-name active">{currentName}</strong>
                <span className="ue-track-date active">{currentDateLabel}</span>
              </div>
            </div>

            {/* ĐƯỜNG NỐI DÒNG THỜI GIAN */}
            {next && <div className="ue-track-line" />}

            {/* 3. MỐC TRIỀU ĐẠI TIẾP THEO */}
            {next && (
              <Link
                href={next.href}
                className="ue-track-step next"
                title={`Xem triều đại tiếp theo: ${next.name}`}
              >
                <div className="ue-track-node next">
                  <ArrowDown size={12} />
                </div>
                <div className="ue-track-info">
                  <span className="ue-track-tag">Triều đại sau</span>
                  <strong className="ue-track-name">{next.name}</strong>
                  {next.dateLabel && (
                    <span className="ue-track-date">{next.dateLabel}</span>
                  )}
                </div>
              </Link>
            )}
          </div>
        </div>
      </aside>
    );
  }

  if (!isFocusMode) {
    return (
      <aside className="ue-dock-col hidden xl:block">
        <button
          type="button"
          onClick={onToggleTimeline}
          className="ue-dock-tab ue-dock-right"
          title="Mở lại Tiến trình lịch sử"
        >
          <PanelRightOpen size={16} />
          <span className="ue-dock-text">TIẾN TRÌNH</span>
        </button>
      </aside>
    );
  }

  return null;
}

// === EntityReadingToc.tsx ===
export const KNOWLEDGE_GRAPH_SECTION_ID = 'mang-luoi-tri-thuc';

interface EntityReadingTocProps {
  isTocOpen: boolean;
  isFocusMode: boolean;
  toc: LessonTocEntry[];
  activeId: string;
  readProgress: number;
  readMinutes: number;
  hasStatements: boolean;
  onToggleToc: () => void;
  onScrollToHeading: (id: string) => void;
}

export function EntityReadingToc({
  isTocOpen,
  isFocusMode,
  toc,
  activeId,
  readProgress,
  readMinutes,
  hasStatements,
  onToggleToc,
  onScrollToHeading,
}: EntityReadingTocProps) {
  if (isTocOpen) {
    return (
      <aside className="ue-toc-col hidden lg:block">
        <div className="ue-toc-card">
          <div className="ue-toc-header">
            <div className="flex items-center gap-2">
              <BookOpen size={15} className="text-[#8C2D19]" />
              <span>MỤC LỤC TƯ LIỆU</span>
              <button
                type="button"
                onClick={onToggleToc}
                className="ue-sidebar-collapse-btn"
                title="Thu gọn mục lục"
              >
                <PanelLeftClose size={14} />
              </button>
            </div>
            <strong className="ue-toc-percent">{readProgress}%</strong>
          </div>

          <nav className="ue-toc-list">
            {toc.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onScrollToHeading(item.id)}
                className={`ue-toc-link ${item.level === 3 ? 'level-3' : ''} ${
                  activeId === item.id ? 'active' : ''
                }`}
              >
                {item.text}
              </button>
            ))}

            {hasStatements && (
              <button
                type="button"
                onClick={() => onScrollToHeading(KNOWLEDGE_GRAPH_SECTION_ID)}
                className={`ue-toc-link ${
                  activeId === KNOWLEDGE_GRAPH_SECTION_ID ? 'active' : ''
                }`}
              >
                Mạng lưới Tri thức
              </button>
            )}
          </nav>

          <div className="ue-toc-footer">
            <BookOpen size={14} />
            <span>Ước tính {readMinutes} phút khảo cứu</span>
          </div>
        </div>
      </aside>
    );
  }

  if (!isFocusMode) {
    return (
      <aside className="ue-dock-col hidden lg:block">
        <button
          type="button"
          onClick={onToggleToc}
          className="ue-dock-tab ue-dock-left"
          title="Mở lại Mục lục tư liệu"
        >
          <PanelLeftOpen size={16} />
          <span className="ue-dock-text">MỤC LỤC</span>
        </button>
      </aside>
    );
  }

  return null;
}

// === EntityReadingToolbar.tsx ===
export enum TextSizeLevel {
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
}

interface EntityReadingToolbarProps {
  isTocOpen: boolean;
  isTimelineOpen: boolean;
  isFocusMode: boolean;
  hasTimeline: boolean;
  readProgress: number;
  textSize: TextSizeLevel;
  onToggleToc: () => void;
  onToggleTimeline: () => void;
  onToggleFocusMode: () => void;
  onTextSizeChange: (size: TextSizeLevel) => void;
  onPrint: () => void;
}

export function EntityReadingToolbar({
  isTocOpen,
  isTimelineOpen,
  isFocusMode,
  hasTimeline,
  readProgress,
  textSize,
  onToggleToc,
  onToggleTimeline,
  onToggleFocusMode,
  onTextSizeChange,
  onPrint,
}: EntityReadingToolbarProps) {
  return (
    <div className="ue-reading-toolbar">
      <div className="ue-toolbar-group left">
        <span className="ue-toolbar-label">KHÔNG GIAN ĐỌC</span>

        <button
          type="button"
          onClick={onToggleToc}
          className={`ue-toolbar-btn ${isTocOpen ? 'active' : ''}`}
          title={isTocOpen ? 'Thu gọn mục lục để mở rộng bài đọc' : 'Mở mục lục tư liệu'}
        >
          <PanelLeft size={14} />
          <span>Mục lục</span>
          <span className={`ue-toolbar-dot ${isTocOpen ? 'on' : 'off'}`} />
        </button>

        {hasTimeline && (
          <button
            type="button"
            onClick={onToggleTimeline}
            className={`ue-toolbar-btn ${isTimelineOpen ? 'active' : ''}`}
            title={isTimelineOpen ? 'Thu gọn tiến trình' : 'Mở tiến trình lịch sử'}
          >
            <Compass size={14} />
            <span>Tiến trình</span>
            <span className={`ue-toolbar-dot ${isTimelineOpen ? 'on' : 'off'}`} />
          </button>
        )}
      </div>

      {/* TIẾN ĐỘ ĐỌC TRỰC QUAN */}
      <div className="ue-toolbar-group center hidden md:flex items-center gap-2">
        <div className="ue-progress-track">
          <div
            className="ue-progress-fill"
            style={{ width: `${readProgress}%` }}
          />
        </div>
        <span className="ue-progress-text">{readProgress}% hoàn thành</span>
      </div>

      <div className="ue-toolbar-group right">
        {/* BỘ CHỈNH CỠ CHỮ */}
        <div className="ue-font-size-ctrl" title="Tùy chỉnh cỡ chữ">
          <Type size={13} className="text-[#8C6239] mr-1" />
          <button
            type="button"
            onClick={() => onTextSizeChange(TextSizeLevel.SM)}
            className={`ue-size-btn ${textSize === TextSizeLevel.SM ? 'active' : ''}`}
            title="Cỡ chữ nhỏ"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => onTextSizeChange(TextSizeLevel.MD)}
            className={`ue-size-btn ${textSize === TextSizeLevel.MD ? 'active' : ''}`}
            title="Cỡ chữ tiêu chuẩn"
          >
            A
          </button>
          <button
            type="button"
            onClick={() => onTextSizeChange(TextSizeLevel.LG)}
            className={`ue-size-btn ${textSize === TextSizeLevel.LG ? 'active' : ''}`}
            title="Cỡ chữ lớn"
          >
            A+
          </button>
        </div>

        {/* IN ẤN TƯ LIỆU */}
        <button
          type="button"
          onClick={onPrint}
          className="ue-toolbar-btn hidden sm:inline-flex"
          title="In hoặc lưu hồ sơ dạng PDF"
        >
          <Printer size={14} />
          <span className="hidden lg:inline">In hồ sơ</span>
        </button>

        {/* CHẾ ĐỘ ĐỌC TOÀN CẢNH */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`ue-toolbar-btn focus-mode-btn ${isFocusMode ? 'focus-active' : ''}`}
          title={isFocusMode ? 'Trở về bố cục 3 cột chuẩn' : 'Bật chế độ đọc toàn cảnh'}
        >
          {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          <span>{isFocusMode ? 'Thu nhỏ' : 'Toàn cảnh'}</span>
        </button>
      </div>
    </div>
  );
}
