'use client';
import React, { useEffect, useState } from 'react';
import { AutoSaveState } from '../types/editor.types';

interface AutoSaveVisual {
  label: string;
  dotClass: string;
  textClass: string;
  pulse?: boolean;
  tooltip: string;
}

/**
 * Bảng ánh xạ trạng thái → giao diện (OCP: thêm trạng thái mới chỉ cần thêm 1 dòng)
 */
const AUTO_SAVE_VISUAL_MAP: Record<AutoSaveState, AutoSaveVisual> = {
  [AutoSaveState.IDLE]: {
    label: 'Chưa có thay đổi',
    dotClass: 'bg-slate-300',
    textClass: 'text-slate-400',
    tooltip: 'Bản nháp sẽ tự động lưu trên trình duyệt khi bạn bắt đầu soạn thảo',
  },
  [AutoSaveState.PENDING]: {
    label: 'Đang lưu nháp…',
    dotClass: 'bg-amber-400',
    textClass: 'text-amber-700',
    pulse: true,
    tooltip: 'Đang chờ bạn ngừng gõ để lưu bản nháp',
  },
  [AutoSaveState.SAVED]: {
    label: 'Đã lưu nháp',
    dotClass: 'bg-emerald-500',
    textClass: 'text-emerald-700',
    tooltip: 'Bản nháp được lưu an toàn trên trình duyệt này (chưa gửi lên máy chủ)',
  },
  [AutoSaveState.ERROR]: {
    label: 'Không lưu được nháp',
    dotClass: 'bg-rose-500',
    textClass: 'text-rose-700',
    tooltip: 'Bộ nhớ trình duyệt đầy hoặc bị chặn. Hãy bấm "Lưu nháp" để lưu lên máy chủ',
  },
  [AutoSaveState.SYNCING]: {
    label: 'Đang lưu lên máy chủ…',
    dotClass: 'bg-blue-500',
    textClass: 'text-blue-700',
    pulse: true,
    tooltip: 'Đang gửi bài học lên máy chủ',
  },
};

const RELATIVE_TIME_REFRESH_MS = 30_000;

function formatRelative(date: Date, now: number): string {
  const diffSec = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (diffSec < 10) return 'vừa xong';
  if (diffSec < 60) return `${diffSec} giây trước`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export interface AutoSaveIndicatorProps {
  state: AutoSaveState;
  lastSavedAt: Date | null;
}

export function AutoSaveIndicator({ state, lastSavedAt }: AutoSaveIndicatorProps) {
  const [now, setNow] = useState(() => Date.now());

  // Cập nhật "x phút trước" định kỳ
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), RELATIVE_TIME_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setNow(Date.now());
  }, [lastSavedAt]);

  const visual = AUTO_SAVE_VISUAL_MAP[state];
  const showTime = state === AutoSaveState.SAVED && lastSavedAt;

  return (
    <div
      className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-slate-50 border border-slate-200 whitespace-nowrap"
      title={
        lastSavedAt
          ? `${visual.tooltip}\nLần lưu gần nhất: ${lastSavedAt.toLocaleTimeString('vi-VN')}`
          : visual.tooltip
      }
      aria-live="polite"
    >
      <span className="relative flex w-2 h-2">
        {visual.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${visual.dotClass}`} />
        )}
        <span className={`relative inline-flex w-2 h-2 rounded-full ${visual.dotClass}`} />
      </span>
      <span className={`font-medium ${visual.textClass}`}>{visual.label}</span>
      {showTime && <span className="text-slate-400">· {formatRelative(lastSavedAt, now)}</span>}
    </div>
  );
}
