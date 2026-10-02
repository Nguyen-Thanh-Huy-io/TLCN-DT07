'use client';
import React, { useEffect, useState } from 'react';
import { TopicItem } from '@/types/models/topic.type';
import { PeriodItem } from '@/types/models/period.type';
import { ContentStatus } from '@/constants/enums';
import { PeriodApiService } from '@/services/entities/period.service';

export interface TopicFormData {
  periodId: string;
  name: string;
  description?: string;
  isSequential: boolean;
  displayOrder: number;
  status: ContentStatus;
}

export interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TopicFormData) => void;
  initialData?: TopicItem | null;
}

export function TopicModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TopicModalProps) {
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  const [periodId, setPeriodId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSequential, setIsSequential] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);

  useEffect(() => {
    if (isOpen) {
      setLoadingPeriods(true);
      PeriodApiService.getPeriods({ limit: 100 })
        .then((res) => {
          setPeriods(res.items);
          if (!periodId && res.items.length > 0) {
            setPeriodId(res.items[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingPeriods(false));

      if (initialData) {
        setPeriodId(initialData.period?.id || '');
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setIsSequential(Boolean(initialData.isSequential));
        setDisplayOrder(initialData.displayOrder ?? 1);
        setStatus(initialData.status || ContentStatus.PUBLISHED);
      } else {
        setName('');
        setDescription('');
        setIsSequential(false);
        setDisplayOrder(1);
        setStatus(ContentStatus.PUBLISHED);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !periodId) {
      alert('Vui lòng chọn Giai đoạn lịch sử và nhập tên chủ đề.');
      return;
    }

    onSave({
      periodId,
      name: name.trim(),
      description: description.trim() || undefined,
      isSequential,
      displayOrder: Number(displayOrder || 0),
      status,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2>{initialData ? 'Chỉnh sửa Chủ đề lịch sử' : 'Thêm Chủ đề mới'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>
              Thuộc Giai đoạn lịch sử <b>*</b>
            </span>
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              disabled={loadingPeriods}
              required
            >
              {periods.length === 0 ? (
                <option value="">{loadingPeriods ? 'Đang tải...' : 'Chưa có giai đoạn nào'}</option>
              ) : (
                periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="field">
            <span>
              Tên chủ đề <b>*</b>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Đánh bại các chiến lược chiến tranh của Mỹ (1961 - 1973)"
              required
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">
              <span>Thứ tự hiển thị</span>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                min={0}
              />
            </label>

            <label className="field">
              <span>Trạng thái</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
              >
                <option value={ContentStatus.DRAFT}>Bản nháp (Draft)</option>
                <option value={ContentStatus.PENDING_REVIEW}>Chờ duyệt (Pending Review)</option>
                <option value={ContentStatus.PUBLISHED}>Xuất bản (Published)</option>
                <option value={ContentStatus.ARCHIVED}>Lưu trữ (Archived)</option>
              </select>
            </label>
          </div>

          <label className="field-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
            <input
              type="checkbox"
              checked={isSequential}
              onChange={(e) => setIsSequential(e.target.checked)}
            />
            <span>Yêu cầu học viên học theo thứ tự tuần tự</span>
          </label>

          <label className="field">
            <span>Mô tả chủ đề</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả bối cảnh và mục tiêu học tập của chủ đề..."
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
