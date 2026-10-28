'use client';
import React, { useEffect, useState } from 'react';
import { ContentStatus, EntityType, ModalMode } from '@/constants/enums';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';

export interface EntityFormData {
  name: string;
  type: EntityType;
  tagline?: string;
  description?: string;
  birthYear?: number;
  deathYear?: number;
  isFeatured?: boolean;
  status: ContentStatus;
}

export interface EntityModalProps {
  isOpen: boolean;
  mode: ModalMode | 'view' | 'edit' | 'create';
  onClose: () => void;
  onSave: (data: EntityFormData) => void;
  onSwitchToEdit?: () => void;
  initialData?: HistoricalEntityItem | null;
}

const MODAL_TITLES: Record<ModalMode, string> = {
  [ModalMode.VIEW]: 'Chi tiết Nhân vật / Thực thể lịch sử',
  [ModalMode.EDIT]: 'Chỉnh sửa Nhân vật / Thực thể lịch sử',
  [ModalMode.CREATE]: 'Thêm Nhân vật / Thực thể mới',
};

export function EntityModal({
  isOpen,
  mode,
  onClose,
  onSave,
  onSwitchToEdit,
  initialData,
}: EntityModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<EntityType>(EntityType.PERSON);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [birthYear, setBirthYear] = useState<number | ''>('');
  const [deathYear, setDeathYear] = useState<number | ''>('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        setType(initialData.type || EntityType.PERSON);
        setTagline(initialData.tagline || '');
        setDescription(initialData.description || '');
        setBirthYear(initialData.birthYear ?? '');
        setDeathYear(initialData.deathYear ?? '');
        setIsFeatured(Boolean(initialData.isFeatured));
        setStatus(initialData.status || ContentStatus.PUBLISHED);
      } else {
        setName('');
        setType(EntityType.PERSON);
        setTagline('');
        setDescription('');
        setBirthYear('');
        setDeathYear('');
        setIsFeatured(false);
        setStatus(ContentStatus.PUBLISHED);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isReadOnly = mode === ModalMode.VIEW;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!name.trim()) {
      alert('Vui lòng nhập tên thực thể / nhân vật lịch sử.');
      return;
    }

    onSave({
      name: name.trim(),
      type,
      tagline: tagline.trim() || undefined,
      description: description.trim() || undefined,
      birthYear: birthYear !== '' ? Number(birthYear) : undefined,
      deathYear: deathYear !== '' ? Number(deathYear) : undefined,
      isFeatured,
      status,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 620 }}
      >
        <div className="modal-header">
          <h2>
            {MODAL_TITLES[mode as ModalMode] || MODAL_TITLES[ModalMode.CREATE]}
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <label className="field">
              <span>
                Tên Nhân vật / Thực thể <b>*</b>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isReadOnly}
                placeholder="Ví dụ: Đại tướng Võ Nguyên Giáp"
                required
              />
            </label>

            <label className="field">
              <span>Phân loại</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EntityType)}
                disabled={isReadOnly}
              >
                <option value={EntityType.PERSON}>Nhân vật (PERSON)</option>
                <option value={EntityType.ORGANIZATION}>Tổ chức (ORGANIZATION)</option>
                <option value={EntityType.DYNASTY}>Triều đại (DYNASTY)</option>
                <option value={EntityType.MILITARY_FORCE}>
                  Lực lượng quân sự (MILITARY_FORCE)
                </option>
                <option value={EntityType.ARTIFACT}>
                  Hiện vật & Khí tài (ARTIFACT)
                </option>
                <option value={EntityType.OTHER}>Khác (OTHER)</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Danh hiệu / Nhận định ngắn (Tagline)</span>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              disabled={isReadOnly}
              placeholder="Ví dụ: Tổng tư lệnh tối cao Quân đội Nhân dân Việt Nam"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="field">
              <span>Năm sinh / Thành lập</span>
              <input
                type="number"
                value={birthYear}
                onChange={(e) =>
                  setBirthYear(e.target.value === '' ? '' : Number(e.target.value))
                }
                disabled={isReadOnly}
                placeholder="1911"
              />
            </label>

            <label className="field">
              <span>Năm mất / Kết thúc</span>
              <input
                type="number"
                value={deathYear}
                onChange={(e) =>
                  setDeathYear(e.target.value === '' ? '' : Number(e.target.value))
                }
                disabled={isReadOnly}
                placeholder="2013"
              />
            </label>

            <label className="field">
              <span>Trạng thái</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                disabled={isReadOnly}
              >
                <option value={ContentStatus.DRAFT}>Bản nháp (Draft)</option>
                <option value={ContentStatus.PENDING_REVIEW}>
                  Chờ duyệt (Pending)
                </option>
                <option value={ContentStatus.PUBLISHED}>
                  Xuất bản (Published)
                </option>
                <option value={ContentStatus.ARCHIVED}>
                  Lưu trữ (Archived)
                </option>
              </select>
            </label>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              cursor: isReadOnly ? 'default' : 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              disabled={isReadOnly}
            />
            <span>Hiển thị nổi bật trên Trang chủ (isFeatured)</span>
          </label>

          <label className="field">
            <span>Mô tả / Hồ sơ lịch sử chi tiết</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isReadOnly}
              placeholder="Nhập mô tả chi tiết, hành trạng và dấu ấn lịch sử..."
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Đóng
            </button>
            {isReadOnly ? (
              onSwitchToEdit && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onSwitchToEdit}
                >
                  Chỉnh sửa ngay
                </button>
              )
            ) : (
              <button type="submit" className="btn-primary">
                {mode === ModalMode.EDIT ? 'Lưu thay đổi' : 'Tạo mới'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
