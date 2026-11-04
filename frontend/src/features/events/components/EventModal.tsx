'use client';
import React, { useEffect, useState } from 'react';
import { formatHistoricalYear } from '@/utils/history-year.utils';

export interface EventFormData {
  name: string;
  topic: string;
  year: string;
  description: string;
  location?: string;
}

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EventFormData) => void;
  initialData?: ({ id: string } & EventFormData) | null;
  topics?: Array<{ id: string; name: string }>;
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  topics = [],
}: EventModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [topic, setTopic] = useState(
    initialData?.topic || (topics[0]?.name ?? 'Chiến dịch Điện Biên Phủ')
  );
  const [year, setYear] = useState(initialData?.year || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [location, setLocation] = useState(initialData?.location || '');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setTopic(
        initialData?.topic || (topics[0]?.name ?? 'Chiến dịch Điện Biên Phủ')
      );
      setYear(initialData?.year || '');
      setDescription(initialData?.description || '');
      setLocation(initialData?.location || '');
    }
  }, [isOpen, initialData, topics]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, topic, year, description, location });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {initialData ? 'Chỉnh sửa sự kiện lịch sử' : 'Thêm sự kiện lịch sử mới'}
          </h2>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="field">
            <span>
              Tên sự kiện <b>*</b>
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Chiến thắng Điện Biên Phủ"
              required
            />
          </label>
          <div className="field-row">
            <label className="field">
              <span>
                Chủ đề lịch sử <b>*</b>
              </span>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="modal-select"
              >
                {topics.length > 0 ? (
                  topics.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Chiến dịch Điện Biên Phủ">
                      Chiến dịch Điện Biên Phủ
                    </option>
                    <option value="Cách mạng tháng Tám">
                      Cách mạng tháng Tám
                    </option>
                    <option value="Kháng chiến toàn quốc">
                      Kháng chiến toàn quốc
                    </option>
                    <option value="Hiệp định Genève 1954">
                      Hiệp định Genève 1954
                    </option>
                  </>
                )}
              </select>
            </label>
            <label className="field">
              <span>Năm / Thời gian</span>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="Ví dụ: 1954, -2000 hoặc 07/05/1954"
              />
              {year && year.trim().startsWith('-') && (
                <small style={{ fontSize: 11, color: '#0284c7', marginTop: 4, display: 'block' }}>
                  Hiển thị: <b>{formatHistoricalYear(year)}</b>
                </small>
              )}
            </label>
          </div>
          <label className="field">
            <span>Địa điểm diễn ra</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ví dụ: Mường Thanh, Điện Biên Phủ"
            />
          </label>
          <label className="field">
            <span>Mô tả ngắn gọn</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tóm tắt bối cảnh hoặc kết quả sự kiện..."
            />
          </label>
          <div className="modal-footer">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Hủy bỏ
            </button>
            <button type="submit" className="primary-button">
              {initialData ? 'Cập nhật sự kiện' : 'Lưu sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
