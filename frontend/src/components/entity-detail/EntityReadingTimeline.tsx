'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, PanelRightClose, PanelRightOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { EntityAdjacent } from './entity-reader-adapter';

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
