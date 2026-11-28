'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { extractErrorMessage } from '@/services/api';
import {
  MindmapShortcutKey,
  MindmapStructure,
} from '../constants/mindmap.constants';
import {
  MindmapApiService,
  MindmapDetailLevel,
  type GeneratedMindmapPreview,
  type MindmapGraph,
} from '../services/mindmap.service';

export interface AiMindmapApplyResult {
  title: string;
  periodLabel?: string;
  preview: GeneratedMindmapPreview;
}

const STRUCTURE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'AUTO', label: 'Tự động nhận diện cấu trúc' },
  { value: MindmapStructure.MIND_MAP, label: 'Sơ đồ tư duy' },
  { value: MindmapStructure.FISHBONE, label: 'Sơ đồ xương cá' },
  { value: MindmapStructure.TIMELINE, label: 'Dòng thời gian' },
  { value: MindmapStructure.ORG_CHART, label: 'Sơ đồ tổ chức' },
  { value: MindmapStructure.LOGIC_CHART, label: 'Cây logic ngang' },
];

const SUGGESTION_CHIPS: Record<string, string[]> = {
  AUTO: [
    'Khởi nghĩa Lam Sơn',
    'Chiến dịch Điện Biên Phủ',
    'Văn minh Đại Việt',
  ],
  [MindmapStructure.FISHBONE]: [
    'Nguyên nhân thắng lợi Cách mạng tháng Tám',
    'Nguyên nhân sụp đổ Nhà Hồ',
    'Nguyên nhân bùng nổ CTTG thứ nhất',
  ],
  [MindmapStructure.TIMELINE]: [
    'Kháng chiến chống Mỹ (1954 - 1975)',
    'Chiến dịch Hồ Chí Minh 1975',
    'Các mốc thời gian Bắc thuộc',
  ],
  [MindmapStructure.ORG_CHART]: [
    'Bộ máy chính quyền thời Lê Thánh Tông',
    'Cơ cấu triều đình thời Trần',
    'Chính quyền Đàng Trong thời chúa Nguyễn',
  ],
  [MindmapStructure.LOGIC_CHART]: [
    'Chiến dịch Việt Bắc 1947',
    'Kế hoạch quân sự Nava 1953',
    'Phong trào Cần Vương',
  ],
  [MindmapStructure.MIND_MAP]: [
    'Tổng quan triều đại Tây Sơn',
    'Văn minh Văn Lang - Âu Lạc',
    'Khai phá phương Nam thế kỷ XVI - XVIII',
  ],
};

/**
 * AI Sử Gia Copilot gọn nhẹ (2 trạng thái: Mặc định tập trung nhập prompt / Cấu hình nâng cao ẩn):
 * - Thu gọn mặc định để Canvas là trung tâm.
 * - Đồng bộ đóng/mở luân phiên với Sidebar bên phải qua props `open` / `onOpenChange`.
 */
export function AiMindmapPromptModal({
  open,
  onOpenChange,
  structure,
  existingGraph,
  selectedNodeId,
  onApply,
}: {
  open?: boolean;
  onOpenChange?: (nextOpen: boolean) => void;
  structure: MindmapStructure;
  existingGraph?: MindmapGraph;
  selectedNodeId?: string | null;
  onApply: (result: AiMindmapApplyResult) => Promise<void> | void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  };

  const [prompt, setPrompt] = useState('');
  const [useGoogleSearch, setUseGoogleSearch] = useState(false);
  const [autoDetectStructure, setAutoDetectStructure] = useState(true);
  const [overrideStructure, setOverrideStructure] = useState<MindmapStructure>(structure);
  const [detailLevel, setDetailLevel] = useState<MindmapDetailLevel>(
    MindmapDetailLevel.DETAILED,
  );
  const [includeNotes, setIncludeNotes] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const focusedNode = useMemo(() => {
    if (!selectedNodeId || !existingGraph?.nodes) return null;
    return existingGraph.nodes.find((n) => n.id === selectedNodeId) ?? null;
  }, [existingGraph, selectedNodeId]);

  const activeChips = useMemo(() => {
    const list = autoDetectStructure
      ? SUGGESTION_CHIPS.AUTO
      : (SUGGESTION_CHIPS[overrideStructure] ?? SUGGESTION_CHIPS.AUTO);
    return list.slice(0, 3);
  }, [autoDetectStructure, overrideStructure]);

  const hasPrompt = prompt.trim().length > 0;
  const hasCustomConfig = useGoogleSearch || includeNotes || !autoDetectStructure || detailLevel === MindmapDetailLevel.CONCISE;

  const handleGenerate = async (customPrompt?: string) => {
    const textToRun = (customPrompt ?? prompt).trim();
    if (generating || !textToRun) return;

    setGenerating(true);
    setError(null);
    try {
      const preview = await MindmapApiService.generatePreview({
        prompt: textToRun,
        structure: autoDetectStructure ? undefined : overrideStructure,
        autoDetectStructure,
        useGoogleSearch,
        detailLevel,
        includeNotes,
        ...(existingGraph ? { existingGraph } : {}),
        ...(selectedNodeId ? { selectedNodeId } : {}),
      });

      await onApply({
        title: preview.title,
        periodLabel: preview.periodLabel,
        preview,
      });

      if (!customPrompt) {
        setPrompt('');
      }
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

  if (!isOpen) {
    return (
      <div className="pointer-events-auto absolute bottom-4 left-1/2 z-30 -translate-x-1/2 print:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-4 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur-md transition hover:border-[#B8893F] hover:text-[#7A1F24] cursor-pointer"
        >
          <Sparkles size={14} className="shrink-0 text-[#7A1F24]" />
          <span>AI Sử Gia Copilot</span>
          <ChevronUp size={14} className="shrink-0 text-slate-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-3 left-14 right-3 z-30 max-w-2xl sm:bottom-4 sm:left-1/2 sm:right-auto sm:w-[calc(100%-120px)] sm:-translate-x-1/2 print:hidden">
      <div className="rounded-2xl border border-slate-200/90 bg-white/95 px-3.5 py-3 shadow-lg backdrop-blur-md sm:px-4">
        {/* Header gọn 1 dòng */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-[#7A1F24] text-white">
              <Sparkles size={12} />
            </span>
            <h3 className="truncate text-xs font-bold text-slate-800 sm:text-[13px]">
              AI Sử Gia Copilot
            </h3>
            {useGoogleSearch && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                <Globe size={10} /> Google ON
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSettings((s) => !s)}
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition cursor-pointer ${
                showSettings || hasCustomConfig
                  ? 'bg-amber-50 text-amber-900 border border-amber-200'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
              }`}
            >
              <Settings2 size={13} />
              <span>Cấu hình AI</span>
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              title="Thu gọn AI Copilot"
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            >
              <ChevronDown size={15} />
            </button>
          </div>
        </div>

        {/* Ngữ cảnh node đang chọn (1 dòng mỏng) */}
        {focusedNode && (
          <div className="mb-2 truncate rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 border border-slate-200/70">
            Đang mở rộng nhánh: <strong className="text-slate-900">{focusedNode.title}</strong>
          </div>
        )}

        {/* Bảng Cấu hình AI nâng cao (Ẩn mặc định) */}
        {showSettings && (
          <div className="mb-2.5 space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-800">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Kiểu cấu trúc sơ đồ
                </label>
                <select
                  value={autoDetectStructure ? 'AUTO' : overrideStructure}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'AUTO') {
                      setAutoDetectStructure(true);
                    } else {
                      setAutoDetectStructure(false);
                      setOverrideStructure(val as MindmapStructure);
                    }
                  }}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-800 outline-none focus:border-[#7A1F24] cursor-pointer"
                >
                  {STRUCTURE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Mức độ chi tiết
                </label>
                <div className="flex h-8 gap-1 rounded-lg bg-slate-200/70 p-0.5">
                  <button
                    type="button"
                    onClick={() => setDetailLevel(MindmapDetailLevel.CONCISE)}
                    className={`flex-1 rounded-md text-xs transition cursor-pointer ${
                      detailLevel === MindmapDetailLevel.CONCISE
                        ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tóm lược
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailLevel(MindmapDetailLevel.DETAILED)}
                    className={`flex-1 rounded-md text-xs transition cursor-pointer ${
                      detailLevel === MindmapDetailLevel.DETAILED
                        ? 'bg-white font-semibold text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Toàn diện
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setUseGoogleSearch((v) => !v)}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition hover:border-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                  <Globe size={13} className="text-blue-600" />
                  Google Search thời gian thực
                </span>
                <span
                  className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                    useGoogleSearch ? 'bg-[#7A1F24]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block size-3 transform rounded-full bg-white transition-transform ${
                      useGoogleSearch ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIncludeNotes((v) => !v)}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left transition hover:border-slate-300 cursor-pointer"
              >
                <span className="flex items-center gap-2 text-[11px] font-medium text-slate-700">
                  <BookOpen size={13} className="text-amber-600" />
                  Đính kèm sổ tay & ghi chú
                </span>
                <span
                  className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                    includeNotes ? 'bg-[#7A1F24]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block size-3 transform rounded-full bg-white transition-transform ${
                      includeNotes ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs text-rose-800"
          >
            {error}
          </p>
        )}

        {/* Ô nhập Prompt — thành phần trung tâm */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void handleGenerate();
          }}
        >
          <div className="flex items-end gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 transition focus-within:border-[#7A1F24] focus-within:ring-2 focus-within:ring-[#7A1F24]/15">
            <textarea
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === MindmapShortcutKey.ENTER && !e.shiftKey) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
              maxLength={4000}
              placeholder={
                focusedNode
                  ? `Yêu cầu AI phân tích sâu hơn hoặc bổ sung nhánh con cho "${focusedNode.title}"…`
                  : 'Nhập chủ đề lịch sử bạn muốn AI dựng sơ đồ…'
              }
              className="max-h-24 w-full flex-1 resize-none overflow-y-auto bg-transparent text-xs sm:text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 outline-none"
            />

            <button
              type="submit"
              disabled={generating || !hasPrompt}
              aria-label="Gửi yêu cầu dựng sơ đồ"
              title="Nhấn Enter để gửi"
              className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#7A1F24] text-white transition hover:bg-[#5E161A] disabled:opacity-35 cursor-pointer"
            >
              {generating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ArrowUp size={15} />
              )}
            </button>
          </div>
        </form>

        {/* Gợi ý nhanh: tối đa 3 gợi ý, tự xuống dòng, không scrollbar ngang */}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-medium text-slate-400">Gợi ý:</span>
          {activeChips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={generating}
              onClick={() => {
                setPrompt(chip);
                void handleGenerate(chip);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-medium text-slate-600 transition hover:border-[#B8893F] hover:bg-[#FAF5E6] hover:text-[#7A1F24] cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
