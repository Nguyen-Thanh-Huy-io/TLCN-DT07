'use client';

import React from 'react';

interface BlogHistoricalMetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: string;
  setPeriod: (val: string) => void;
  events: string;
  setEvents: (val: string) => void;
  characters: string;
  setCharacters: (val: string) => void;
  locations: string;
  setLocations: (val: string) => void;
  entities: string;
  setEntities: (val: string) => void;
  historicalContext: string;
  setHistoricalContext: (val: string) => void;
}

export function BlogHistoricalMetaModal({
  isOpen,
  onClose,
  period,
  setPeriod,
  events,
  setEvents,
  characters,
  setCharacters,
  locations,
  setLocations,
  entities,
  setEntities,
  historicalContext,
  setHistoricalContext,
}: BlogHistoricalMetaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,17,15,0.48)] px-4 py-8 backdrop-blur-[2px]">
      <div className="w-full max-w-2xl rounded-[28px] border border-[var(--border)] bg-[var(--bg-page)] p-5 shadow-[0_25px_60px_rgba(20,35,63,0.18)] md:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">Thông tin lịch sử</p>
            <h3 className="mt-2 font-[family-name:var(--font-heading)] text-2xl text-[var(--ink)]">Tùy chọn bổ sung</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
          >
            Đóng
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label htmlFor="period" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Thời kỳ
            </label>
            <input
              id="period"
              type="text"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="Ví dụ: Đế quốc La Mã, Nhà Trần"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="events" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Sự kiện liên quan
            </label>
            <input
              id="events"
              type="text"
              value={events}
              onChange={(event) => setEvents(event.target.value)}
              placeholder="Các sự kiện, cách nhau bằng dấu phẩy"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="characters" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Nhân vật / đối tượng
            </label>
            <input
              id="characters"
              type="text"
              value={characters}
              onChange={(event) => setCharacters(event.target.value)}
              placeholder="Ví dụ: Trần Hưng Đạo, người dân, chiến sĩ"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="locations" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Địa danh
            </label>
            <input
              id="locations"
              type="text"
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              placeholder="Ví dụ: Thăng Long, Bạch Đằng"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="entities" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Thực thể liên quan
            </label>
            <input
              id="entities"
              type="text"
              value={entities}
              onChange={(event) => setEntities(event.target.value)}
              placeholder="Ví dụ: triều đại, di tích, thành phố"
              className="w-full rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>

          <div>
            <label htmlFor="historical-context" className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Bối cảnh lịch sử
            </label>
            <textarea
              id="historical-context"
              value={historicalContext}
              onChange={(event) => setHistoricalContext(event.target.value)}
              rows={4}
              placeholder="Mô tả ngắn bối cảnh chính trị, văn hóa, đời sống."
              className="w-full resize-none rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2.5 text-base leading-7 text-[var(--ink)] outline-none transition-colors focus:border-[var(--gold)]"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius-btn)] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--ink)] transition-colors hover:border-[var(--gold)]"
          >
            Lưu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
