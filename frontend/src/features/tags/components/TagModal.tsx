'use client';
import React, { useEffect, useState } from 'react';

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
    if (isOpen) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
    }
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
