'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CurriculumPeriodNode,
  AnyCurriculumNode,
  CurriculumNodeType,
} from '@/types/models/curriculum-tree.type';
import {
  DEFAULT_CURRICULUM_DATA,
  THEMATIC_CURRICULUM_DATA,
} from '../data/curriculum-mock.data';
import { CurriculumTree } from './CurriculumTree';
import { CurriculumDetailPane } from './CurriculumDetailPane';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { APP_ROUTES } from '@/constants/routes';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import api from '@/services/api';

export type CurriculumPerspectiveMode = 'CHRONOLOGICAL' | 'THEMATIC';

export function CurriculumExplorer() {
  const router = useRouter();
  const [perspective, setPerspective] =
    useState<CurriculumPerspectiveMode>('CHRONOLOGICAL');

  const [chronologicalData, setChronologicalData] =
    useState<CurriculumPeriodNode[]>(DEFAULT_CURRICULUM_DATA);
  const [thematicData, setThematicData] =
    useState<CurriculumPeriodNode[]>(THEMATIC_CURRICULUM_DATA);

  const currentData =
    perspective === 'CHRONOLOGICAL' ? chronologicalData : thematicData;

  const [selectedNode, setSelectedNode] = useState<AnyCurriculumNode | null>(
    DEFAULT_CURRICULUM_DATA[0],
  );

  const [deleteTarget, setDeleteTarget] =
    useState<AnyCurriculumNode | null>(null);

  // Resizable Split Pane Logic
  const [treeWidth, setTreeWidth] = useState<number>(360);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  useEffect(() => {
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

  // Calculate Ancestor Trail for the selected node
  const ancestors = React.useMemo(() => {
    if (!selectedNode) return [];
    if (selectedNode.type === CurriculumNodeType.PERIOD) {
      return [selectedNode];
    }
    if (selectedNode.type === CurriculumNodeType.TOPIC) {
      const period = currentData.find((p) => p.id === selectedNode.periodId);
      return period ? [period, selectedNode] : [selectedNode];
    }
    if (selectedNode.type === CurriculumNodeType.LESSON) {
      const period = currentData.find((p) => p.id === selectedNode.periodId);
      const topic = period?.topics.find((t) => t.id === selectedNode.topicId);
      const trail = [];
      if (period) trail.push(period);
      if (topic) trail.push(topic);
      trail.push(selectedNode);
      return trail;
    }
    return [selectedNode];
  }, [selectedNode, currentData]);

  useEffect(() => {
    api
      .get('/periods')
      .then((res) => {
        const livePeriods = Array.isArray(res.data)
          ? res.data
          : res.data?.data || [];
        if (livePeriods.length > 0) {
          // Keep live synced
        }
      })
      .catch(() => {
        // Fallback to mock data
      });
  }, []);

  const handleSwitchPerspective = (nextMode: CurriculumPerspectiveMode) => {
    setPerspective(nextMode);
    if (nextMode === 'CHRONOLOGICAL') {
      setSelectedNode(chronologicalData[0] || null);
    } else {
      setSelectedNode(thematicData[0] || null);
    }
  };

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

    const updater =
      perspective === 'CHRONOLOGICAL'
        ? setChronologicalData
        : setThematicData;

    if (deleteTarget.type === CurriculumNodeType.PERIOD) {
      updater((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSelectedNode(null);
    } else if (deleteTarget.type === CurriculumNodeType.TOPIC) {
      updater((prev) =>
        prev.map((p) => ({
          ...p,
          topics: p.topics.filter((t) => t.id !== deleteTarget.id),
        })),
      );
      setSelectedNode(null);
    } else if (deleteTarget.type === CurriculumNodeType.LESSON) {
      updater((prev) =>
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
    <div className="curriculum-explorer-view space-y-2.5">
      {/* Sleek Top Perspective & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg p-2 px-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            <h1 className="text-xs font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Chương trình học
            </h1>
          </div>

          {/* Perspective View Switcher */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              type="button"
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                perspective === 'CHRONOLOGICAL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
              onClick={() => handleSwitchPerspective('CHRONOLOGICAL')}
              title="Cấu trúc theo dòng thời gian các thời kỳ lịch sử"
            >
              <Icon name={IconName.CLOCK} size={12} />
              <span>Theo Niên đại</span>
            </button>
            <button
              type="button"
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all ${
                perspective === 'THEMATIC'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
              onClick={() => handleSwitchPerspective('THEMATIC')}
              title="Cấu trúc theo thể loại, chuyên đề độc lập"
            >
              <Icon name={IconName.BOOK} size={12} />
              <span>Theo Chuyên đề</span>
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="secondary-button !h-7 !text-xs !px-2.5"
            onClick={() => router.push(APP_ROUTES.TOPICS.LIST)}
            title="Xem danh sách chủ đề dạng bảng"
          >
            <Icon name={IconName.FOLDER} size={12} />
            <span>Quản lý Bảng</span>
          </button>
          <button
            type="button"
            className="primary-button !h-7 !text-xs !px-2.5"
            onClick={handleAddPeriod}
          >
            <Icon name={IconName.PLUS} size={12} />
            <span>Thêm Giai đoạn</span>
          </button>
        </div>
      </div>

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
        {/* Left Column: Tree Explorer */}
        <div
          style={{
            height: '100%',
            minHeight: '580px',
            width: `${treeWidth}px`,
          }}
        >
          <CurriculumTree
            data={currentData}
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
