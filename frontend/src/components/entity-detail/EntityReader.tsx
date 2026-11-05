'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Compass,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Maximize2,
  Minimize2,
  ExternalLink,
  Type,
  Printer,
} from 'lucide-react';
import { EntityReaderModel } from './entity-reader-adapter';
import { EntityKnowledgeGraph } from './EntityKnowledgeGraph';
import { useReadingLayout } from './use-reading-layout';
import { DiscussionSection } from '@/features/discussions/components/DiscussionSection';
import { useNoteFacade } from '@/features/notes/facades/useNoteFacade';
import { NoteDrawer } from '@/features/notes/components/NoteDrawer';
import { NoteFloatingButton } from '@/features/notes/components/NoteFloatingButton';
import { NOTE_TARGET_TYPE } from '@/features/notes/types/note.types';

interface EntityReaderProps {
  model: EntityReaderModel;
}

type TextSize = 'sm' | 'md' | 'lg';

export const EntityReader: React.FC<EntityReaderProps> = ({ model }) => {
  const noteFacade = useNoteFacade(NOTE_TARGET_TYPE.ARTICLE, model.id || model.slug);
  const [activeId, setActiveId] = useState<string>('');
  const [readProgress, setReadProgress] = useState<number>(0);
  const [textSize, setTextSize] = useState<TextSize>('md');

  const hasTimeline = Boolean(model.previous || model.next);
  const {
    isTocOpen,
    isTimelineOpen,
    isFocusMode,
    layoutClass,
    toggleToc,
    toggleTimeline,
    toggleFocusMode,
  } = useReadingLayout(hasTimeline);

  // Tính toán phần trăm tiến độ cuộn & heading active
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = Math.min(
          100,
          Math.max(0, (window.scrollY / totalHeight) * 100),
        );
        setReadProgress(Math.round(currentProgress));
      }

      const headings = model.toc
        .map((item) => document.getElementById(item.id))
        .filter(Boolean);
      for (let i = headings.length - 1; i >= 0; i--) {
        const el = headings[i];
        if (el && el.getBoundingClientRect().top <= 160) {
          setActiveId(el.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [model.toc]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`ue-container ${isFocusMode ? 'ue-container-focus' : ''}`}>
      {/* THANH ĐIỀU KHIỂN KHÔNG GIAN ĐỌC (READING WORKSPACE TOOLBAR) */}
      <div className="ue-reading-toolbar">
        <div className="ue-toolbar-group left">
          <span className="ue-toolbar-label">KHÔNG GIAN ĐỌC</span>

          <button
            type="button"
            onClick={toggleToc}
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
              onClick={toggleTimeline}
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
              onClick={() => setTextSize('sm')}
              className={`ue-size-btn ${textSize === 'sm' ? 'active' : ''}`}
              title="Cỡ chữ nhỏ"
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setTextSize('md')}
              className={`ue-size-btn ${textSize === 'md' ? 'active' : ''}`}
              title="Cỡ chữ tiêu chuẩn"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setTextSize('lg')}
              className={`ue-size-btn ${textSize === 'lg' ? 'active' : ''}`}
              title="Cỡ chữ lớn"
            >
              A+
            </button>
          </div>

          {/* IN ẤN TƯ LIỆU */}
          <button
            type="button"
            onClick={handlePrint}
            className="ue-toolbar-btn hidden sm:inline-flex"
            title="In hoặc lưu hồ sơ dạng PDF"
          >
            <Printer size={14} />
            <span className="hidden lg:inline">In hồ sơ</span>
          </button>

          {/* CHẾ ĐỘ ĐỌC TOÀN CẢNH */}
          <button
            type="button"
            onClick={toggleFocusMode}
            className={`ue-toolbar-btn focus-mode-btn ${isFocusMode ? 'focus-active' : ''}`}
            title={isFocusMode ? 'Trở về bố cục 3 cột chuẩn' : 'Bật chế độ đọc toàn cảnh'}
          >
            {isFocusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span>{isFocusMode ? 'Thu nhỏ' : 'Toàn cảnh'}</span>
          </button>
        </div>
      </div>

      <div className={`ue-layout ${layoutClass}`}>
        {/* CỘT TRÁI: MỤC LỤC TƯ LIỆU */}
        {isTocOpen ? (
          <aside className="ue-toc-col hidden lg:block">
            <div className="ue-toc-card">
              <div className="ue-toc-header">
                <div className="flex items-center gap-2">
                  <BookOpen size={15} className="text-[#8C2D19]" />
                  <span>MỤC LỤC TƯ LIỆU</span>
                  <button
                    type="button"
                    onClick={toggleToc}
                    className="ue-sidebar-collapse-btn"
                    title="Thu gọn mục lục"
                  >
                    <PanelLeftClose size={14} />
                  </button>
                </div>
                <strong className="ue-toc-percent">{readProgress}%</strong>
              </div>

              <nav className="ue-toc-list">
                {model.toc.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => scrollToHeading(item.id)}
                    className={`ue-toc-link ${item.level === 3 ? 'level-3' : ''} ${
                      activeId === item.id ? 'active' : ''
                    }`}
                  >
                    {item.text}
                  </button>
                ))}

                {model.statements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => scrollToHeading('mang-luoi-tri-thuc')}
                    className={`ue-toc-link ${
                      activeId === 'mang-luoi-tri-thuc' ? 'active' : ''
                    }`}
                  >
                    Mạng lưới Tri thức
                  </button>
                )}
              </nav>

              <div className="ue-toc-footer">
                <BookOpen size={14} />
                <span>Ước tính {model.readMinutes} phút khảo cứu</span>
              </div>
            </div>
          </aside>
        ) : !isFocusMode ? (
          <aside className="ue-dock-col hidden lg:block">
            <button
              type="button"
              onClick={toggleToc}
              className="ue-dock-tab ue-dock-left"
              title="Mở lại Mục lục tư liệu"
            >
              <PanelLeftOpen size={16} />
              <span className="ue-dock-text">MỤC LỤC</span>
            </button>
          </aside>
        ) : null}

        {/* CỘT GIỮA: BÀI ĐỌC CHÍNH */}
        <main className={`ue-article-col ue-text-size-${textSize}`}>
          {model.html ? (
            <div
              className="ue-bio-blocks ue-article-content"
              dangerouslySetInnerHTML={{ __html: model.html }}
            />
          ) : (
            <div className="ue-bio-blocks ue-article-content">
              <p>{model.description || 'Đang cập nhật hồ sơ chi tiết...'}</p>
            </div>
          )}

          {model.resourceLinks.length > 0 && (
            <div className="ue-resource-links">
              <h2>Sử liệu & liên kết tham khảo</h2>
              <div className="ue-resource-links-grid">
                {model.resourceLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="ue-resource-link-card"
                  >
                    <span className="ue-resource-link-title">
                      {link.title} <ExternalLink size={14} />
                    </span>
                    {link.note && <p>{link.note}</p>}
                  </a>
                ))}
              </div>
            </div>
          )}

          <EntityKnowledgeGraph statements={model.statements} />

          {/* ĐIỀU HƯỚNG LIÊN HOÀN CUỐI BÀI */}
          {(model.previous || model.next) && (
            <div className="ue-bottom-nav">
              {model.previous ? (
                <Link href={model.previous.href} className="ue-bottom-btn prev">
                  <ChevronLeft size={20} />
                  <div>
                    <span className="ue-bottom-sub">Triều đại trước</span>
                    <strong className="ue-bottom-title">{model.previous.name}</strong>
                    {model.previous.dateLabel && (
                      <span className="ue-bottom-date">{model.previous.dateLabel}</span>
                    )}
                  </div>
                </Link>
              ) : (
                <div />
              )}

              {model.next ? (
                <Link href={model.next.href} className="ue-bottom-btn next">
                  <div className="text-right">
                    <span className="ue-bottom-sub">Triều đại tiếp theo</span>
                    <strong className="ue-bottom-title">{model.next.name}</strong>
                    {model.next.dateLabel && (
                      <span className="ue-bottom-date">{model.next.dateLabel}</span>
                    )}
                  </div>
                  <ChevronRight size={20} />
                </Link>
              ) : (
                <div />
              )}
            </div>
          )}

          <DiscussionSection targetType="ARTICLE" targetId={model.id} />

          <div className="my-10 text-center text-stone-400 font-serif flex items-center justify-center gap-3">
            <span>✦</span>
            <small className="tracking-widest font-sans uppercase font-bold text-xs text-stone-500">
              {model.periodName ?? 'HISGO BẢO TÀNG SỐ'}
            </small>
            <span>✦</span>
          </div>
        </main>

        {/* CỘT PHẢI: TIẾN TRÌNH DÒNG THỜI GIAN */}
        {hasTimeline &&
          (isTimelineOpen ? (
            <aside className="ue-timeline-col hidden xl:block">
              <div className="ue-timeline-nav-card">
                <div className="ue-timeline-nav-header">
                  <div className="flex items-center gap-1.5 flex-1">
                    <Compass size={14} className="text-[#8C2D19]" />
                    <span>TIẾN TRÌNH LỊCH SỬ</span>
                  </div>
                  <button
                    type="button"
                    onClick={toggleTimeline}
                    className="ue-sidebar-collapse-btn"
                    title="Thu gọn tiến trình"
                  >
                    <PanelRightClose size={14} />
                  </button>
                </div>

                <div className="ue-timeline-track">
                  {/* 1. MỐC TRIỀU ĐẠI TRƯỚC */}
                  {model.previous && (
                    <Link
                      href={model.previous.href}
                      className="ue-track-step prev"
                      title={`Xem triều đại trước: ${model.previous.name}`}
                    >
                      <div className="ue-track-node prev">
                        <ArrowUp size={12} />
                      </div>
                      <div className="ue-track-info">
                        <span className="ue-track-tag">Triều đại trước</span>
                        <strong className="ue-track-name">{model.previous.name}</strong>
                        {model.previous.dateLabel && (
                          <span className="ue-track-date">{model.previous.dateLabel}</span>
                        )}
                      </div>
                    </Link>
                  )}

                  {/* ĐƯỜNG NỐI DÒNG THỜI GIAN */}
                  {model.previous && <div className="ue-track-line" />}

                  {/* 2. MỐC TRIỀU ĐẠI HIỆN TẠI (ACTIVE) */}
                  <div className="ue-track-step active">
                    <div className="ue-track-node active">
                      <span className="ue-track-pulse" />
                    </div>
                    <div className="ue-track-info">
                      <span className="ue-track-tag active">Đang khảo cứu</span>
                      <strong className="ue-track-name active">{model.name}</strong>
                      <span className="ue-track-date active">{model.dateLabel}</span>
                    </div>
                  </div>

                  {/* ĐƯỜNG NỐI DÒNG THỜI GIAN */}
                  {model.next && <div className="ue-track-line" />}

                  {/* 3. MỐC TRIỀU ĐẠI TIẾP THEO */}
                  {model.next && (
                    <Link
                      href={model.next.href}
                      className="ue-track-step next"
                      title={`Xem triều đại tiếp theo: ${model.next.name}`}
                    >
                      <div className="ue-track-node next">
                        <ArrowDown size={12} />
                      </div>
                      <div className="ue-track-info">
                        <span className="ue-track-tag">Triều đại sau</span>
                        <strong className="ue-track-name">{model.next.name}</strong>
                        {model.next.dateLabel && (
                          <span className="ue-track-date">{model.next.dateLabel}</span>
                        )}
                      </div>
                    </Link>
                  )}
                </div>
              </div>
            </aside>
          ) : !isFocusMode ? (
            <aside className="ue-dock-col hidden xl:block">
              <button
                type="button"
                onClick={toggleTimeline}
                className="ue-dock-tab ue-dock-right"
                title="Mở lại Tiến trình lịch sử"
              >
                <PanelRightOpen size={16} />
                <span className="ue-dock-text">TIẾN TRÌNH</span>
              </button>
            </aside>
          ) : null)}
      </div>

      {/* FIXED EDGE TABS KHI Ở CHẾ ĐỘ ĐỌC TOÀN CẢNH */}
      {isFocusMode && (
        <>
          <button
            type="button"
            onClick={toggleToc}
            className="ue-edge-dock-tab left"
            title="Mở lại Mục lục tư liệu"
          >
            <PanelLeftOpen size={16} />
            <span>MỤC LỤC</span>
          </button>

          {hasTimeline && (
            <button
              type="button"
              onClick={toggleTimeline}
              className="ue-edge-dock-tab right"
              title="Mở lại Tiến trình lịch sử"
            >
              <PanelRightOpen size={16} />
              <span>TIẾN TRÌNH</span>
            </button>
          )}
        </>
      )}
      {/* Sổ ghi chú cá nhân */}
      <NoteFloatingButton facade={noteFacade} />
      <NoteDrawer
        facade={noteFacade}
        targetTitle={model.name}
        targetType={NOTE_TARGET_TYPE.ARTICLE}
      />
    </div>
  );
};
