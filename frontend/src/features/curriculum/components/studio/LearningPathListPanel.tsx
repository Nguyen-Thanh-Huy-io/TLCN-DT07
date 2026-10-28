'use client';
import { ContentStatus } from '@/constants/enums';

import React from 'react';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { LearningPathItem } from '@/services/entities/learning-path.service';

interface LearningPathListPanelProps {
  paths: LearningPathItem[];
  loading: boolean;
  onSelectPath: (id: string) => void;
  onCreatePath: () => void;
}

/** Danh sách mọi Lộ trình học (khóa học) — màn hình MẶC ĐỊNH của tab "Chương & nhóm".
 * Bấm vào 1 Lộ trình để sang màn chi tiết xem/sửa Chương của đúng lộ trình đó (List →
 * Detail), thay cho dropdown + hiện luôn Chương ngay dưới như trước — giúp dễ quét khi
 * có nhiều Lộ trình, và tách bạch rõ "chọn lộ trình" khỏi "sửa cấu trúc chương". */
export function LearningPathListPanel({ paths, loading, onSelectPath, onCreatePath }: LearningPathListPanelProps) {
  if (loading) {
    return <div className="py-12 text-center text-xs text-slate-400">Đang tải danh sách lộ trình...</div>;
  }

  if (paths.length === 0) {
    return (
      <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
        <p className="text-sm font-semibold text-slate-700">Chưa có lộ trình học nào</p>
        <p className="text-xs text-slate-400 mt-1">
          Tạo 1 lộ trình để bắt đầu gom các bài học thành khóa học có trình tự riêng.
        </p>
        <button type="button" onClick={onCreatePath} className="primary-button !h-8 !text-xs !px-4 mt-4">
          <Icon name={IconName.PLUS} size={12} />
          <span>Tạo lộ trình đầu tiên</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Lộ trình học</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mỗi lộ trình là 1 khóa học riêng, gồm các Chương được sắp xếp theo trình tự giảng dạy.
          </p>
        </div>
        <button type="button" onClick={onCreatePath} className="primary-button !h-7 !text-xs !px-3">
          <Icon name={IconName.PLUS} size={12} />
          <span>Tạo lộ trình</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paths.map((path) => {
          const chapterCount = path.chapters?.length || 0;
          const lessonCount = (path.chapters || []).reduce(
            (sum, c) => sum + (c.chapterLessons?.length || 0),
            0,
          );
          return (
            <button
              key={path.id}
              type="button"
              onClick={() => onSelectPath(path.id)}
              className="text-left border border-slate-200 rounded-lg p-4 bg-white hover:border-emerald-300 hover:shadow-2xs transition-all flex flex-col justify-between cursor-pointer"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      path.status === ContentStatus.PUBLISHED
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {path.status === ContentStatus.PUBLISHED ? 'Đã xuất bản' : 'Bản nháp'}
                  </span>
                  <Icon name={IconName.ARROW} size={13} className="text-slate-300 group-hover:text-emerald-600" />
                </div>

                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">{path.title}</h3>

                {path.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{path.description}</p>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">{chapterCount} chương</span>
                <span className="text-slate-300">&bull;</span>
                <span>{lessonCount} bài học</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
