'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurriculumPeriodNode,
  AnyCurriculumNode,
  CurriculumNodeType,
} from '@/types/models/curriculum-tree.type';
import { DEFAULT_CURRICULUM_DATA } from '../data/curriculum-mock.data';
import { CurriculumTree } from './CurriculumTree';
import { CurriculumDetailPane } from './CurriculumDetailPane';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { APP_ROUTES } from '@/constants/routes';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import api from '@/services/api';

export function CurriculumExplorer() {
  const router = useRouter();
  const [data, setData] = useState<CurriculumPeriodNode[]>(DEFAULT_CURRICULUM_DATA);
  const [selectedNode, setSelectedNode] = useState<AnyCurriculumNode | null>(
    DEFAULT_CURRICULUM_DATA[0],
  );

  const [deleteTarget, setDeleteTarget] = useState<AnyCurriculumNode | null>(null);

  // Resizable Split Pane Logic
  const [treeWidth, setTreeWidth] = useState<number>(380);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
    // Load persisted width from localStorage
    const saved = localStorage.getItem('hisgo_curriculum_tree_width');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (parsed >= 280 && parsed <= 720) {
        setTreeWidth(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById('curriculum-workspace-container');
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
    setTreeWidth(380);
    localStorage.setItem('hisgo_curriculum_tree_width', '380');
  };

  // Calculate Ancestor Trail for the selected node
  const ancestors = React.useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.type === CurriculumNodeType.PERIOD) {
      return [selectedNode];
    }
    if (selectedNode.type === CurriculumNodeType.TOPIC) {
      const period = data.find((p) => p.id === selectedNode.periodId);
      return period ? [period, selectedNode] : [selectedNode];
    }
    if (selectedNode.type === CurriculumNodeType.LESSON) {
      const period = data.find((p) => p.id === selectedNode.periodId);
      const topic = period?.topics.find((t) => t.id === selectedNode.topicId);
      const trail = [];
      if (period) trail.push(period);
      if (topic) trail.push(topic);
      trail.push(selectedNode);
      return trail;
    }
    return [selectedNode];
  }, [selectedNode, data]);

  useEffect(() => {
    // Optionally fetch live hierarchy if API supports it
    api
      .get('/periods')
      .then((res) => {
        const livePeriods = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        if (livePeriods.length > 0) {
          // Merge live period data with mock topics/lessons if API does not return full tree yet
        }
      })
      .catch(() => {
        // Fallback to rich default data
      });
  }, []);

  const handleSelectNode = (node: AnyCurriculumNode) => {
    setSelectedNode(node);
  };

  const handleAddPeriod = () => {
    router.push(APP_ROUTES.PERIODS.CREATE);
  };

  const handleAddChildTopic = (periodId: string) => {
    router.push(`${APP_ROUTES.TOPICS.CREATE}?periodId=${periodId}`);
  };

  const handleAddChildLesson = (periodId: string, topicId: string) => {
    router.push(
      `${APP_ROUTES.LESSONS.CREATE}?periodId=${periodId}&topicId=${topicId}`,
    );
  };

  const handleEditNode = (node: AnyCurriculumNode) => {
    switch (node.type) {
      case CurriculumNodeType.PERIOD:
        router.push(APP_ROUTES.PERIODS.LIST);
        break;
      case CurriculumNodeType.TOPIC:
        router.push(APP_ROUTES.TOPICS.LIST);
        break;
      case CurriculumNodeType.LESSON:
        router.push(APP_ROUTES.LESSONS.CREATE);
        break;
    }
  };

  const handleDeleteNode = (node: AnyCurriculumNode) => {
    setDeleteTarget(node);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === CurriculumNodeType.PERIOD) {
      setData((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSelectedNode(null);
    } else if (deleteTarget.type === CurriculumNodeType.TOPIC) {
      setData((prev) =>
        prev.map((p) => ({
          ...p,
          topics: p.topics.filter((t) => t.id !== deleteTarget.id),
        })),
      );
      setSelectedNode(null);
    } else if (deleteTarget.type === CurriculumNodeType.LESSON) {
      setData((prev) =>
        prev.map((p) => ({
          ...p,
          topics: p.topics.map((t) => ({
            ...t,
            lessons: t.lessons.filter((l) => l.id !== deleteTarget.id),
          })),
        })),
      );
      setSelectedNode(null);
    }

    setDeleteTarget(null);
  };

  return (
    <div className="curriculum-explorer-view space-y-4">
      {/* Top Navigation & View Switcher Bar */}
      <div className="flex items-center justify-between bg-white border border-[#e2e5e8] rounded-xl p-2.5 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1a385d] text-white flex items-center gap-2 shadow-sm"
          >
            <Icon name={IconName.GRID} size={14} />
            <span>Sơ đồ Cây Phân Cấp</span>
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
            onClick={() => router.push(APP_ROUTES.PERIODS.LIST)}
          >
            <Icon name={IconName.CLOCK} size={14} />
            <span>DS Giai đoạn</span>
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
            onClick={() => router.push(APP_ROUTES.TOPICS.LIST)}
          >
            <Icon name={IconName.FOLDER} size={14} />
            <span>DS Chủ đề</span>
          </button>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 flex items-center gap-1.5 transition-colors"
            onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
          >
            <Icon name={IconName.BOOK} size={14} />
            <span>DS Bài học & Quiz</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="primary-button !h-9 !text-xs !bg-amber-500 hover:!bg-amber-600 !text-gray-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm"
            onClick={handleAddPeriod}
          >
            <Icon name={IconName.PLUS} size={14} />
            <span>Thêm giai đoạn mới</span>
          </button>
        </div>
      </div>

      {/* Master-Detail 2-Column Resizable Grid */}
      <div
        id="curriculum-workspace-container"
        style={{
          display: 'grid',
          gridTemplateColumns: `${treeWidth}px 8px minmax(0, 1fr)`,
          gap: '8px',
          minHeight: 'calc(100vh - 240px)',
          userSelect: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Left Column: Tree Explorer */}
        <div style={{ height: 'calc(100vh - 240px)', minHeight: '580px', width: `${treeWidth}px` }}>
          <CurriculumTree
            data={data}
            selectedNode={selectedNode}
            onSelectNode={handleSelectNode}
            onAddPeriod={handleAddPeriod}
            onAddTopic={handleAddChildTopic}
            onAddLesson={handleAddChildLesson}
          />
        </div>

        {/* Resizer Divider Bar */}
        <div
          className={`curriculum-resizer-divider ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleStartDrag}
          onDoubleClick={handleResetWidth}
          title="Kéo sang trái/phải để thay đổi độ rộng cây phân cấp (Nhấp đúp để đặt lại mặc định)"
        >
          <div className="resizer-line" />
        </div>

        {/* Right Column: Detail Workspace */}
        <div style={{ height: 'calc(100vh - 240px)', minHeight: '580px', minWidth: 0 }}>
          <CurriculumDetailPane
            selectedNode={selectedNode}
            ancestors={ancestors}
            callbacks={{
              onAddChildTopic: handleAddChildTopic,
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
