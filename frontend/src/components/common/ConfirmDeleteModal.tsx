'use client';
import React from 'react';

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  itemTypeLabel?: string;
  message?: string;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemTypeLabel = 'mục',
  message,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container modal-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Xác nhận xóa {itemTypeLabel}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p className="delete-warn-text">
            {message || (
              <>
                Bạn có chắc chắn muốn xóa {itemTypeLabel} <strong>"{title}"</strong> không? Thao tác này không thể hoàn tác.
              </>
            )}
          </p>
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              className="danger-button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              Xóa {itemTypeLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
