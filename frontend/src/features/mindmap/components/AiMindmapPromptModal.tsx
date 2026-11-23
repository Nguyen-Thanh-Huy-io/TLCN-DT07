'use client';

import React, { useState } from 'react';
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import {
  MindmapShortcutKey,
  MindmapStructure,
} from '../constants/mindmap.constants';
import {
  MindmapApiService,
  type GeneratedMindmapPreview,
  type MindmapGraph,
} from '../services/mindmap.service';

export interface AiMindmapApplyResult {
  title: string;
  periodLabel?: string;
  preview: GeneratedMindmapPreview;
}

/**
 * Hộp thoại AI nổi trực tiếp ngay trên trang MindmapCanvas:
 * Tự động gửi kèm ngữ cảnh đồ thị hiện có (`existingGraph`) và node đang chọn (`selectedNodeId`)
 * để khi người dùng đang vẽ dở mà bí ý tưởng thì AI đọc ngữ cảnh đã soạn và phát triển tiếp các nhánh mới!
 */
export function AiMindmapPromptModal({
  structure,
  existingGraph,
  selectedNodeId,
  onApply,
}: {
  structure: MindmapStructure;
  existingGraph?: MindmapGraph;
  selectedNodeId?: string | null;
  onApply: (result: AiMindmapApplyResult) => Promise<void> | void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [prompt, setPrompt] = useState('');

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasPrompt = prompt.trim().length > 0;

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (generating || !hasPrompt) return;
    setGenerating(true);
    setError(null);
    try {
      const preview = await MindmapApiService.generatePreview({
        prompt: prompt.trim(),
        structure,
        ...(existingGraph ? { existingGraph } : {}),
        ...(selectedNodeId ? { selectedNodeId } : {}),
      });
      await onApply({
        title: preview.title,
        periodLabel: preview.periodLabel,
        preview,
      });
      setPrompt('');
    } catch (err) {
      setError(
        extractErrorMessage(
          err,
          'Không thể phân tích nội dung để dựng sơ đồ tư duy.',
        ),
      );
    } finally {
      setGenerating(false);
    }
  };

  if (collapsed) {
    return (
      <div className="pointer-events-auto absolute bottom-5 left-1/2 z-30 -translate-x-1/2 print:hidden">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="inline-flex items-center gap-2 rounded-full border border-[#B8893F]/60 bg-white/95 px-5 py-2 text-xs font-bold text-slate-800 shadow-[0_8px_30px_rgba(122,31,36,0.18)] backdrop-blur-md transition hover:scale-105 cursor-pointer"
        >
          <Sparkles size={14} className="text-[#7A1F24]" />
          <span>Bạn muốn xây dựng Sơ đồ Lịch sử gì hôm nay?</span>
          <ChevronUp size={14} className="text-slate-500" />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 z-30 w-[calc(100%-110px)] max-w-4xl -translate-x-1/2 print:hidden">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 px-5 py-3.5 shadow-[0_12px_42px_rgba(15,23,42,0.14)] backdrop-blur-md">
        {/* Header gọn trên cùng */}
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Sparkles size={16} className="text-[#7A1F24]" />
            <h3 className="text-sm font-extrabold text-slate-800">
              Bạn muốn xây dựng{' '}
              <span className="bg-gradient-to-r from-[#7A1F24] via-[#B8893F] to-[#16357B] bg-clip-text font-[family-name:var(--font-heading)] italic text-transparent">
                Sơ đồ Lịch sử
              </span>{' '}
              gì hôm nay?
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Thu gọn hộp thoại AI"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <ChevronDown size={16} />
            </button>
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-800"
          >
            {error}
          </p>
        )}

        {/* Hộp nhập Prompt trải dài sạch sẽ */}
        <form onSubmit={(e) => void handleGenerate(e)}>
          <div className="rounded-xl bg-gradient-to-r from-[#7A1F24]/35 via-[#B8893F]/45 to-[#2563EB]/35 p-[1.5px] transition-all focus-within:from-[#7A1F24] focus-within:via-[#B8893F] focus-within:to-[#2563EB]">
            <div className="flex items-end gap-3 rounded-[10.5px] bg-white px-4 py-3">
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === MindmapShortcutKey.ENTER && !e.shiftKey) {
                    e.preventDefault();
                    void handleGenerate();
                  }
                }}
                maxLength={4000}
                placeholder="Mô tả ý tưởng mới hoặc yêu cầu AI phát triển tiếp từ sơ đồ / nhánh bạn đang soạn (Nhấn Enter để tạo ngay)…"
                className="w-full flex-1 resize-none bg-transparent text-xs sm:text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none"
              />

              <button
                type="submit"
                disabled={generating || !hasPrompt}
                aria-label="Gửi yêu cầu dựng sơ đồ"
                title="Nhấn Enter để tạo sơ đồ"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-r from-[#7A1F24] to-[#B8893F] text-white shadow-sm transition hover:brightness-110 disabled:opacity-35 cursor-pointer"
              >
                {generating ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <ArrowUp size={16} />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
