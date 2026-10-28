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
        <Icon name={IconName.MORE} size={15} className="text-slate-700" />
      </button>
      {open && (
        <>
          <div
            className="action-menu-backdrop"
            onClick={() => setOpen(false)}
          />
          <div className="action-dropdown shadow-md border border-slate-200">
            <button
              type="button"
              className="dropdown-item text-xs font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => {
                setOpen(false);
                if (onView) {
                  onView();
                } else {
                  alert('Xem thông tin chi tiết');
                }
              }}
            >
              <Icon name={IconName.EYE} size={15} className="text-slate-600" /> Xem chi tiết
            </button>
            <button
              type="button"
              className="dropdown-item text-xs font-semibold text-slate-700 hover:text-slate-900"
              onClick={() => {
                setOpen(false);
                if (onEdit) {
                  onEdit();
                } else {
                  alert('Chỉnh sửa nội dung');
                }
              }}
            >
              <Icon name={IconName.EDIT} size={15} className="text-slate-600" /> Chỉnh sửa
            </button>
            <button
              type="button"
              className="dropdown-item danger text-xs font-semibold text-red-600 hover:text-red-700"
              onClick={() => {
                setOpen(false);
                if (onDelete) {
                  onDelete();
                } else {
                  alert('Xóa mục này');
                }
              }}
            >
              <Icon name={IconName.TRASH} size={15} className="text-red-600" /> Xóa
            </button>
          </div>
        </>
      )}
    </div>
  );
}
