'use client';

import React, { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { KeyboardKey } from '@/constants/enums';
import { TopicItem } from '@/types/models/topic.type';

export interface TopicChildrenManagerProps {
  topicId: string;
  childrenTopics: TopicItem[];
  availableCandidatesToAttach: TopicItem[];
  selectedCandidateId: string;
  onSelectCandidateId: (id: string) => void;
  actionLoading: boolean;
  onAttachChild: () => void;
  onDetachChild: (id: string, name: string) => void;
  onQuickCreateChild: (name: string) => Promise<void>;
  onNavigateToCreate: () => void;
  onNavigateToEditChild: (childId: string) => void;
}

export function TopicChildrenManager({
  childrenTopics,
  availableCandidatesToAttach,
  selectedCandidateId,
  onSelectCandidateId,
  actionLoading,
  onAttachChild,
  onDetachChild,
  onQuickCreateChild,
  onNavigateToCreate,
  onNavigateToEditChild,
}: TopicChildrenManagerProps) {
  const [isQuickChildOpen, setIsQuickChildOpen] = useState(false);
  const [quickChildName, setQuickChildName] = useState('');
  const [quickCreating, setQuickCreating] = useState(false);

  const handleQuickCreate = async () => {
    const trimmed = quickChildName.trim();
    if (!trimmed) {
      alert('Vui lòng nhập tên chủ đề trực thuộc');
      return;
    }
    try {
      setQuickCreating(true);
      await onQuickCreateChild(trimmed);
      setQuickChildName('');
      setIsQuickChildOpen(false);
    } finally {
      setQuickCreating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <span>03. Chủ đề trực thuộc</span>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {childrenTopics.length} chủ đề trực thuộc
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Các phân mục trực thuộc chủ đề này trong cấu trúc cây tri thức
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsQuickChildOpen((prev) => !prev)}
            className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
              isQuickChildOpen
                ? 'bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
            }`}
          >
            <span>{isQuickChildOpen ? '✕ Đóng' : '+ Tạo nhanh chủ đề trực thuộc'}</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToCreate}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md border border-slate-200 transition cursor-pointer"
            title="Mở toàn màn hình để tùy biến sâu"
          >
            <span>Chi tiết ↗</span>
          </button>
        </div>
      </div>

      {/* Thanh Tạo Nhanh Chủ Đề Trực Thuộc Tại Chỗ */}
      {isQuickChildOpen && (
        <div className="mb-4 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg animate-in fade-in duration-150">
          <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <span>⚡ Tạo nhanh chủ đề trực thuộc:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={quickChildName}
              onChange={(e) => setQuickChildName(e.target.value)}
              onKeyDown={(e) => e.key === KeyboardKey.ENTER && handleQuickCreate()}
              placeholder="Nhập tên chủ đề trực thuộc..."
              autoFocus
              disabled={quickCreating}
              className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 shadow-2xs"
            />
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsQuickChildOpen(false);
                  setQuickChildName('');
                }}
                disabled={quickCreating}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleQuickCreate}
                disabled={quickCreating || !quickChildName.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-2xs transition cursor-pointer"
              >
                {quickCreating ? 'Đang tạo...' : 'Tạo ngay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danh sách chủ đề trực thuộc hiện tại */}
      {childrenTopics.length > 0 ? (
        <div className="space-y-2 mb-4">
          {childrenTopics.map((child) => (
            <div
              key={child.id}
              className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <Icon name={IconName.FOLDER} size={15} className="text-slate-400 shrink-0" />
                <span className="font-medium text-slate-900 truncate">{child.name}</span>
                {child._count?.lessons !== undefined && (
                  <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">
                    {child._count.lessons} bài học
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigateToEditChild(child.id)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-white transition"
                >
                  Xem / Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDetachChild(child.id, child.name)}
                  disabled={actionLoading}
                  className="text-[11px] text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition"
                  title="Tách chủ đề này ra thành chủ đề gốc độc lập"
                >
                  Tách ra
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-slate-500 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg p-5 text-center mb-4">
          Chủ đề này chưa có phân mục trực thuộc nào.
        </div>
      )}

      {/* Gắn thêm chủ đề hiện có */}
      <div className="pt-3 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-700 block mb-2">
          Gắn thêm một chủ đề hiện có vào chủ đề này:
        </span>
        <div className="flex gap-2">
          <select
            value={selectedCandidateId}
            onChange={(e) => onSelectCandidateId(e.target.value)}
            disabled={actionLoading || availableCandidatesToAttach.length === 0}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 focus:bg-white focus:outline-none"
          >
            <option value="">
              {availableCandidatesToAttach.length > 0
                ? '-- Chọn chủ đề cần gắn trực thuộc --'
                : '-- Không có chủ đề khả dụng để gán --'}
            </option>
            {availableCandidatesToAttach.map((cand) => (
              <option key={cand.id} value={cand.id}>
                {cand.name} {cand.parent ? `(Đang thuộc: ${cand.parent.name})` : '(Chủ đề gốc)'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAttachChild}
            disabled={!selectedCandidateId || actionLoading}
            className="btn-secondary text-xs px-3.5 py-2 whitespace-nowrap"
          >
            {actionLoading ? 'Đang gắn...' : 'Gắn vào chủ đề này'}
          </button>
        </div>
      </div>
    </div>
  );
}
