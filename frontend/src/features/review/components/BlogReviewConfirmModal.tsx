'use client';

import React, { useState } from 'react';
import { ContentStatus } from '@/constants/enums';
import { BORDER_LIGHT } from '../constants/review.constant';
import type { ReviewConfirmAction, ReviewPost } from '../types/review.types';

interface BlogReviewConfirmModalProps {
  confirmAction: ReviewConfirmAction | null;
  onClose: () => void;
  onConfirm: (
    item: ReviewPost,
    type: ContentStatus.PUBLISHED | ContentStatus.REJECTED,
    reason?: string,
  ) => void;
}

export function BlogReviewConfirmModal({
  confirmAction,
  onClose,
  onConfirm,
}: BlogReviewConfirmModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!confirmAction) return null;

  const isPublish = confirmAction.type === ContentStatus.PUBLISHED;

  const handleConfirmClick = () => {
    if (!isPublish && !rejectReason.trim()) {
      setErrorMsg('Vui lòng nhập lý do từ chối trước khi gửi.');
      return;
    }
    onConfirm(confirmAction.item, confirmAction.type, isPublish ? undefined : rejectReason.trim());
    setRejectReason('');
    setErrorMsg('');
  };

  const handleClose = () => {
    setRejectReason('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        zIndex: 60,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#ffffff',
          borderRadius: 24,
          border: BORDER_LIGHT,
          padding: 26,
          boxShadow: '0 28px 70px rgba(15, 23, 42, 0.14)',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#5c5f64',
              fontWeight: 700,
            }}
          >
            {isPublish ? 'Xác nhận duyệt' : 'Từ chối bài viết'}
          </div>
          <h3
            style={{
              margin: '10px 0 0',
              fontSize: 24,
              lineHeight: 1.3,
              color: '#1f2a37',
              fontWeight: 800,
            }}
          >
            {isPublish ? 'Bạn có muốn duyệt bài này không?' : 'Bạn có muốn từ chối bài này không?'}
          </h3>
        </div>

        <div style={{ color: '#3d4853', fontSize: 15, lineHeight: 1.8, marginBottom: 18 }}>
          <div>
            <strong>Bài:</strong> {confirmAction.item.title}
          </div>
          <div>
            <strong>Tác giả:</strong> {confirmAction.item.author}
          </div>
        </div>

        {!isPublish ? (
          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="blog-review-reject-reason"
              style={{ display: 'block', fontWeight: 700, color: '#1f2a37', marginBottom: 8 }}
            >
              Lý do từ chối
            </label>
            <textarea
              id="blog-review-reject-reason"
              value={rejectReason}
              onChange={(event) => {
                setRejectReason(event.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              rows={4}
              placeholder="Ví dụ: thiếu nguồn, nội dung chưa đạt yêu cầu..."
              style={{
                width: '100%',
                resize: 'vertical',
                borderRadius: 16,
                border: '1px solid #dfe3e8',
                background: '#f8fafc',
                padding: '12px 14px',
                fontSize: 14,
                outline: 'none',
                color: '#1f2a37',
              }}
            />
            {errorMsg ? (
              <p style={{ margin: '6px 0 0', color: '#8d3d34', fontSize: 13 }}>{errorMsg}</p>
            ) : null}
          </div>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              border: '1px solid #dfe3e8',
              borderRadius: 999,
              background: '#f3f4f6',
              color: '#374151',
              fontWeight: 700,
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            style={{
              border: 'none',
              borderRadius: 999,
              background: isPublish ? '#1f2937' : '#8d3d34',
              color: '#fff',
              fontWeight: 700,
              padding: '10px 16px',
              cursor: 'pointer',
            }}
          >
            {isPublish ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}
