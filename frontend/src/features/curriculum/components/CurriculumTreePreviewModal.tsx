'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { TopicApiService } from '@/services/entities/topic.service';
import {
  CurriculumTopicNode,
  CurriculumLessonNode,
} from '@/types/models/curriculum-tree.type';
import { DEFAULT_TOPIC_CURRICULUM_DATA } from '../data/curriculum-mock.data';
import { mapBackendTopicTreeToCurriculum } from '../utils/curriculum-mapper';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface CurriculumTreePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  highlightTopicId?: string;
  highlightLessonId?: string;
}

/**
 * Slide-over Drawer xem vị trí trong Cây tri thức
 * Tinh gọn, kích thước 420px, không tìm kiếm rườm rà
 * Tự động mở rộng & focus chính xác vào nhánh đang thao tác
 */
export function CurriculumTreePreviewModal({
  isOpen,
  onClose,
  title = 'Vị trí trong Cây tri thức',
  subtitle = 'Nhánh lộ trình của chủ đề / bài học này',
  highlightTopicId,
  highlightLessonId,
}: CurriculumTreePreviewModalProps) {
  const [treeData, setTreeData] = useState<CurriculumTopicNode[]>(DEFAULT_TOPIC_CURRICULUM_DATA);
  const [loading, setLoading] = useState(false);
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  // Tải dữ liệu cây phân cấp từ Backend API
  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await TopicApiService.getTopicTree();
      if (Array.isArray(res) && res.length > 0) {
        const mapped = mapBackendTopicTreeToCurriculum(res);
        setTreeData(mapped);

        // Tìm đường đi từ Root đến highlightTopicId để tự động bung mở (Auto-expand target branch)
        const newExpanded: Record<string, boolean> = {};
        const findAndExpandPath = (nodes: CurriculumTopicNode[], targetId: string): boolean => {
          for (const node of nodes) {
            if (node.id === targetId) {
              newExpanded[node.id] = true;
              return true;
            }
            if (node.children && node.children.length > 0) {
              if (findAndExpandPath(node.children, targetId)) {
                newExpanded[node.id] = true;
                return true;
              }
            }
          }
          return false;
        };

        if (highlightTopicId) {
          findAndExpandPath(mapped, highlightTopicId);
        } else if (mapped[0]) {
          newExpanded[mapped[0].id] = true;
        }

        setExpandedMap(newExpanded);
      } else {
        setTreeData(DEFAULT_TOPIC_CURRICULUM_DATA);
      }
    } catch (err) {
      console.warn('Cannot fetch topic tree, fallback to sample data:', err);
      setTreeData(DEFAULT_TOPIC_CURRICULUM_DATA);
    } finally {
      setLoading(false);
    }
  }, [highlightTopicId]);

  useEffect(() => {
    if (isOpen) {
      loadTree();
    }
  }, [isOpen, loadTree]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Render một nút chủ đề đệ quy
  const renderTopicNode = (topic: CurriculumTopicNode, depth: number = 0) => {
    const isTarget = topic.id === highlightTopicId;
    const hasChildren = (topic.children && topic.children.length > 0) || (topic.lessons && topic.lessons.length > 0);
    const isExpanded = expandedMap[topic.id] ?? false;

    return (
      <div key={topic.id} className="space-y-1">
        <div
          onClick={(e) => hasChildren && toggleExpand(topic.id, e)}
          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition select-none ${
            isTarget
              ? 'bg-blue-50/90 border-blue-400 font-bold text-blue-950 shadow-2xs ring-2 ring-blue-100'
              : 'bg-white border-slate-200/70 hover:bg-slate-50 text-slate-800'
          } ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
          style={{ marginLeft: `${depth * 14}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {hasChildren ? (
              <span className="text-[10px] text-slate-400 w-3 text-center shrink-0">
                {isExpanded ? '▼' : '▶'}
              </span>
            ) : (
              <span className="w-3 shrink-0" />
            )}

            <Icon
              name={depth === 0 ? IconName.FOLDER : IconName.BOOK}
              size={13}
              className={isTarget ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'}
            />

            <span className="truncate" title={topic.name}>
              {topic.name}
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {isTarget && (
              <span className="text-[9px] bg-blue-600 text-white font-semibold px-1.5 py-0.2 rounded shrink-0">
                Đang sửa
              </span>
            )}
            {topic.lessons && topic.lessons.length > 0 && (
              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded font-mono shrink-0">
                {topic.lessons.length} bài
              </span>
            )}
          </div>
        </div>

        {/* Render danh sách con và bài học nếu mở rộng */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {/* 1. Các chủ đề con */}
            {topic.children?.map((child) => renderTopicNode(child, depth + 1))}

            {/* 2. Các bài học trực thuộc */}
            {topic.lessons?.map((lesson: CurriculumLessonNode) => {
              const isLessonTarget = lesson.id === highlightLessonId;

              return (
                <div
                  key={lesson.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs transition ${
                    isLessonTarget
                      ? 'bg-emerald-50/90 border-emerald-400 font-bold text-emerald-950 shadow-2xs ring-2 ring-emerald-100'
                      : 'bg-slate-50/60 border-slate-200/50 text-slate-700'
                  }`}
                  style={{ marginLeft: `${(depth + 1) * 14}px` }}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="w-3 shrink-0 text-slate-300 text-center">•</span>
                    <span className="truncate" title={lesson.name}>
                      {lesson.name}
                    </span>
                  </div>

                  {isLessonTarget && (
                    <span className="text-[9px] bg-emerald-600 text-white font-semibold px-1.5 py-0.2 rounded shrink-0">
                      Bài học này
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div
        className="bg-white shadow-2xl border-l border-slate-200 w-full max-w-[420px] h-full flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Drawer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
              <Icon name={IconName.GRID} size={15} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 truncate">{title}</h3>
              <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Đóng (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Nội dung danh sách cây tinh gọn */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-slate-50/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Đang định vị vị trí...</span>
            </div>
          ) : treeData.length > 0 ? (
            treeData.map((root) => renderTopicNode(root, 0))
          ) : (
            <div className="text-center text-xs text-slate-400 py-10">
              Chưa có dữ liệu cây tri thức
            </div>
          )}
        </div>

        {/* Footer Drawer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Bấm ▶ để mở rộng các nhánh khác
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
