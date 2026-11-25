'use client';

import React from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  FileText,
  History,
  Link2,
  Paperclip,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { ContentStatus, DifficultyLevel } from '@/constants/enums';
import { TagItem } from '@/types/models';
import { Badge } from '@/components/common/CommonUi';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { TopicCoverImagePicker } from '@/features/topics/components/TopicCoverImagePicker';
import { LessonHeaderMetaData, LessonMediaItem } from '../types/editor.types';
import { ResourceLinkBlockData } from '../types/block-builder.types';
import { LessonDifficultySelector, LessonHeaderMetaForm } from './LessonEditorHeader';
import { LessonTagPicker } from './LessonTagPicker';
import { LessonMediaManager } from './LessonMediaManager';

export interface LessonInfoProfileTabProps {
  lessonId: string | null;
  status: ContentStatus;
  saving: boolean;
  assigneeName: string;
  assigneeRoleLabel: string;
  lastSavedTime: string | null;

  // Thông tin cơ bản
  headerMeta: LessonHeaderMetaData;
  topics: Array<{ id: string; name: string }>;
  onHeaderMetaChange: <K extends keyof LessonHeaderMetaData>(
    field: K,
    val: LessonHeaderMetaData[K]
  ) => void;

  // Hồ sơ phân loại
  currentTopicName?: string;
  hasTopic: boolean;
  onOpenTopicPicker: () => void;
  thumbnailUrl: string;
  onThumbnailChange: (url: string) => void;
  difficulty: DifficultyLevel;
  setDifficulty: (val: DifficultyLevel) => void;
  selectedTags: TagItem[];
  setSelectedTags: (tags: TagItem[]) => void;
  displayOrder: number;
  setDisplayOrder: (val: number) => void;

  // Tài liệu & Nguồn tham khảo
  mediaList: LessonMediaItem[];
  onAddMedia: (item: LessonMediaItem) => void;
  onRemoveMedia: (index: number) => void;
  sourceReferenceNote: string;
  setSourceReferenceNote: (val: string) => void;
  resourceLinks: ResourceLinkBlockData[];
  onAddResourceLink: () => void;
  onUpdateResourceLink: (id: string, updates: Partial<ResourceLinkBlockData>) => void;
  onRemoveResourceLink: (id: string) => void;

  // Thống kê & Điều hướng
  wordCount: number;
  estimatedReadMinutes: number;
  blockCount: number;
  onSwitchToCms: () => void;
  onOpenHistory: () => void;
}

interface ChecklistItem {
  key: string;
  label: string;
  passed: boolean;
}

function buildSubmissionChecklist(
  title: string,
  hasTopic: boolean,
  blockCount: number
): ChecklistItem[] {
  return [
    { key: 'title', label: 'Có tiêu đề bài học', passed: Boolean(title.trim()) },
    { key: 'topic', label: 'Đã chọn Chủ đề chính', passed: hasTopic },
    { key: 'blocks', label: `Có ít nhất 1 khối nội dung (hiện có ${blockCount})`, passed: blockCount > 0 },
  ];
}

/**
 * Tab 1 — Thông tin bài học.
 * Bố cục 2 cột cân đối: trái là nội dung hồ sơ & quản lý nhiều nguồn tư liệu;
 * phải là phân loại, điều kiện gửi duyệt, người phụ trách và lịch sử chỉnh sửa.
 */
export function LessonInfoProfileTab({
  lessonId,
  status,
  saving,
  assigneeName,
  assigneeRoleLabel,
  lastSavedTime,
  headerMeta,
  topics,
  onHeaderMetaChange,
  currentTopicName,
  hasTopic,
  onOpenTopicPicker,
  thumbnailUrl,
  onThumbnailChange,
  difficulty,
  setDifficulty,
  selectedTags,
  setSelectedTags,
  displayOrder,
  setDisplayOrder,
  mediaList,
  onAddMedia,
  onRemoveMedia,
  sourceReferenceNote,
  setSourceReferenceNote,
  resourceLinks,
  onAddResourceLink,
  onUpdateResourceLink,
  onRemoveResourceLink,
  wordCount,
  estimatedReadMinutes,
  blockCount,
  onSwitchToCms,
  onOpenHistory,
}: LessonInfoProfileTabProps) {
  const checklist = buildSubmissionChecklist(headerMeta.title, hasTopic, blockCount);
  const allReady = checklist.every((item) => item.passed);

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-start animate-in fade-in-50 duration-150">
      {/* CỘT TRÁI (7/12): Thông tin cơ bản, Nguồn tư liệu (nhiều mục) & Tài liệu đính kèm */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        {/* 1. Thông tin cơ bản */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center shrink-0">
              <FileText size={16} />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Thông tin bài học</h2>
              <p className="text-[13px] text-slate-500">Tiêu đề biên tập và tóm tắt hiển thị ở danh mục tìm kiếm</p>
            </div>
          </div>

          <LessonHeaderMetaForm
            data={headerMeta}
            topics={topics}
            onChange={onHeaderMetaChange}
            disabled={saving}
          />
        </section>

        {/* 2. Nguồn tư liệu & Quản lý nhiều tài liệu tham khảo */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/70 text-blue-700 flex items-center justify-center shrink-0">
                <BookOpen size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Nguồn tư liệu &amp; Tài liệu tham khảo</h2>
                <p className="text-xs text-slate-500">Quản lý ghi chú trích dẫn và nhiều liên kết tham khảo cuối bài</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              {resourceLinks.length} nguồn
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Ghi chú nguồn tư liệu chính
            </label>
            <textarea
              rows={2}
              value={sourceReferenceNote}
              onChange={(e) => setSourceReferenceNote(e.target.value)}
              disabled={saving}
              placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư, Lịch sử Việt Nam tập 10..."
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>

          <div className="border-t border-slate-100 pt-4" data-testid="sidebar-resource-links">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Link2 size={14} className="text-blue-600" />
                  <span>Danh sách tài liệu tham khảo ({resourceLinks.length})</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Thêm nhiều sách, bài nghiên cứu hoặc đường dẫn tài liệu liên quan
                </p>
              </div>
              <button
                type="button"
                data-testid="btn-add-resource-link"
                onClick={onAddResourceLink}
                disabled={saving}
                className="text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg transition cursor-pointer shrink-0"
              >
                + Thêm tài liệu
              </button>
            </div>

            {resourceLinks.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
                Chưa có tài liệu tham khảo nào. Bấm &ldquo;+ Thêm tài liệu&rdquo; để bổ sung nhiều nguồn.
              </div>
            ) : (
              <div className="space-y-2.5">
                {resourceLinks.map((link, idx) => (
                  <div
                    key={link.id}
                    data-testid={`resource-link-item-${idx}`}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={link.title}
                        onChange={(e) => onUpdateResourceLink(link.id, { title: e.target.value })}
                        placeholder="Tên tài liệu / sách / bài viết..."
                        className="flex-1 min-w-0 text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveResourceLink(link.id)}
                        disabled={saving}
                        title="Xóa tài liệu này"
                        className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0 px-2 py-1 rounded-md hover:bg-rose-50"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                      <input
                        type="text"
                        value={link.url}
                        onChange={(e) => onUpdateResourceLink(link.id, { url: e.target.value })}
                        placeholder="Đường dẫn URL (https://...)..."
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                      />
                      <input
                        type="text"
                        value={link.note || ''}
                        onChange={(e) => onUpdateResourceLink(link.id, { note: e.target.value })}
                        placeholder="Tác giả / Trang / Chú thích..."
                        className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white text-slate-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 3. Tài liệu & Tệp đính kèm */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center shrink-0">
                <Paperclip size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tài liệu &amp; Tệp đính kèm</h2>
                <p className="text-xs text-slate-500">Tài liệu PDF, tư liệu lịch sử hoặc ảnh minh họa cho bài học</p>
              </div>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
              {mediaList.length} tệp
            </span>
          </div>

          <LessonMediaManager
            mediaList={mediaList}
            onAddMedia={onAddMedia}
            onRemoveMedia={onRemoveMedia}
            disabled={saving}
          />
        </section>
      </div>

      {/* CỘT PHẢI (5/12): Phân loại, Kiểm duyệt & Lịch sử chỉnh sửa */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {/* Card 1: Hồ sơ phân loại & Hiển thị */}
        <section className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 shadow-2xs overflow-hidden">
          <div className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                <span>Chủ đề chính</span>
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold border border-blue-200/60">
                Bắt buộc
              </span>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {currentTopicName || 'Chưa gắn vào Chủ đề nào'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {currentTopicName
                    ? 'Gom nhóm bài học vào lộ trình học tập'
                    : 'Chọn chủ đề để hiển thị trên cây kiến thức'}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenTopicPicker}
                disabled={saving}
                className="shrink-0 text-xs font-bold text-blue-700 hover:text-blue-800 bg-white border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition shadow-2xs cursor-pointer"
              >
                {currentTopicName ? 'Đổi chủ đề' : 'Chọn chủ đề'}
              </button>
            </div>
          </div>

          <div className="p-4">
            <TopicCoverImagePicker
              value={thumbnailUrl}
              onChange={onThumbnailChange}
              disabled={saving}
              title="Ảnh đại diện bài học"
              compact
            />
          </div>

          <div className="p-4 space-y-2" data-testid="sidebar-tags-field">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Thẻ tìm kiếm
              </span>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {selectedTags.length} thẻ
              </span>
            </div>
            <LessonTagPicker
              selectedTags={selectedTags}
              onChange={setSelectedTags}
              disabled={saving}
              hideLabel
            />
          </div>

          <div className="p-4">
            <LessonDifficultySelector
              value={difficulty}
              onChange={setDifficulty}
              disabled={saving}
            />
          </div>

          <div className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Thứ tự hiển thị
              </span>
              <p className="text-[11px] text-slate-400">Vị trí bài học trong chương (1, 2, 3...)</p>
            </div>
            <input
              type="number"
              min={1}
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Math.max(1, parseInt(e.target.value, 10) || 1))}
              disabled={saving}
              className="w-20 text-center text-sm font-bold px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
            />
          </div>
        </section>

        {/* Card 2: Kiểm duyệt, Điều kiện gửi duyệt & Lịch sử chỉnh sửa */}
        <section className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-600 shrink-0" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Kiểm duyệt &amp; Phiên bản
              </h3>
            </div>
            <Badge tone={STATUS_TONE_MAP[status] || 'gray'}>
              {STATUS_LABEL_MAP[status] || status}
            </Badge>
          </div>

          {/* Người phụ trách */}
          <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck size={15} className="text-slate-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{assigneeName}</p>
                <p className="text-[11px] text-slate-500">
                  {assigneeRoleLabel} · Quy tắc duyệt 2 người
                </p>
              </div>
            </div>
          </div>

          {/* Điều kiện gửi duyệt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Điều kiện gửi duyệt</span>
              <span className={`font-semibold ${allReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                {allReady ? 'Đã sẵn sàng' : 'Cần bổ sung'}
              </span>
            </div>
            <ul className="space-y-1.5 text-xs">
              {checklist.map((item) => (
                <li
                  key={item.key}
                  className={`flex items-center gap-2 ${
                    item.passed ? 'text-slate-700' : 'text-slate-500'
                  }`}
                >
                  {item.passed ? (
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  ) : (
                    <Circle size={14} className="text-slate-300 shrink-0" />
                  )}
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lịch sử chỉnh sửa & Thống kê nội dung */}
          <div className="pt-3 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {wordCount.toLocaleString('vi-VN')} từ · ~{estimatedReadMinutes} phút đọc
              </span>
              <span>{lastSavedTime ? `Nháp: ${lastSavedTime}` : 'Chưa lưu nháp'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {lessonId ? (
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <History size={14} />
                  <span>Lịch sử chỉnh sửa</span>
                </button>
              ) : (
                <span className="flex-1 text-[11px] text-slate-400 italic">
                  Lịch sử chỉnh sửa ghi nhận sau khi lưu lần đầu.
                </span>
              )}

              <button
                type="button"
                onClick={onSwitchToCms}
                className="py-2 px-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/80 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <span>Soạn nội dung</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
