'use client';
import React, { useState } from 'react';

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonTitle: string;
  lessonSummary?: string;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  lessonTitle,
  lessonSummary,
  onApprove,
  onReject,
}: ReviewModalProps) {
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        style={{ maxWidth: 640 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Kiểm duyệt bài học: "{lessonTitle}"</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {!isRejecting ? (
            <>
              <div
                style={{
                  background: '#f8f9fa',
                  padding: 16,
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 12,
                  color: '#374151',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ display: 'block', marginBottom: 6 }}>
                  Tóm tắt từ dữ liệu bài học:
                </strong>
                <p style={{ margin: 0 }}>
                  {lessonSummary && lessonSummary.trim()
                    ? lessonSummary
                    : 'Chưa có nội dung tóm tắt từ backend. Bài học sẽ hiển thị dữ liệu thực khi được lưu vào hệ thống.'}
                </p>
              </div>

              <div className="modal-footer" style={{ gap: 12 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsRejecting(true)}
                  style={{ color: '#c54646' }}
                >
                  Từ chối phê duyệt
                </button>
                <button
                  type="button"
                  className="primary-button"
                  style={{ background: '#287056' }}
                  onClick={() => {
                    onApprove();
                    onClose();
                  }}
                >
                  ✓ Duyệt & Xuất bản
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="field">
                <span>
                  Lý do từ chối <b>*</b>
                </span>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Vui lòng nêu rõ các điểm cần chỉnh sửa hoặc lý do chưa đạt..."
                  required
                />
              </label>
              <div className="modal-footer" style={{ gap: 10 }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsRejecting(false)}
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => {
                    if (!rejectReason.trim()) {
                      alert('Vui lòng nhập lý do từ chối!');
                      return;
                    }
                    onReject(rejectReason);
                    setIsRejecting(false);
                    onClose();
                  }}
                >
                  Xác nhận Từ chối
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
