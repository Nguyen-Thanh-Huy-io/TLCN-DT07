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
          // Keep live periods synced
        }
      })
      .catch(() => {
        // Fallback to rich default data
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
    <div className="curriculum-explorer-view space-y-3">
      {/* Top Header & Perspective Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-[#e2e5e8] rounded-xl p-2 px-3 shadow-2xs">
        <div className="flex items-center gap-3">
          {/* Integrated Clean Title */}
          <div className="flex items-center gap-2 border-r border-slate-200 pr-3 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h1 className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Chương trình học
            </h1>
          </div>

          {/* Perspective View Switcher: Niên đại vs Thể loại chuyên đề */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                perspective === 'CHRONOLOGICAL'
                  ? 'bg-[#1a385d] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              onClick={() => handleSwitchPerspective('CHRONOLOGICAL')}
              title="Học theo dòng thời gian các triều đại lịch sử"
            >
              <Icon name={IconName.CLOCK} size={13} />
              <span>Sơ đồ Cây Phân Cấp (Niên đại)</span>
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                perspective === 'THEMATIC'
                  ? 'bg-[#1a385d] text-white shadow-2xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
              onClick={() => handleSwitchPerspective('THEMATIC')}
              title="Học theo chuyên đề xuyên suốt: Quân sự, Cổ phục, Văn hóa, Huyền sử"
            >
              <Icon name={IconName.BOOK} size={13} />
              <span>Thể loại & Chuyên đề (Phi giai đoạn)</span>
            </button>
          </div>
        </div>

        {/* Quick Link Tools: Quản lý dạng bảng & Thêm mới */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 border-r border-slate-200 pr-2 mr-1">
            <button
              type="button"
              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1 transition-colors"
              onClick={() => router.push(APP_ROUTES.PERIODS.LIST)}
              title="Bảng quản lý danh sách Giai đoạn"
            >
              <Icon name={IconName.CLOCK} size={12} />
              <span>DS Giai đoạn</span>
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1 transition-colors"
              onClick={() => router.push(APP_ROUTES.TOPICS.LIST)}
              title="Bảng quản lý danh sách Chủ đề"
            >
              <Icon name={IconName.FOLDER} size={12} />
              <span>DS Chủ đề</span>
            </button>
            <button
              type="button"
              className="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-1 transition-colors"
              onClick={() => router.push(APP_ROUTES.LESSONS.LIST)}
              title="Bảng quản lý danh sách Bài học & Quiz"
            >
              <Icon name={IconName.BOOK} size={12} />
              <span>DS Bài học & Quiz</span>
            </button>
          </div>

          <button
            type="button"
            className="primary-button !h-8 !text-xs !bg-amber-500 hover:!bg-amber-600 !text-slate-950 font-bold px-3 rounded-lg flex items-center gap-1.5 shadow-2xs"
            onClick={handleAddPeriod}
          >
            <Icon name={IconName.PLUS} size={13} />
            <span>Thêm mục mới</span>
          </button>
        </div>
      </div>

      {/* Master-Detail 2-Column Resizable Grid (Full-Height Layout) */}
      <div
        id="curriculum-workspace-container"
        style={{
          display: 'grid',
          gridTemplateColumns: `${treeWidth}px 8px minmax(0, 1fr)`,
          gap: '8px',
          height: 'calc(100vh - 150px)',
          minHeight: '600px',
          userSelect: isDragging ? 'none' : 'auto',
        }}
      >
        {/* Left Column: Tree Explorer */}
        <div
          style={{
            height: '100%',
            minHeight: '600px',
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
          title="Kéo sang trái/phải để thay đổi độ rộng cây phân cấp (Nhấp đúp để đặt lại mặc định)"
        >
          <div className="resizer-line" />
        </div>

        {/* Right Column: Detail Workspace */}
        <div style={{ height: '100%', minHeight: '600px', minWidth: 0 }}>
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
