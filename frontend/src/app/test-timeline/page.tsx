'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import {
  HistoricalTimelineBlock,
  TimelineNode,
} from '@/features/lessons/components/blocks/HistoricalTimelineBlock';

export default function TestTimelinePage() {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSelected, setIsSelected] = useState(true);
  const [timelineData, setTimelineData] = useState<{
    title: string;
    subtitle: string;
    nodes: TimelineNode[];
  }>({
    title: 'Timeline — Dòng thời gian',
    subtitle: 'Các mốc lịch sử tiêu biểu',
    nodes: [
      {
        id: 'node_1',
        year: '1945',
        title: 'Tuyên ngôn Độc lập — Khai sinh nước VNDCCH',
        description:
          'Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình, chấm dứt hơn 80 năm thực dân Pháp đô hộ và chế độ phong kiến nghìn năm.',
      },
      {
        id: 'node_2',
        year: '1954',
        title: 'Chiến thắng lịch sử Điện Biên Phủ',
        description:
          'Chiến dịch quân sự quyết định kéo dài 56 ngày đêm, đập tan tập đoàn cứ điểm mạnh nhất Đông Dương của thực dân Pháp, lừng lẫy năm châu chấn động địa cầu.',
        eventId: 'event-sample-dbp',
      },
      {
        id: 'node_3',
        year: '1975',
        title: 'Đại thắng mùa Xuân — Thống nhất non sông',
        description:
          'Chiến dịch Hồ Chí Minh toàn thắng ngày 30/4/1975, giải phóng hoàn toàn miền Nam, giang sơn thu về một mối.',
      },
    ],
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-6 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/lessons"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
              title="Quay lại danh sách bài học"
            >
              <Icon name={IconName.CHEVRON_LEFT} size={18} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block animate-pulse" />
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  Kiểm thử trực quan: Khối Dòng Thời Gian (Timeline Block)
                </h1>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  img1.png + img8.png
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chuẩn mỹ thuật sách giáo khoa lịch sử mới: Tinh tế, rõ ràng, không rối mắt, tích hợp kho tri thức HISGO.
              </p>
            </div>
          </div>

          {/* Toggle Switches */}
          <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setIsPreviewMode(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                !isPreviewMode
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon name={IconName.EDIT} size={13} />
              <span>Chế độ Biên soạn (img1 & img6)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPreviewMode(true);
                setIsSelected(false);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                isPreviewMode
                  ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon name={IconName.EYE} size={13} />
              <span>Chế độ Sách giáo khoa (img8)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Banner hướng dẫn tương tác */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-5 shadow-2xs">
          <h2 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2">
            <Icon name={IconName.SPARK} size={16} className="text-blue-600" />
            Hướng dẫn trải nghiệm các tính năng của Khối Dòng Thời Gian:
          </h2>
          <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5 leading-relaxed">
            <li>
              <strong>Nhập thủ công:</strong> Có thể sửa trực tiếp Năm, Tên sự kiện và Nội dung mô tả trên từng mốc.
            </li>
            <li>
              <strong>Thêm mốc thời gian:</strong> Nhấp vào nút <span className="text-blue-700 font-semibold">+ Thêm mốc thời gian</span> để thêm node mới vào dòng thời gian.
            </li>
            <li>
              <strong>Tra cứu từ kho HISGO:</strong> Bấm vào nút <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded font-semibold">+ Chọn sự kiện từ kho tri thức HISGO</span> để mở modal tra cứu và tự động điền dữ liệu đã thẩm định.
            </li>
            <li>
              <strong>Trạng thái tương tác (img6.png):</strong> Bấm vào khối để kích hoạt viền xanh và thanh công cụ thao tác nổi.
            </li>
            <li>
              <strong>Chế độ Sách giáo khoa (img8.png):</strong> Chuyển sang nút "Chế độ Sách giáo khoa" ở góc trên để chiêm ngưỡng giao diện học tập sạch đẹp, chuẩn mực.
            </li>
          </ul>
        </div>

        {/* Khối Bài Học Mô Phỏng (Lesson Reading / Editing Viewport) */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 md:p-10 transition-all">
          {/* Header Giả lập Bài Học Sử Ký */}
          <div className="border-b border-slate-100 pb-6 mb-6">
            <span className="text-[11px] font-bold tracking-widest text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
              Bài học Sử Ký minh họa
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 font-serif tracking-tight mt-3">
              Cách Mạng Tháng Tám và Sự Ra Đời Nước Việt Nam Dân Chủ Cộng Hòa
            </h1>
            <p className="text-sm text-slate-500 font-sans mt-2 leading-relaxed">
              Trang biên soạn và trình diễn bài học tương tác với cấu trúc khối trực quan, chuẩn mỹ thuật sư phạm lịch sử.
            </p>
          </div>

          {/* Một đoạn văn bản dẫn nhập mẫu */}
          <p className="text-sm md:text-base text-slate-700 leading-relaxed font-serif mb-6">
            Tháng Tám năm 1945, nắm bắt thời cơ ngàn năm có một khi phát xít Nhật đầu hàng quân Đồng minh, dưới sự lãnh đạo sáng suốt của Đảng và Chủ tịch Hồ Chí Minh, toàn thể dân tộc Việt Nam đã nhất tề đứng lên tổng khởi nghĩa giành chính quyền về tay nhân dân.
          </p>

          {/* COMPONENT KHỐI TIMELINE ĐƯỢC KIỂM THỬ */}
          <HistoricalTimelineBlock
            id="timeline_block_test"
            title={timelineData.title}
            subtitle={timelineData.subtitle}
            nodes={timelineData.nodes}
            isSelected={!isPreviewMode && isSelected}
            isPreview={isPreviewMode}
            onSelect={() => {
              if (!isPreviewMode) setIsSelected(true);
            }}
            onChange={(newData) => {
              setTimelineData(newData);
            }}
            onMoveUp={() => alert('Đã bấm: Di chuyển khối lên trên')}
            onMoveDown={() => alert('Đã bấm: Di chuyển khối xuống dưới')}
            onDelete={() => {
              if (confirm('Bạn có chắc muốn xóa khối dòng thời gian này?')) {
                setTimelineData((prev) => ({ ...prev, nodes: [] }));
              }
            }}
          />

          {/* Một đoạn văn bản kết luận mẫu */}
          <p className="text-sm md:text-base text-slate-700 leading-relaxed font-serif mt-6">
            Thắng lợi vĩ đại của Cách mạng Tháng Tám đã mở ra một kỷ nguyên mới cho lịch sử dân tộc — kỷ nguyên độc lập, tự do và chủ nghĩa xã hội.
          </p>
        </div>

        {/* Bảng Dữ Liệu JSONB Đang Được Lưu Tự Động (Developer View) */}
        <div className="bg-slate-900 rounded-2xl p-5 text-slate-100 font-mono text-xs shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <span className="text-emerald-400 font-bold flex items-center gap-1.5">
              <span>●</span> Cấu trúc JsonB thời gian thực (Lưu vào DB lesson.content)
            </span>
            <span className="text-[11px] text-slate-500">
              {timelineData.nodes.length} mốc sự kiện
            </span>
          </div>
          <pre className="overflow-x-auto text-[11px] text-slate-300 max-h-60 leading-relaxed">
            {JSON.stringify(
              {
                type: 'TIMELINE',
                title: timelineData.title,
                subtitle: timelineData.subtitle,
                nodes: timelineData.nodes,
              },
              null,
              2
            )}
          </pre>
        </div>
      </main>
    </div>
  );
}
