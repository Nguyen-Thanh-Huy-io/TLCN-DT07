'use client';
import React, { useState, useMemo } from 'react';
import { TopicItem } from '@/types/models/topic.type';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface LessonTopicModalPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (topicId: string) => void;
  topics: TopicItem[];
  selectedTopicId: string;
}

export function LessonTopicModalPicker({
  isOpen,
  onClose,
  onSelect,
  topics,
  selectedTopicId,
}: LessonTopicModalPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Bản đồ ID -> Topic để tính toán đường dẫn phân cấp (Breadcrumb)
  const topicMap = useMemo(() => {
    const map = new Map<string, TopicItem>();
    topics.forEach((t) => map.set(t.id, t));
    return map;
  }, [topics]);

  // Hàm tính toán Breadcrumb & độ sâu cấp bậc
  const getTopicMeta = (topic: TopicItem) => {
    const path: string[] = [];
    let curr: TopicItem | undefined = topic;
    let depth = 1;

    while (curr) {
      path.unshift(curr.name);
      if (curr.parentId) {
        curr = topicMap.get(curr.parentId);
        depth++;
      } else {
        break;
      }
    }

    const levelBadge =
      depth === 1
        ? { text: 'Chủ đề gốc', bg: 'bg-amber-50 text-amber-800 border-amber-200' }
        : { text: 'Chủ đề con', bg: 'bg-blue-50 text-blue-700 border-blue-200' };

    return {
      pathText: path.join(' > '),
      depth,
      levelBadge,
    };
  };

  // Lọc danh sách theo từ khóa tìm kiếm
  const filteredTopics = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return topics;
    return topics.filter((t) => {
      const matchName = t.name.toLowerCase().includes(term);
      const meta = getTopicMeta(t);
      const matchPath = meta.pathText.toLowerCase().includes(term);
      return matchName || matchPath;
    });
  }, [topics, searchTerm, topicMap]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Icon name={IconName.FOLDER} size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Chọn Chủ đề lịch sử cho bài học</h3>
              <p className="text-[11px] text-slate-500">
                Tìm kiếm và gán bài học vào đúng cây phân cấp chương trình
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 text-sm rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="p-3.5 border-b border-slate-100 bg-white">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Gõ tên chủ đề lịch sử, giai đoạn, trận đánh..."
              autoFocus
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-blue-500 transition shadow-2xs"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <Icon name={IconName.SEARCH} size={13} />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Danh sách chủ đề */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 divide-y divide-slate-50">
          {filteredTopics.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Không tìm thấy chủ đề nào phù hợp với từ khóa &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const meta = getTopicMeta(topic);
              const isSelected = topic.id === selectedTopicId;

              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    onSelect(topic.id);
                    onClose();
                  }}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex items-start justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-400 shadow-2xs'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border ${meta.levelBadge.bg}`}
                      >
                        {meta.levelBadge.text}
                      </span>
                      {topic.parentId && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[280px]">
                          {meta.pathText}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-snug break-words">
                      {topic.name}
                    </div>
                    {topic.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {topic.description}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <span className="shrink-0 text-blue-600 bg-blue-100 rounded-full p-1 mt-1">
                      <Icon name={IconName.CHECK} size={12} />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Tìm thấy {filteredTopics.length} chủ đề</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-medium transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
