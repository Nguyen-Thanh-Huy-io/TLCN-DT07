'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { KeyboardKey } from '@/constants/enums';
import { CommunityApi } from '@/features/community/api';
import { ComposerTagsSection } from '@/features/community/components/QuickComposerParts';
import { extractErrorMessage } from '@/services/api';
import { UploadApiService } from '@/services/entities/upload.service';
import { PUBLIC_ROUTES } from '@/services/public/public-content.service';
import type { MindmapGraph } from '../services/mindmap.service';
import {
  exportMindmapToPngFile,
  type ExportedMindmapImage,
} from '../utils/mindmap-export-image.util';
import type { MindmapLayoutResult } from '../utils/mindmap-layout.strategy';
import type { MindmapTreeModel } from '../utils/mindmap-tree.util';

function collectInitialTags(graph: MindmapGraph): string[] {
  const unique = new Set<string>(['so-do-tu-duy']);
  for (const node of graph.nodes) {
    for (const tag of node.tags ?? []) {
      const clean = tag.trim().replace(/^#/, '');
      if (clean && unique.size < 6) unique.add(clean);
    }
  }
  return Array.from(unique);
}

export function ShareMindmapCommunityModal({
  isOpen,
  mindmapTitle,
  periodLabel,
  graph,
  tree,
  layout,
  onFlushSave,
  onClose,
}: {
  isOpen: boolean;
  mindmapTitle: string;
  periodLabel: string | null;
  graph: MindmapGraph;
  tree: MindmapTreeModel;
  layout: MindmapLayoutResult;
  onFlushSave: () => Promise<void>;
  onClose: () => void;
}) {
  const router = useRouter();
  const cleanTitle = mindmapTitle.trim() || 'Sơ đồ tư duy Lịch sử';
  const defaultTags = useMemo(() => collectInitialTags(graph), [graph]);

  const [exported, setExported] = useState<ExportedMindmapImage | null>(null);
  const [rendering, setRendering] = useState(true);
  const [postTitle, setPostTitle] = useState(`Sơ đồ tư duy: ${cleanTitle}`);
  const [content, setContent] = useState(
    `Mình chia sẻ hình ảnh sơ đồ tư duy "${cleanTitle}" (${graph.nodes.length} nhánh kiến thức) vừa tổng hợp trên HISGO Mindmap Studio. Mời mọi người xem và góp ý thêm nhé!`,
  );
  const [imageCaption, setImageCaption] = useState(
    `Sơ đồ tư duy "${cleanTitle}" — trích xuất từ HISGO Mindmap Studio`,
  );
  const [period, setPeriod] = useState(periodLabel ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(defaultTags);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [sharedSuccess, setSharedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    let active = true;
    let createdUrl: string | null = null;

    void exportMindmapToPngFile({
      title: cleanTitle,
      periodLabel,
      graph,
      tree,
      layout,
    })
      .then((res) => {
        createdUrl = res.previewUrl;
        if (!active) {
          URL.revokeObjectURL(res.previewUrl);
          return;
        }
        setExported(res);
      })
      .catch((err) => {
        if (active) {
          setErrorMsg(extractErrorMessage(err, 'Không thể trích xuất hình ảnh từ sơ đồ hiện tại.'));
        }
      })
      .finally(() => {
        if (active) setRendering(false);
      });

    return () => {
      active = false;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [cleanTitle, graph, isOpen, layout, periodLabel, tree]);

  if (!isOpen) return null;

  const handleAddTags = () => {
    const parts = tagInput
      .split(/[,]+/)
      .map((s) => s.trim().replace(/^#/, ''))
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...tags];
    for (const part of parts) {
      if (!next.some((t) => t.toLowerCase() === part.toLowerCase())) {
        next.push(part);
      }
    }
    setTags(next.slice(0, 6));
    setTagInput('');
  };

  const handleDownloadPng = () => {
    if (!exported) return;
    const link = document.createElement('a');
    link.href = exported.previewUrl;
    link.download = exported.file.name;
    link.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || rendering || !exported) return;

    const finalTitle = postTitle.trim();
    const finalContent = content.trim();
    if (!finalTitle || !finalContent) {
      setErrorMsg('Vui lòng nhập tiêu đề bài đăng và lời giới thiệu.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onFlushSave();
      const uploaded = await UploadApiService.uploadImage(exported.file);
      if (!uploaded?.url) {
        throw new Error('Không nhận được đường dẫn ảnh sau khi tải lên.');
      }

      const pendingTag = tagInput.trim().replace(/^#/, '');
      const finalTags = pendingTag
        ? Array.from(new Set([...tags, pendingTag])).slice(0, 6)
        : tags;

      await CommunityApi.createQuickPost({
        title: finalTitle,
        content: finalContent,
        period: period.trim() || undefined,
        tags: finalTags,
        imageUrl: uploaded.url,
        imageCaption: imageCaption.trim() || `Sơ đồ tư duy: ${cleanTitle}`,
      });
      setSharedSuccess(true);
    } catch (err) {
      setErrorMsg(extractErrorMessage(err, 'Không thể đăng ảnh sơ đồ lên Cộng đồng lúc này.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoToCommunity = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
    onClose();
    router.push(PUBLIC_ROUTES.COMMUNITY);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-mindmap-modal-title"
      onKeyDown={(e) => {
        if (e.key === KeyboardKey.ESCAPE && !submitting) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1730]/60 p-4 backdrop-blur-xs print:hidden"
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E2D5B8] bg-[#FAF5E6] text-[#14233F] shadow-2xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#E5DAC4] px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#7A1F24] text-[#FAF5E6]">
              <Share2 size={18} />
            </div>
            <div>
              <h2 id="share-mindmap-modal-title" className="text-lg font-bold text-[#14233F]">
                Chia sẻ ảnh Sơ đồ tư duy lên Cộng đồng
              </h2>
              <p className="mt-0.5 text-xs text-[#6E5D4B]">
                Hệ thống tự động trích xuất sơ đồ hiện tại thành ảnh PNG sắc nét để đính kèm bài thảo luận.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại chia sẻ"
            className="grid size-8 place-items-center rounded-lg border border-[#E2D5B8] bg-[#FDF9F0] text-[#4A3F33] hover:border-[#14233F] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Thân modal cuộn độc lập để giữ header & footer luôn hiển thị trọn vẹn */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
        {/* Ảnh PNG đã trích xuất từ Canvas */}
        <div className="overflow-hidden rounded-xl border border-[#D8C8AA] bg-[#FDF9F0]">
          <div className="flex items-center justify-between border-b border-[#E5DAC4] bg-[#F2E8D5] px-3.5 py-2 text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold text-[#14233F]">
              <ImageIcon size={13} className="text-[#7A1F24]" />
              <span>Ảnh trích xuất từ Canvas</span>
              {exported && (
                <span className="font-normal text-[#6E5D4B]">
                  ({exported.width} × {exported.height} px · PNG)
                </span>
              )}
            </span>
            {exported && (
              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex items-center gap-1 rounded-md border border-[#D4C5A6] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#14233F] hover:border-[#8A5A19] cursor-pointer"
              >
                <Download size={12} />
                <span>Tải ảnh về</span>
              </button>
            )}
          </div>

          <div className="flex max-h-60 min-h-40 items-center justify-center overflow-hidden p-2">
            {rendering ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-[#6E5D4B]">
                <Loader2 size={16} className="animate-spin text-[#7A1F24]" />
                <span>Đang trích xuất ảnh từ sơ đồ…</span>
              </div>
            ) : exported ? (
              <Image
                src={exported.previewUrl}
                alt={`Ảnh sơ đồ tư duy ${cleanTitle}`}
                width={exported.width}
                height={exported.height}
                unoptimized
                className="h-auto max-h-56 w-auto rounded-lg object-contain shadow-xs"
              />
            ) : (
              <span className="text-xs text-rose-700">Không tạo được ảnh xem trước.</span>
            )}
          </div>
        </div>

        {sharedSuccess ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <CheckCircle2 size={34} className="mx-auto text-emerald-600" />
            <h3 className="mt-2.5 text-base font-bold text-emerald-950">
              Đã đăng ảnh sơ đồ lên Cộng đồng HISGO!
            </h3>
            <p className="mt-1 text-xs text-emerald-800">
              Hình ảnh sơ đồ tư duy đã được tải lên và gắn kèm bài thảo luận mới của bạn.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#D4C5A6] bg-white px-4 py-2 text-xs font-semibold text-[#4A3F33] hover:bg-[#F5EEDC] cursor-pointer"
              >
                Tiếp tục chỉnh sửa sơ đồ
              </button>
              <button
                type="button"
                onClick={() => void handleGoToCommunity()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#7A1F24] px-4 py-2 text-xs font-bold text-[#FAF5E6] hover:brightness-110 cursor-pointer"
              >
                <span>Xem trên Cộng đồng</span>
                <ExternalLink size={13} />
              </button>
            </div>
          </div>
        ) : (
          <form id="share-mindmap-form" onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3.5">
            <div>
              <label htmlFor="sm-post-title" className="mb-1.5 block text-xs font-bold text-[#14233F]">
                Tiêu đề bài đăng
              </label>
              <input
                id="sm-post-title"
                type="text"
                maxLength={220}
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-sm text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            <div>
              <label htmlFor="sm-post-content" className="mb-1.5 block text-xs font-bold text-[#14233F]">
                Nội dung chia sẻ / Câu hỏi thảo luận
              </label>
              <textarea
                id="sm-post-content"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full resize-none rounded-lg border border-[#D4C5A6] bg-[#FDF9F0] p-3 text-sm leading-relaxed text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            <div>
              <label htmlFor="sm-image-caption" className="mb-1.5 block text-xs font-bold text-[#14233F]">
                Chú thích dưới ảnh (tuỳ chọn)
              </label>
              <input
                id="sm-image-caption"
                type="text"
                maxLength={200}
                value={imageCaption}
                onChange={(e) => setImageCaption(e.target.value)}
                className="h-9 w-full rounded-lg border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-xs text-[#14233F] outline-none focus:border-[#8A5A19]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="sm-post-period" className="mb-1.5 block text-xs font-bold text-[#14233F]">
                  Thời kỳ / Triều đại (tuỳ chọn)
                </label>
                <input
                  id="sm-post-period"
                  type="text"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ví dụ: Thời Trần (1225–1400)"
                  className="h-10 w-full rounded-lg border border-[#D4C5A6] bg-[#FDF9F0] px-3 text-sm text-[#14233F] outline-none focus:border-[#8A5A19]"
                />
              </div>

              <ComposerTagsSection
                tagInput={tagInput}
                onChangeTagInput={setTagInput}
                onAddTag={handleAddTags}
                tags={tags}
                onRemoveTag={(t) => setTags((prev) => prev.filter((item) => item !== t))}
              />
            </div>

            <div className="flex items-start gap-2 rounded-lg border border-[#E2D5B8] bg-[#F2E8D5] px-3 py-2 text-[11.5px] text-[#4A3F33]">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#1E4620]" />
              <span>
                Chỉ ảnh PNG trích xuất từ sơ đồ được đăng lên bảng tin Cộng đồng — bản gốc sơ đồ trong Studio của bạn vẫn hoàn toàn riêng tư.
              </span>
            </div>

            {errorMsg && (
              <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                {errorMsg}
              </div>
            )}
          </form>
        )}
        </div>

        {!sharedSuccess && (
          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#E5DAC4] bg-[#FAF5E6] px-6 py-3.5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="h-9 rounded-lg border border-[#D4C5A6] bg-[#FDF9F0] px-4 text-xs font-semibold text-[#4A3F33] hover:border-[#14233F] cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              form="share-mindmap-form"
              disabled={submitting || rendering || !exported}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7A1F24] px-5 text-xs font-bold text-[#FAF5E6] hover:bg-[#651A1E] disabled:opacity-60 cursor-pointer"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              <span>{submitting ? 'Đang tải ảnh & đăng…' : 'Chia sẻ lên Cộng đồng'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
