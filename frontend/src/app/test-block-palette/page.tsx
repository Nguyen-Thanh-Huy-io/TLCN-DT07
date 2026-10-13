'use client';

import React, { useState } from 'react';
import { LessonBlockPalette } from '@/features/lessons/components/LessonBlockPalette';
import { LessonBlockType } from '@/features/lessons/types/block-palette.types';
import { LESSON_BLOCK_ITEMS } from '@/features/lessons/constants/block-palette.constants';

export default function TestBlockPalettePage() {
  const [selectedBlock, setSelectedBlock] = useState<LessonBlockType | null>(null);
  const [clickHistory, setClickHistory] = useState<Array<{ type: LessonBlockType; timestamp: string }>>([]);

  const handleSelectBlock = (type: LessonBlockType) => {
    setSelectedBlock(type);
    const now = new Date().toLocaleTimeString('vi-VN');
    setClickHistory((prev) => [{ type, timestamp: now }, ...prev.slice(0, 9)]);
  };

  const selectedItemInfo = LESSON_BLOCK_ITEMS.find((item) => item.type === selectedBlock);

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Tiêu đề & Giới thiệu */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <h1 className="text-lg font-bold text-slate-900">
              Kiểm thử Cô lập: Thanh công cụ "Thêm khối nội dung" (Block Palette)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Giao diện mẫu được thiết kế theo đúng bố cục cột bên trái của ảnh <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-600">img.png</code>.
          </p>
        </div>

        {/* Khu vực kiểm thử tương tác */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* CỘT TRÁI: COMPONENT ĐANG TEST */}
          <LessonBlockPalette
            onSelectBlock={handleSelectBlock}
            activeBlockType={selectedBlock}
          />

          {/* CỘT PHẢI: BẢNG KẾT QUẢ TƯƠNG TÁC THỰC TẾ (CONSOLE & INSPECTOR) */}
          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
              Kết quả kiểm tra tương tác chuột
            </h2>

            {/* Chi tiết khối vừa chọn */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">
                Khối đang kích hoạt:
              </span>
              {selectedBlock && selectedItemInfo ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      id="test-selected-label"
                      className="text-base font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-lg"
                    >
                      {selectedItemInfo.label}
                    </span>
                    <span
                      id="test-selected-type"
                      className="text-xs font-mono text-slate-500"
                    >
                      ({selectedBlock})
                    </span>
                  </div>
                  <p id="test-selected-desc" className="text-xs text-slate-600 pt-1">
                    {selectedItemInfo.description}
                  </p>
                </div>
              ) : (
                <p id="test-selected-placeholder" className="text-xs text-slate-400 italic">
                  Chưa chọn khối nào. Hãy bấm vào một nút ở cột bên trái để thử nghiệm!
                </p>
              )}
            </div>

            {/* Lịch sử nhấp chuột (Log) */}
            <div>
              <div className="flex items-center justify-between pb-1.5">
                <span className="text-xs font-bold text-slate-700">Lịch sử nhấp chuột gần nhất</span>
                {clickHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setClickHistory([]);
                      setSelectedBlock(null);
                    }}
                    id="btn-clear-history"
                    className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    Xóa log
                  </button>
                )}
              </div>

              {clickHistory.length > 0 ? (
                <ul id="test-click-history" className="space-y-1 max-h-48 overflow-y-auto">
                  {clickHistory.map((item, idx) => (
                    <li
                      key={idx}
                      className="text-xs flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <span className="font-semibold text-slate-800">
                        {LESSON_BLOCK_ITEMS.find((b) => b.type === item.type)?.label}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{item.timestamp}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200 text-center">
                  Chưa có lượt nhấp chuột nào.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
