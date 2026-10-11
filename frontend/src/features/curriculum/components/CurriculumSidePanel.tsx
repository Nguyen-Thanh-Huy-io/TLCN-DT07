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

export interface CurriculumSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  // Dữ liệu Real-time đang nhập từ form
  currentTopicTitle?: string;
  currentDisplayOrder?: number;
  highlightTopicId?: string;
  highlightLessonId?: string;
  onSelectDisplayOrder?: (order: number) => void;
}

/**
 * Side Panel Trợ lý Cây tri thức (Ask Gemini / Copilot Style)
 * Mở cố định ở mép phải, không che chắn form, Real-time sync theo từng phím gõ
 */
export function CurriculumSidePanel({
  isOpen,
  onClose,
  currentTopicTitle,
  currentDisplayOrder,
  highlightTopicId,
  highlightLessonId,
  onSelectDisplayOrder,
}: CurriculumSidePanelProps) {
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

        // Tự động bung mở nhánh liên quan (Auto-expand target branch)
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

    // Tên hiển thị thời gian thực (nếu đang sửa chủ đề này thì lấy currentTopicTitle)
    const displayName = isTarget && currentTopicTitle && currentTopicTitle.trim()
      ? currentTopicTitle.trim()
      : topic.name;

    return (
      <div key={topic.id} className="space-y-1">
        <div
          onClick={(e) => hasChildren && toggleExpand(topic.id, e)}
          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm transition select-none ${
            isTarget
              ? 'bg-blue-600 text-white font-bold border-blue-600 shadow-sm ring-2 ring-blue-200'
              : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800'
          } ${hasChildren ? 'cursor-pointer' : 'cursor-default'}`}
          style={{ marginLeft: `${depth * 14}px` }}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {hasChildren ? (
              <span className={`text-[10px] w-3 text-center shrink-0 ${isTarget ? 'text-blue-100' : 'text-slate-400'}`}>
                {isExpanded ? '▼' : '▶'}
              </span>
            ) : (
              <span className="w-3 shrink-0" />
            )}

            <Icon
              name={depth === 0 ? IconName.FOLDER : IconName.BOOK}
              size={15}
              className={isTarget ? 'text-blue-100 shrink-0' : 'text-slate-400 shrink-0'}
            />

            <span className="truncate" title={displayName}>
              {displayName}
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-1.5">
            {isTarget && (
              <span className="text-[10px] bg-white text-blue-700 font-bold px-1.5 py-0.5 rounded shadow-2xs">
                Đang sửa
              </span>
            )}
            {topic.lessons && topic.lessons.length > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-medium shrink-0 ${
                  isTarget ? 'bg-blue-700 text-blue-100' : 'bg-slate-100 text-slate-500'
                }`}
              >
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
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg border text-xs transition ${
                    isLessonTarget
                      ? 'bg-emerald-50 text-emerald-950 border-emerald-400 font-bold ring-2 ring-emerald-100'
                      : 'bg-slate-50/50 border-slate-200/50 text-slate-700'
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
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header Panel (Ask Gemini Style) */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50/90 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Icon name={IconName.GRID} size={15} />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-slate-900 truncate">
              Sơ đồ Cây tri thức
            </h3>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Đồng bộ thời gian thực theo form</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition cursor-pointer shrink-0"
          title="Đóng bảng phụ (Esc)"
        >
          ✕
        </button>
      </div>

      {/* Thông tin vị trí tóm tắt */}
      {currentDisplayOrder && (
        <div className="px-5 py-2.5 bg-blue-50/50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 font-medium shrink-0">
          <span>Vị trí thứ tự hiện tại:</span>
          <span className="font-mono font-bold bg-white border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
            #{String(currentDisplayOrder).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Thân danh sách Cây tri thức */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 bg-slate-50/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-400 text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Đang đồng bộ dữ liệu cây...</span>
          </div>
        ) : treeData.length > 0 ? (
          treeData.map((root) => renderTopicNode(root, 0))
        ) : (
          <div className="text-center text-xs text-slate-400 py-10">
            Chưa có dữ liệu cây tri thức
          </div>
        )}
      </div>

      {/* Footer Panel */}
      <div className="px-5 py-3 border-t border-slate-200 bg-white shrink-0 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-400">
          Bấm ▶ để mở rộng nhánh khác
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
  );
}
