'use client';

import React, { useState } from 'react';
import { LessonHeaderMetaForm } from '@/features/lessons/components/LessonHeaderMetaForm';
import { LessonHeaderMetaData, TopicOption } from '@/features/lessons/types/header-meta.types';
import { DifficultyLevel } from '@/constants/enums';

const MOCK_TOPICS: TopicOption[] = [
  { id: 'topic-1', name: 'Kháng chiến chống thực dân Pháp', periodName: 'Thời kỳ Hiện đại (1945 - 1954)' },
  { id: 'topic-2', name: 'Chiến tranh giải phóng dân tộc & Thống nhất đất nước', periodName: 'Thời kỳ Hiện đại (1954 - 1975)' },
  { id: 'topic-3', name: 'Nhà Trần và ba lần kháng chiến chống quân Nguyên Mông', periodName: 'Thời kỳ Phong kiến (1225 - 1400)' },
  { id: 'topic-4', name: 'Khởi nghĩa Lam Sơn & Triều đại Hậu Lê', periodName: 'Thời kỳ Phong kiến (1418 - 1527)' },
  { id: 'topic-5', name: 'Văn hóa & Đời sống Thăng Long', periodName: 'Chuyên đề Lịch sử Văn hóa' },
];

export default function TestHeaderMetaPage() {
  const [metaData, setMetaData] = useState<LessonHeaderMetaData>({
    title: 'Kháng chiến chống Pháp (1945 - 1954)',
    topicId: 'topic-1',
    shortDescription: 'Tổng quan về cuộc kháng chiến toàn dân, toàn diện chống thực dân Pháp với đỉnh cao là chiến thắng Điện Biên Phủ.',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400',
    difficulty: DifficultyLevel.MEDIUM,
    tags: ['Kháng chiến chống Pháp', 'Quân sự', 'Cách mạng'],
    startDate: '19/12/1946',
    endDate: '07/05/1954',
  });

  const handleChange = <K extends keyof LessonHeaderMetaData>(field: K, value: LessonHeaderMetaData[K]) => {
    setMetaData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Tiêu đề & Giới thiệu */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <h1 className="text-lg font-bold text-slate-900">
              Kiểm thử Cô lập: A. Thông tin bài học ở đầu trang
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bao gồm: Tiêu đề (bắt buộc), Chủ đề/Thời kỳ (bắt buộc), Mô tả ngắn, Thẻ tag, Độ khó, Ảnh đại diện và Thời gian (tùy chọn linh hoạt).
          </p>
        </div>

        {/* Component Đang Kiểm Thử */}
        <LessonHeaderMetaForm
          data={metaData}
          onChange={handleChange}
          topics={MOCK_TOPICS}
          onOpenTopicPicker={() => alert('Mở modal chọn cây tri thức TopicPickerModal')}
        />

        {/* Bảng Dữ Liệu Thực Tế (State Inspector) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
            Dữ liệu bài học đã phản hồi theo thời gian thực (State Inspector)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div>
                <strong className="text-slate-600">Tiêu đề: </strong>
                <span id="inspect-title" className="text-blue-700 font-bold">{metaData.title || '(Chưa nhập)'}</span>
              </div>
              <div>
                <strong className="text-slate-600">Chủ đề ID: </strong>
                <span id="inspect-topic" className="text-emerald-700">{metaData.topicId}</span>
              </div>
              <div>
                <strong className="text-slate-600">Độ khó: </strong>
                <span id="inspect-difficulty" className="text-amber-700 font-bold">{metaData.difficulty}</span>
              </div>
              <div>
                <strong className="text-slate-600">Thời gian: </strong>
                <span id="inspect-time">
                  {metaData.startDate || metaData.endDate
                    ? `${metaData.startDate || '...'} đến ${metaData.endDate || '...'}`
                    : 'Không gắn mốc cụ thể (Tùy chọn)'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
              <div>
                <strong className="text-slate-600">Số lượng Thẻ (Tags): </strong>
                <span id="inspect-tags-count" className="font-bold text-blue-600">{metaData.tags.length} thẻ</span>
                <span className="text-slate-400 block text-[11px] truncate">
                  [{metaData.tags.join(', ')}]
                </span>
              </div>
              <div>
                <strong className="text-slate-600">Độ dài mô tả ngắn: </strong>
                <span id="inspect-desc-len">{metaData.shortDescription.length} ký tự</span>
              </div>
              <div>
                <strong className="text-slate-600">Ảnh đại diện: </strong>
                <span className="text-slate-400 text-[11px] truncate block">
                  {metaData.thumbnailUrl || '(Chưa gắn)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
