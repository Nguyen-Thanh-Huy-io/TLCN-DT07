'use client';
import React, { useEffect, useState } from 'react';
import { PeriodItem } from '@/types/models/period.type';
import { ContentStatus } from '@/constants/enums';
import { formatHistoricalTimeSpan } from '@/utils/history-year.utils';

export interface PeriodFormData {
  name: string;
  region: string;
  startYear: number;
  endYear?: number;
  description?: string;
  displayOrder: number;
  status: ContentStatus;
}

export interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: PeriodFormData) => void;
  initialData?: PeriodItem | null;
}

export function PeriodModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: PeriodModalProps) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Việt Nam');
  const [startYear, setStartYear] = useState<number | ''>('');
  const [endYear, setEndYear] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setRegion(initialData.region || 'Việt Nam');
        setStartYear(initialData.startYear ?? '');
        setEndYear(initialData.endYear ?? '');
        setDescription(initialData.description || '');
        setDisplayOrder(initialData.displayOrder ?? 1);
        setStatus(initialData.status || ContentStatus.PUBLISHED);
      } else {
        setName('');
        setRegion('Việt Nam');
        setStartYear('');
        setEndYear('');
        setDescription('');
        setDisplayOrder(1);
        setStatus(ContentStatus.PUBLISHED);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || startYear === '') {
      alert('Vui lòng nhập tên giai đoạn và năm bắt đầu.');
      return;
    }

    if (endYear !== '' && Number(endYear) < Number(startYear)) {
      alert('Năm kết thúc phải lớn hơn hoặc bằng năm bắt đầu.');
      return;
    }

    onSave({
      name: name.trim(),
      region: region.trim() || 'Việt Nam',
      startYear: Number(startYear),
      endYear: endYear !== '' ? Number(endYear) : undefined,
      description: description.trim() || undefined,
      displayOrder: Number(displayOrder || 0),
      status,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <h2>{initialData ? 'Chỉnh sửa Giai đoạn lịch sử' : 'Thêm Giai đoạn mới'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>
              Tên giai đoạn <b>*</b>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thời kỳ Kháng chiến chống Mỹ (1954 - 1975)"
              required
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">
              <span>Năm bắt đầu <b>*</b></span>
              <input
                type="number"
                value={startYear}
                onChange={(e) => setStartYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1954 (hoặc -2000)"
                required
              />
            </label>
            <label className="field">
              <span>Năm kết thúc</span>
              <input
                type="number"
                value={endYear}
                onChange={(e) => setEndYear(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="1975 (hoặc -1000)"
              />
            </label>
          </div>

          <div style={{ marginTop: -4, marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              💡 Nhập số âm cho năm Trước Công nguyên (ví dụ: <code>-2000</code> = 2000 TCN).
            </span>
            {startYear !== '' && (
              <div
                style={{
                  marginTop: 6,
                  padding: '6px 10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  fontSize: 12,
                  color: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span style={{ fontWeight: 600 }}>Hiển thị niên đại:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {formatHistoricalTimeSpan(startYear, endYear)}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="field">
              <span>Khu vực</span>
              <input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="Việt Nam / Toàn quốc"
              />
            </label>
            <label className="field">
              <span>Thứ tự hiển thị</span>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                min={0}
              />
            </label>
          </div>

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

          <label className="field">
            <span>Mô tả tóm tắt</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập bối cảnh và ý nghĩa tóm lược của giai đoạn..."
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
