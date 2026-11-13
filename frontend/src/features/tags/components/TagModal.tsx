'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import api, { extractErrorMessage } from '@/services/api';

// === TagForm.tsx ===
export function TagForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('Vui lòng nhập tên thẻ.');
      return;
    }

    try {
      setSaving(true);
      await api.post('/tags', {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push(APP_ROUTES.TAGS.LIST);
    } catch (err: unknown) {
      console.error('Failed to create tag:', err);
      alert(extractErrorMessage(err, 'Không thể tạo thẻ.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="panel management-panel"
      style={{ maxWidth: 760, margin: '0 auto' }}
    >
      <div className="page-title" style={{ marginBottom: 20 }}>
        <div>
          <div className="eyebrow">
            <button
              type="button"
              onClick={() => router.push(APP_ROUTES.TAGS.LIST)}
            >
              Tags
            </button>
          </div>
          <h1>Thêm thẻ mới</h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="form-card"
        style={{ padding: 24 }}
      >
        <label className="field">
          <span>
            Tên thẻ <b>*</b>
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Kháng chiến, Di sản, Cách mạng"
          />
        </label>

        <label className="field">
          <span>Mô tả</span>
          <textarea
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Nhập mô tả ngắn về thẻ..."
          />
        </label>

        <div
          className="sticky-actions"
          style={{ justifyContent: 'flex-end', marginTop: 20 }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={() => router.push(APP_ROUTES.TAGS.LIST)}
          >
            Hủy
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu thẻ'}
          </button>
        </div>
      </form>
    </div>
  );
}

// === TagModal.tsx ===
export interface TagFormData {
  name: string;
  description?: string;
  colorHex?: string;
}

export interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TagFormData) => void;
  initialData?: ({ id: string } & TagFormData) | null;
}

export function TagModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: TagModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');

  useEffect(() => {
    void Promise.resolve().then(() => {
      if (isOpen) {
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
      }
    });
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{initialData ? 'Chỉnh sửa thẻ' : 'Thêm thẻ mới'}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>
              Tên thẻ <b>*</b>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Kháng chiến, Pháp, Địa danh"
              required
            />
          </label>

          <label className="field">
            <span>Mô tả</span>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả ngắn về thẻ..."
            />
          </label>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Hủy
            </button>
            <button type="submit" className="primary-button">
              {initialData ? 'Cập nhật thẻ' : 'Lưu thẻ mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
