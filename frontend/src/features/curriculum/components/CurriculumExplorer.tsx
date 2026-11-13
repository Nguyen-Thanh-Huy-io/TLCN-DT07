'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CurriculumTopicNode, AnyCurriculumNode, CurriculumNodeType } from '@/types/models';
import { CurriculumTree } from './CurriculumTree';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { APP_ROUTES } from '@/constants/routes';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/enums';
import { TopicApiService } from '@/services/entities/topic.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { extractErrorMessage } from '@/services/api';
import { mapBackendTopicTreeToCurriculum } from '../utils/curriculum-mapper';
import { NodeDetailStrategyFactory, DetailStrategyCallbacks } from '../strategies/node-detail.strategy';

/** Breadcrumb của bài học: chủ đề gốc → (chủ đề con) → bài học. */
function lessonAncestors(lesson: AnyCurriculumNode & { topicId: string }, tree: CurriculumTopicNode[]): AnyCurriculumNode[] {
  for (const root of tree) {
    if (root.id === lesson.topicId) return [root, lesson];
    const sub = (root.subTopics || root.children || []).find((s) => s.id === lesson.topicId);
    if (sub) return [root, sub, lesson];
  }
  return [lesson];
}

/** Chuỗi tổ tiên của nút đang chọn, dùng cho breadcrumb ở khung chi tiết. */
function ancestorPath(node: AnyCurriculumNode, tree: CurriculumTopicNode[]): AnyCurriculumNode[] {
  if (node.type === CurriculumNodeType.LESSON) return lessonAncestors(node, tree);
  if (!node.parentId) return [node];
  const parent = tree.find((t) => t.id === node.parentId);
  return parent ? [parent, node] : [node];
}

export function CurriculumExplorer() {
  const router = useRouter();

  const [treeData, setTreeData] = useState<CurriculumTopicNode[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedNode, setSelectedNode] = useState<AnyCurriculumNode | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<AnyCurriculumNode | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Resizable Split Pane Logic
  const [treeWidth, setTreeWidth] = useState<number>(360);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Tải dữ liệu cây phân cấp thực tế từ Backend
  const loadTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await TopicApiService.getTopicTree();
      if (Array.isArray(res) && res.length > 0) {
        const mapped = mapBackendTopicTreeToCurriculum(res);
        setTreeData(mapped);
        setSelectedNode((prev) => {
          if (!prev) return mapped[0] || null;
          // Giữ node đang chọn nếu còn tồn tại
          const exists = mapped.some((m) => m.id === prev.id);
          return exists ? prev : mapped[0] || null;
        });
      } else {
        // Danh sách rỗng là trạng thái hợp lệ — không thay bằng dữ liệu mẫu giả.
        setTreeData([]);
      }
    } catch (err) {
      console.error('Lỗi tải cây chủ đề:', err);
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadTree();
    });
  }, [loadTree]);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = localStorage.getItem('hisgo_curriculum_tree_width');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (parsed >= 280 && parsed <= 720) {
          setTreeWidth(parsed);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById(
        'curriculum-workspace-container',
      );
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newWidth = e.clientX - rect.left;
      if (newWidth >= 280 && newWidth <= 720) {
        setTreeWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      localStorage.setItem('hisgo_curriculum_tree_width', String(treeWidth));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, treeWidth]);

  const handleStartDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleResetWidth = () => {
    setTreeWidth(360);
    localStorage.setItem('hisgo_curriculum_tree_width', '360');
  };

  // Tính toán chuỗi đường dẫn (Breadcrumb / Ancestors)
  const ancestors = useMemo(
    () => (selectedNode ? ancestorPath(selectedNode, treeData) : []),
    [selectedNode, treeData],
  );

  const handleSelectNode = (node: AnyCurriculumNode) => {
    setSelectedNode(node);
  };

  const handleAddTopic = (parentId?: string) => {
    if (parentId) {
      router.push(`${APP_ROUTES.TOPICS.CREATE}?parentId=${parentId}`);
    } else {
      router.push(APP_ROUTES.TOPICS.CREATE);
    }
  };

  const handleAddChildLesson = (_parentId: string, topicId: string) => {
    router.push(`${APP_ROUTES.LESSONS.CREATE}?topicId=${topicId}`);
  };

  const handleEditNode = (node: AnyCurriculumNode) => {
    switch (node.type) {
      case CurriculumNodeType.TOPIC:
        router.push(APP_ROUTES.TOPICS.DETAIL(node.id));
        break;
      case CurriculumNodeType.LESSON:
        // BUG cũ: thiếu `node.id` nên luôn mở trang Tạo bài học MỚI trống trơn thay vì
        // đúng bài học vừa bấm "Sửa" — đây chính là nguyên nhân "bấm vào không được".
        router.push(APP_ROUTES.LESSONS.DETAIL(node.id));
        break;
    }
  };

  const handleDeleteNode = (node: AnyCurriculumNode) => {
    setDeleteTarget(node);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      if (deleteTarget.type === CurriculumNodeType.TOPIC) {
        await TopicApiService.deleteTopic(deleteTarget.id);
      } else {
        await LessonApiService.deleteLesson(deleteTarget.id);
      }
      setSelectedNode(null);
      await loadTree();
    } catch (err) {
      setDeleteError(extractErrorMessage(err, 'Xoá thất bại.'));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="curriculum-explorer-view space-y-2.5">
      {/* Top Perspective & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2 px-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <h1 className="text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Chương trình học
            </h1>
          </div>

        </div>

        {/* Quick actions: Không còn nút Thêm Giai đoạn, vào thẳng Tạo Chủ đề.
            Đã bỏ nút "Quản lý Bảng" (từng trỏ sang /topics) — trang đó đã bị gỡ vì trùng
            với chính cây này (cùng 1 dữ liệu, chỉ khác dạng bảng phẳng vs cây). */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="primary-button !h-7 !text-xs !px-2.5"
            onClick={() => handleAddTopic()}
          >
            <Icon name={IconName.PLUS} size={12} />
            <span>Tạo Chủ đề</span>
          </button>
        </div>
      </div>

      {deleteError ? (
        <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {deleteError}
        </div>
      ) : null}

      {/* Master-Detail 2-Column Resizable Grid */}
      <div
        id="curriculum-workspace-container"
        style={{
          display: 'grid',
          gridTemplateColumns: `${treeWidth}px 6px minmax(0, 1fr)`,
          gap: '6px',
          height: 'calc(100vh - 145px)',
          minHeight: '580px',
          userSelect: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Left Column: Pure Topic-Centric Tree Explorer */}
        <div
          style={{
            height: '100%',
            minHeight: '580px',
            width: `${treeWidth}px`,
          }}
        >
          {loading && treeData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
              Đang tải cây chủ đề...
            </div>
          ) : (
            <CurriculumTree
              data={treeData}
              selectedNode={selectedNode}
              onSelectNode={handleSelectNode}
              onAddTopic={handleAddTopic}
              onAddLesson={(topicId) => handleAddChildLesson('', topicId)}
            />
          )}
        </div>

        {/* Resizer Divider Bar */}
        <div
          className={`curriculum-resizer-divider ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleStartDrag}
          onDoubleClick={handleResetWidth}
          title="Kéo sang trái/phải để điều chỉnh độ rộng (Nhấp đúp để đặt lại)"
        >
          <div className="resizer-line" />
        </div>

        {/* Right Column: Detail Workspace */}
        <div style={{ height: '100%', minHeight: '580px', minWidth: 0 }}>
          <CurriculumDetailPane
            selectedNode={selectedNode}
            ancestors={ancestors}
            callbacks={{
              onAddChildTopic: (parentId) => handleAddTopic(parentId),
              onAddChildLesson: handleAddChildLesson,
              onSelectNode: handleSelectNode,
              onEditNode: handleEditNode,
              onDeleteNode: handleDeleteNode,
            }}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget ? (
        <ConfirmDeleteModal
          isOpen={!!deleteTarget}
          title={deleteTarget.name}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      ) : null}
    </div>
  );
}

// --- CurriculumDetailPane.tsx ---
const BREADCRUMB_ICON_MAP: Record<CurriculumNodeType, IconName> = {
  [CurriculumNodeType.TOPIC]: IconName.FOLDER,
  [CurriculumNodeType.LESSON]: IconName.BOOK,
};

export interface CurriculumDetailPaneProps {
  selectedNode: AnyCurriculumNode | null;
  ancestors?: AnyCurriculumNode[];
  callbacks: DetailStrategyCallbacks;
}

export function CurriculumDetailPane({
  selectedNode,
  ancestors = [],
  callbacks,
}: CurriculumDetailPaneProps) {
  if (!selectedNode) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-2.5">
          <Icon name={IconName.FOLDER} size={20} />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">
          Chưa chọn mục nào
        </h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
          Chọn một giai đoạn, chủ đề hoặc bài học ở cây bên trái để xem và chỉnh sửa thông tin.
        </p>
      </div>
    );
  }

  const strategy = NodeDetailStrategyFactory.create(selectedNode);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-5 flex flex-col h-full">
      {/* Ancestor Trail Breadcrumb */}
      {ancestors.length > 0 && (
        <div className="ancestor-trail flex items-center gap-1 text-xs text-slate-500 mb-3 pb-2 border-b border-slate-100 flex-wrap">
          {ancestors.map((item, index) => {
            const isLast = index === ancestors.length - 1;
            return (
              <React.Fragment key={item.id}>
                {index > 0 && (
                  <Icon
                    name={IconName.CHEVRON}
                    size={10}
                    className="text-slate-300"
                  />
                )}
                <button
                  type="button"
                  className={`text-xs transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded ${
                    isLast
                      ? 'font-semibold text-slate-900 bg-slate-100'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  onClick={() => !isLast && callbacks.onSelectNode(item)}
                >
                  <Icon
                    name={BREADCRUMB_ICON_MAP[item.type as CurriculumNodeType] || IconName.BOOK}
                    size={12}
                    className={isLast ? 'text-slate-900' : 'text-slate-400'}
                  />
                  <span>{item.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {strategy.renderHeader()}
      {strategy.renderOverview()}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {strategy.renderChildList(callbacks)}
      </div>
      {strategy.renderActionButtons(callbacks)}
    </div>
  );
}
