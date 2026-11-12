'use client';

import React from 'react';
import { BookOpen, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { LessonTocEntry } from '@/features/lessons/utils/lesson-toc.util';

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
