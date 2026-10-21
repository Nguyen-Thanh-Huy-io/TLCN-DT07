'use client';

import React, { useState } from 'react';
import { TipTapContent } from '../TipTapContent';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

interface TextBlockEditorProps {
  content: string;
  onChange: (val: string) => void;
}

export function TextBlockEditor({ content, onChange }: TextBlockEditorProps) {
  // State mở Modal soạn thảo văn bản tập trung
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Draft content trong modal để người dùng viết thoải mái
  const [modalDraft, setModalDraft] = useState(content);

  const handleOpenModal = () => {
    setModalDraft(content);
    setIsModalOpen(true);
  };

  const handleApplyModal = () => {
    onChange(modalDraft);
    setIsModalOpen(false);
  };

  const handleCancelModal = () => {
    setIsModalOpen(false);
  };

  // Tính số từ trong modal
  const wordCount = (modalDraft || '')
    .replace(/<[^>]*>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div className="w-full relative group/text-block" data-testid="text-block-editor">
      {/* Nút mở Modal soạn thảo kích thước lớn ở góc trên bên phải */}
      <div className="flex items-center justify-end mb-1">
        <button
          type="button"
          onClick={handleOpenModal}
          data-testid="btn-open-text-modal"
          className="text-[11px] font-semibold text-slate-500 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/80 border border-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 shadow-2xs"
          title="Mở toàn màn hình / Modal để viết văn bản dễ nhìn hơn"
        >
          <span className="text-xs">⛶</span>
          <span>Soạn trong Modal</span>
        </button>
      </div>

      {/* Trình soạn thảo inline trong canvas */}
      <TipTapContent
        value={content}
        onChange={onChange}
        compact={true}
        placeholder="Soạn thảo đoạn văn bản lịch sử (hỗ trợ in đậm, nghiêng, tiêu đề H2, H3, danh sách)..."
      />

      {/* MODAL SOẠN THẢO VĂN BẢN TẬP TRUNG (ZEN FOCUS WRITING MODAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-150">
          <div
            data-testid="text-block-zen-modal"
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[94vw] max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Icon name={IconName.EDIT} size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Soạn thảo văn bản tập trung
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Không gian viết rộng rãi &bull; Đầy đủ thanh công cụ định dạng &bull; {wordCount} từ
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="secondary-button !h-8 !text-xs !px-3"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  id="btn-apply-text-modal"
                  onClick={handleApplyModal}
                  className="primary-button !h-8 !text-xs !px-4"
                >
                  Áp dụng &amp; Đóng
                </button>
                <button
                  type="button"
                  onClick={handleCancelModal}
                  className="p-1 text-slate-400 hover:text-slate-600 text-base leading-none ml-1"
                  title="Đóng modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Body Modal: Trình soạn thảo TipTap kích thước lớn, đầy đủ thanh công cụ */}
            <div className="flex-1 p-5 overflow-y-auto bg-white">
              <div className="max-w-3xl mx-auto h-full flex flex-col">
                <TipTapContent
                  value={modalDraft}
                  onChange={(val) => setModalDraft(val)}
                  compact={false}
                  placeholder="Bắt đầu viết văn bản lịch sử chi tiết tại đây (hỗ trợ in đậm, nghiêng, trích dẫn, ảnh, tiêu đề H1/H2/H3)..."
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
