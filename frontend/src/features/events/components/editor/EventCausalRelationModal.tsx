'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HistoricalCombobox } from './HistoricalCombobox';
import type { OtherEventOption } from './editor.types';
import {
  EventRelationType,
  EVENT_RELATION_TYPE_LABELS,
  VerificationStatus,
  VERIFICATION_STATUS_LABELS,
} from '@/constants/enums';
import type { TaxonomyGroupItem } from '@/services/entities/taxonomy.service';
import { relationOptions } from '@/features/taxonomy/taxonomy-labels';

export interface EventCausalRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  otherEvents: OtherEventOption[];
  currentEventId?: string;
  relationGroup?: TaxonomyGroupItem;
  onAddRelation: (relation: {
    targetEventId: string;
    relationType: string;
    description?: string;
    status: VerificationStatus;
    sourceReference?: string;
  }) => void;
}

export function EventCausalRelationModal({
  isOpen,
  onClose,
  otherEvents,
  currentEventId,
  relationGroup,
  onAddRelation,
}: EventCausalRelationModalProps) {
  const [mounted, setMounted] = useState(false);
  const [targetEventId, setTargetEventId] = useState('');
  const [relationType, setRelationType] = useState<string>(
    EventRelationType.CAUSES,
  );
  const [status, setStatus] = useState<VerificationStatus>(
    VerificationStatus.VERIFIED,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [description, setDescription] = useState('');
  const [sourceReference, setSourceReference] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const eventOptions = otherEvents
    .filter((ev) => !currentEventId || ev.id !== currentEventId)
    .map((ev) => ({
      id: ev.id,
      label: ev.title,
      subLabel: ev.eventDateNote || undefined,
      badge: ev.startYear ? `${ev.startYear}` : undefined,
    }));

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!targetEventId) {
      alert('Vui lòng chọn sự kiện liên kết đích.');
      return;
    }
    onAddRelation({
      targetEventId,
      relationType,
      status,
      description: description.trim() || undefined,
      sourceReference: sourceReference.trim() || undefined,
    });
    setTargetEventId('');
    setDescription('');
    setSourceReference('');
    setShowAdvanced(false);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  const modalNode = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Thêm quan hệ nhân quả giữa các sự kiện
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-sm font-bold transition p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div onKeyDown={handleKeyDown} className="p-5 space-y-4">
          {/* Sự kiện liên kết đích (Autocomplete Combobox) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sự kiện liên kết <span className="text-rose-500">*</span>
            </label>
            <HistoricalCombobox
              options={eventOptions}
              value={targetEventId}
              onChange={setTargetEventId}
              placeholder="Gõ từ khóa để tìm kiếm sự kiện..."
              emptyText="Không tìm thấy sự kiện phù hợp"
            />
          </div>

          {/* Mối quan hệ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mối quan hệ nhân quả <span className="text-rose-500">*</span>
              </label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
              >
                {relationOptions(
                  relationGroup?.terms ?? [],
                  EVENT_RELATION_TYPE_LABELS,
                  relationType,
                ).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái xác minh
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as VerificationStatus)
                }
                className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-amber-500"
              >
                {Object.entries(VERIFICATION_STATUS_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nút bấm mở rộng trường nâng cao: Giải thích & Nguồn chứng minh */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition"
            >
              <span>{showAdvanced ? '− Thu gọn' : '+ Thêm giải thích & nguồn chứng minh (tùy chọn)'}</span>
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 animate-in fade-in duration-100">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Nguồn chứng minh
                  </label>
                  <input
                    type="text"
                    value={sourceReference}
                    onChange={(e) => setSourceReference(e.target.value)}
                    placeholder="VD: Đại Việt Sử Ký Toàn Thư, Tập 2; Lịch sử Đảng..."
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Giải thích mối liên hệ
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Mô tả cụ thể tác động trực tiếp hoặc gián tiếp giữa 2 sự kiện..."
                    className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              Xác nhận thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
}
