'use client';

import React, { useState } from 'react';
import { LessonLeftSidebar } from '@/features/lessons/components/LessonLeftSidebar';
import { LessonCategoryType, QuickSettingKey, TocItem } from '@/features/lessons/types/left-sidebar.types';

const INITIAL_MOCK_TOC: TocItem[] = [
  { id: 'sec-1', text: 'Bối cảnh lịch sử', level: 1, sectionNumber: '1.' },
  { id: 'sec-2', text: 'Diễn biến chiến dịch', level: 1, sectionNumber: '2.' },
  { id: 'sec-2-1', text: 'Đợt 1: Tấn công Him Lam...', level: 2, sectionNumber: '2.1.' },
  { id: 'sec-2-2', text: 'Đợt 2: Đánh chiếm phân khu...', level: 2, sectionNumber: '2.2.' },
  { id: 'sec-2-3', text: 'Tổng công kích', level: 2, sectionNumber: '2.3.' },
  { id: 'sec-3', text: 'Kết quả', level: 1, sectionNumber: '3.' },
  { id: 'sec-4', text: 'Ý nghĩa lịch sử', level: 1, sectionNumber: '4.' },
];

export default function TestLessonLeftSidebarPage() {
  const [tocItems, setTocItems] = useState<TocItem[]>(INITIAL_MOCK_TOC);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('sec-1');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [lastJumpKey, setLastJumpKey] = useState<string>('');
  const [message, setMessage] = useState<string>('Sẵn sàng kiểm thử cô lập');

  const handleSelectHeading = (id: string) => {
    setActiveHeadingId(id);
    setMessage(`Đã chọn đề mục: ${id}`);
  };

  const handleAddHeading = () => {
    const newId = `sec-custom-${Date.now()}`;
    const newItem: TocItem = {
      id: newId,
      text: `Mục mới bổ sung #${tocItems.length + 1}`,
      level: 1,
      sectionNumber: `${tocItems.length + 1}.`,
    };
    setTocItems([...tocItems, newItem]);
    setMessage(`Đã thêm mục mới: ${newItem.text}`);
  };

  const handleQuickJump = (key: QuickSettingKey) => {
    setLastJumpKey(key);
    setMessage(`Đã kích hoạt thiết lập nhanh: ${key}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 items-start">
        {/* Component Sidebar đang test cô lập */}
        <LessonLeftSidebar
          lessonTitle="Chiến dịch Điện Biên Phủ năm 1954"
          lessonType={LessonCategoryType.EVENT}
          tocItems={tocItems}
          activeHeadingId={activeHeadingId}
          onSelectHeading={handleSelectHeading}
          onAddHeading={handleAddHeading}
          onQuickJump={handleQuickJump}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Bảng điều khiển kiểm thử (Test Console) */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <h1 className="text-base font-bold text-slate-800">
            Trang Kiểm thử Cô lập: LessonLeftSidebar
          </h1>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div>
              <strong>Trạng thái: </strong>
              <span id="test-console-message" className="text-blue-600 font-semibold">{message}</span>
            </div>
            <div>
              <strong>Đề mục đang chọn (Active): </strong>
              <span id="test-active-heading" className="text-emerald-600 font-mono">{activeHeadingId}</span>
            </div>
            <div>
              <strong>Phím tắt vừa bấm (QuickJump): </strong>
              <span id="test-last-jump" className="text-amber-600 font-mono">{lastJumpKey || 'Chưa bấm'}</span>
            </div>
            <div>
              <strong>Tổng số mục ToC: </strong>
              <span id="test-toc-count" className="font-mono">{tocItems.length}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              id="btn-reset-test"
              onClick={() => {
                setTocItems(INITIAL_MOCK_TOC);
                setActiveHeadingId('sec-1');
                setLastJumpKey('');
                setMessage('Đã reset dữ liệu');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200"
            >
              Reset dữ liệu
            </button>
            <button
              type="button"
              id="btn-clear-toc"
              onClick={() => {
                setTocItems([]);
                setMessage('Đã xóa hết mục lục (Empty state test)');
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200"
            >
              Test Empty ToC
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
