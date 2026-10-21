'use client';
import React, { useEffect, useState } from 'react';
import { ContentStatus, LocationType } from '@/constants/enums';
import { HistoricalLocationItem } from '@/types/models/historical-location.type';

export interface LocationFormData {
  name: string;
  type: LocationType;
  address?: string;
  latitude?: number;
  longitude?: number;
  historicalSignificance?: string;
  status: ContentStatus;
}

export interface LocationModalProps {
  isOpen: boolean;
  mode: 'view' | 'edit' | 'create';
  onClose: () => void;
  onSave: (data: LocationFormData) => void;
  onSwitchToEdit?: () => void;
  initialData?: HistoricalLocationItem | null;
}

export function LocationModal({
  isOpen,
  mode,
  onClose,
  onSave,
  onSwitchToEdit,
  initialData,
}: LocationModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>(LocationType.MONUMENT);
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | ''>('');
  const [longitude, setLongitude] = useState<number | ''>('');
  const [historicalSignificance, setHistoricalSignificance] = useState('');
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || '');
        const resolvedType =
          (initialData.siteType as LocationType) ||
          (initialData.historicalSite?.siteType as LocationType) ||
          (initialData.type as LocationType) ||
          LocationType.MONUMENT;
        setType(resolvedType);
        setAddress(
          initialData.address || initialData.historicalSite?.address || '',
        );
        const resolvedLat =
          initialData.latitude ?? initialData.historicalSite?.latitude ?? '';
        const resolvedLng =
          initialData.longitude ?? initialData.historicalSite?.longitude ?? '';
        setLatitude(resolvedLat !== '' ? Number(resolvedLat) : '');
        setLongitude(resolvedLng !== '' ? Number(resolvedLng) : '');
        setHistoricalSignificance(
          initialData.historicalSignificance ||
            initialData.description ||
            initialData.tagline ||
            '',
        );
        setStatus(initialData.status || ContentStatus.PUBLISHED);
      } else {
        setName('');
        setType(LocationType.MONUMENT);
        setAddress('');
        setLatitude('');
        setLongitude('');
        setHistoricalSignificance('');
        setStatus(ContentStatus.PUBLISHED);
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const isReadOnly = mode === 'view';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!name.trim()) {
      alert('Vui lòng nhập tên địa danh / di tích lịch sử.');
      return;
    }

    onSave({
      name: name.trim(),
      type,
      address: address.trim() || undefined,
      latitude: latitude !== '' ? Number(latitude) : undefined,
      longitude: longitude !== '' ? Number(longitude) : undefined,
      historicalSignificance: historicalSignificance.trim() || undefined,
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
            {mode === 'view'
              ? 'Chi tiết Địa danh / Di tích lịch sử'
              : mode === 'edit'
                ? 'Chỉnh sửa Địa danh / Di tích lịch sử'
                : 'Thêm Địa danh / Di tích mới'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <label className="field">
              <span>
                Tên Địa danh / Di tích <b>*</b>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isReadOnly}
                placeholder="Ví dụ: Dinh Độc Lập (Hội trường Thống Nhất)"
                required
              />
            </label>

            <label className="field">
              <span>Phân loại</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LocationType)}
                disabled={isReadOnly}
              >
                <option value={LocationType.BATTLEFIELD}>
                  Chiến trường (BATTLEFIELD)
                </option>
                <option value={LocationType.MONUMENT}>Di tích (MONUMENT)</option>
                <option value={LocationType.ANCIENT_CAPITAL}>
                  Cố đô / Kinh thành (ANCIENT_CAPITAL)
                </option>
                <option value={LocationType.CITADEL}>Thành lũy (CITADEL)</option>
                <option value={LocationType.TEMPLE}>Đền / Chùa (TEMPLE)</option>
                <option value={LocationType.OTHER}>Khác (OTHER)</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Địa chỉ hiện tại</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isReadOnly}
              placeholder="Ví dụ: 135 Nam Kỳ Khởi Nghĩa, Quận 1, TP. Hồ Chí Minh"
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <label className="field">
              <span>Vĩ độ (Latitude)</span>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) =>
                  setLatitude(e.target.value === '' ? '' : Number(e.target.value))
                }
                disabled={isReadOnly}
                placeholder="10.7770"
              />
            </label>

            <label className="field">
              <span>Kinh độ (Longitude)</span>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) =>
                  setLongitude(e.target.value === '' ? '' : Number(e.target.value))
                }
                disabled={isReadOnly}
                placeholder="106.6953"
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

          <label className="field">
            <span>Ý nghĩa lịch sử & Dấu ấn sự kiện</span>
            <textarea
              rows={4}
              value={historicalSignificance}
              onChange={(e) => setHistoricalSignificance(e.target.value)}
              disabled={isReadOnly}
              placeholder="Mô tả giá trị lịch sử của địa danh / di tích..."
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
                {mode === 'edit' ? 'Lưu thay đổi' : 'Tạo mới'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
