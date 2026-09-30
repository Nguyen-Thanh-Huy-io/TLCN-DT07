'use client';
import React, { useState } from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface ActionMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
}

export function ActionMenu({ onEdit, onDelete, onView }: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="action-menu-wrapper" style={{ position: 'relative' }}>
      <button
        type="button"
        className="action-more"
        aria-label="Mở thao tác"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <Icon name={IconName.MORE} />
      </button>
      {open && (
        <>
          <div
            className="action-menu-backdrop"
            onClick={() => setOpen(false)}
          />
          <div className="action-dropdown">
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                onView ? onView() : alert('Xem thông tin chi tiết');
              }}
            >
              <Icon name={IconName.EYE} size={14} /> Xem chi tiết
            </button>
            <button
              type="button"
              className="dropdown-item"
              onClick={() => {
                setOpen(false);
                onEdit ? onEdit() : alert('Chỉnh sửa nội dung');
              }}
            >
              <Icon name={IconName.EDIT} size={14} /> Chỉnh sửa
            </button>
            <button
              type="button"
              className="dropdown-item danger"
              onClick={() => {
                setOpen(false);
                onDelete ? onDelete() : alert('Xóa mục này');
              }}
            >
              <Icon name={IconName.TRASH} size={14} /> Xóa
            </button>
          </div>
        </>
      )}
    </div>
  );
}
