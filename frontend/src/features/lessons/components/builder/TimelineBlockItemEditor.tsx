'use client';

import React, { useState } from 'react';
import { TimelineBlockData, TimelineOrientation } from '../../types/block-builder.types';
import { TimelineNode } from '../blocks/HistoricalTimelineBlock';
import { EventPickerModal, EventSelectionPayload, normalizePickedEvent } from '../blocks/EventPickerModal';
import { TimelineNodeCanvasDrawer } from './TimelineNodeCanvasDrawer';
import { TimelineLayoutStrategy } from '../../strategies/timeline-layout.strategy';
import { HistoricalEventItem } from '@/services/entities/historical-event.service';
import { TIMELINE_BLOCK_CONSTANTS } from '../../constants/block-node.constants';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { MoveDirection } from '../quiz/QuizQuestionEditors';

interface TimelineBlockItemEditorProps {
  data: TimelineBlockData;
  onChange: (updates: Partial<TimelineBlockData>) => void;
}

let nodeCounter = 0;
const getUniqueNodeId = () => {
  nodeCounter += 1;
  return `node_${Date.now()}_${nodeCounter}`;
};

export function TimelineBlockItemEditor({ data, onChange }: TimelineBlockItemEditorProps) {
  const [isEventPickerOpen, setIsEventPickerOpen] = useState(false);
  const [drawerNodeIdx, setDrawerNodeIdx] = useState<number | null>(null);

  // State thu gọn từng mốc sự kiện (Collapsible node state)
  const [collapsedNodes, setCollapsedNodes] = useState<Record<number, boolean>>({});

  const nodes = data.nodes || [];

  const handleUpdateNodes = (newNodes: TimelineNode[]) => {
    onChange({ nodes: newNodes });
  };

  const handleAddManualNode = () => {
    const newNode: TimelineNode = {
      id: getUniqueNodeId(),
      year: '1975',
      title: 'Mốc sự kiện mới',
      description: 'Nhập tóm tắt diễn biến và ý nghĩa lịch sử tại đây...',
    };
    handleUpdateNodes([...nodes, newNode]);
  };

  const handleSelectEvent = (event: HistoricalEventItem | EventSelectionPayload) => {
    const norm = normalizePickedEvent(event);
    const newNode: TimelineNode = {
      id: getUniqueNodeId(),
      year: String(norm.year || 'Lịch sử'),
      title: norm.title,
      description: norm.summary || 'Sự kiện lịch sử trọng đại.',
      eventId: norm.eventId,
    };
    handleUpdateNodes([...nodes, newNode]);
  };

  const handleNodeChange = (idx: number, field: keyof TimelineNode, val: string) => {
    const next = nodes.map((n, i) => (i === idx ? { ...n, [field]: val } : n));
    handleUpdateNodes(next);
  };

  const handleDeleteNode = (idx: number) => {
    if (nodes.length <= 1) {
      alert('Dòng thời gian cần có ít nhất một mốc sự kiện.');
      return;
    }
    handleUpdateNodes(nodes.filter((_, i) => i !== idx));
  };

  const handleMoveNode = (idx: number, direction: MoveDirection | 'UP' | 'DOWN') => {
    const targetIdx = direction === MoveDirection.UP ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= nodes.length) return;
    const copy = [...nodes];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    handleUpdateNodes(copy);
  };

  const toggleNodeCollapse = (idx: number) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const toggleAllCollapse = (collapseAll: boolean) => {
    const next: Record<number, boolean> = {};
    nodes.forEach((_, idx) => {
      next[idx] = collapseAll;
    });
    setCollapsedNodes(next);
  };

  const orientation = data.orientation || TimelineOrientation.VERTICAL;
  const isHorizontal = TimelineLayoutStrategy.isHorizontal(orientation);
  const layoutOpt = TimelineLayoutStrategy.getOption(orientation);

  const areAllCollapsed = nodes.length > 0 && nodes.every((_, idx) => collapsedNodes[idx]);

  return (
    <div data-testid="timeline-block-item-editor" className="space-y-3 font-sans">
      {/* Tiêu đề & Phụ đề */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={TIMELINE_BLOCK_CONSTANTS.TITLE}
          data-testid="input-timeline-title"
          className="flex-1 text-sm font-bold text-slate-800 uppercase px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <input
          type="text"
          value={data.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          placeholder={TIMELINE_BLOCK_CONSTANTS.DEFAULT_SUBTITLE}
          data-testid="input-timeline-subtitle"
          className="flex-1 text-sm font-serif font-bold text-slate-900 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Thanh tùy chọn hướng hiển thị & Thu gọn/Mở rộng mốc */}
      <div className="flex items-center justify-between pt-1 pb-1 border-b border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Hướng trục:
          </span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              data-testid="btn-timeline-orientation-vertical"
              onClick={() => onChange({ orientation: TimelineOrientation.VERTICAL })}
              className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                !isHorizontal
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>↕ Dọc</span>
            </button>
            <button
              type="button"
              data-testid="btn-timeline-orientation-horizontal"
              onClick={() => onChange({ orientation: TimelineOrientation.HORIZONTAL })}
              className={`px-2 py-0.5 rounded-md transition flex items-center gap-1 cursor-pointer ${
                isHorizontal
                  ? 'bg-white text-blue-700 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>↔ Ngang</span>
            </button>
          </div>
        </div>

        {/* Nút thu gọn / mở rộng nhanh toàn bộ mốc để quét dễ dàng */}
        <button
          type="button"
          onClick={() => toggleAllCollapse(!areAllCollapsed)}
          className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-md transition cursor-pointer flex items-center gap-1.5"
          title="Thu gọn để xem toàn bộ danh sách mốc dễ quét"
        >
          <span>{areAllCollapsed ? '▼ Mở rộng các mốc' : '▲ Thu gọn các mốc'}</span>
          <span className="text-[10px] text-slate-400">({nodes.length} mốc)</span>
        </button>
      </div>

      {/* Trục dòng thời gian */}
      <div className={layoutOpt.containerClass} data-timeline-orientation={orientation}>
        {nodes.map((n, idx) => {
          const isNodeCollapsed = collapsedNodes[idx] ?? false;

          return (
            <div
              key={n.id || idx}
              data-testid={`timeline-node-${idx}`}
              className={`${layoutOpt.nodeCardClass} transition-all duration-150 ${
                isNodeCollapsed ? '!pb-2 !pt-2 hover:bg-slate-50/80 cursor-pointer' : ''
              }`}
              onClick={isNodeCollapsed ? () => toggleNodeCollapse(idx) : undefined}
            >
              {/* Điểm tròn đánh dấu */}
              <div className={layoutOpt.nodeDotClass} />

              {/* Nút thao tác node */}
              <div
                className="absolute top-2 right-2 opacity-80 group-hover/node:opacity-100 transition-opacity flex items-center gap-1 bg-white p-0.5 rounded border border-slate-200 shadow-2xs z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Nút toggle thu gọn/mở rộng riêng mốc này — dùng chevron xoay (▶/▼), KHÔNG
                    dùng chung ký tự ▲ với nút "chuyển lên" bên dưới nữa, vì trước đây 2 nút
                    khác chức năng cùng hiện ký tự ▲ đứng sát nhau (rõ nhất ở mốc cuối: không
                    có nút "chuyển xuống" nên còn lại "▲ ▲ ✕" — không phân biệt được cái nào
                    thu gọn, cái nào di chuyển). */}
                <button
                  type="button"
                  onClick={() => toggleNodeCollapse(idx)}
                  title={isNodeCollapsed ? 'Mở rộng chi tiết mốc' : 'Thu gọn mốc'}
                  className="px-1 text-slate-600 hover:text-blue-700 cursor-pointer"
                >
                  <Icon
                    name={IconName.CHEVRON}
                    size={11}
                    className={`transition-transform ${isNodeCollapsed ? '' : 'rotate-90'}`}
                  />
                </button>

                <span className="w-px h-3 bg-slate-200" />

                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMoveNode(idx, 'UP')}
                    title={isHorizontal ? 'Di chuyển sang trái' : 'Chuyển lên'}
                    className="px-1 text-slate-500 hover:text-blue-600 cursor-pointer text-xs"
                  >
                    {isHorizontal ? '◀' : '▲'}
                  </button>
                )}
                {idx < nodes.length - 1 && (
                  <button
                    type="button"
                    onClick={() => handleMoveNode(idx, 'DOWN')}
                    title={isHorizontal ? 'Di chuyển sang phải' : 'Chuyển xuống'}
                    className="px-1 text-slate-500 hover:text-blue-600 cursor-pointer text-xs"
                  >
                    {isHorizontal ? '▶' : '▼'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDeleteNode(idx)}
                  title="Xóa mốc"
                  className="px-1 text-slate-400 hover:text-red-600 cursor-pointer text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Form sửa node: Nếu thu gọn thì chỉ hiển thị 1 dòng ngắn gọn */}
              {isNodeCollapsed ? (
                <div className="flex items-center gap-2 pr-20 select-none">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5 shrink-0">
                    {n.year || 'Năm'}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {n.title || 'Mốc sự kiện'}
                  </span>
                  {(n.mediaList?.length || 0) > 0 && (
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium shrink-0">
                      📷 {n.mediaList?.length}
                    </span>
                  )}
                  {n.detailContent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Có bài chi tiết" />
                  )}
                </div>
              ) : (
                <div className="space-y-2 pr-16 pt-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={n.year}
                      onChange={(e) => handleNodeChange(idx, 'year', e.target.value)}
                      placeholder={TIMELINE_BLOCK_CONSTANTS.YEAR_PLACEHOLDER}
                      className="w-24 text-sm font-bold text-blue-700 bg-blue-50/60 border border-blue-200/60 rounded px-2 py-1 focus:bg-white focus:outline-none"
                    />
                    <span className="text-slate-300">—</span>
                    <input
                      type="text"
                      value={n.title}
                      onChange={(e) => handleNodeChange(idx, 'title', e.target.value)}
                      placeholder={TIMELINE_BLOCK_CONSTANTS.TITLE_PLACEHOLDER}
                      className="flex-1 text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none px-1 py-1"
                    />
                  </div>
                  <textarea
                    rows={3}
                    value={n.description}
                    onChange={(e) => handleNodeChange(idx, 'description', e.target.value)}
                    placeholder={TIMELINE_BLOCK_CONSTANTS.DESC_PLACEHOLDER}
                    className="w-full text-sm leading-relaxed text-slate-600 bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none p-1.5 rounded"
                  />

                  {/* Nút mở Canvas chi tiết mốc (Ảnh/Video & Văn bản phân tích sâu) — thiết
                      kế lại thành 1 panel đầy đặn (icon + trạng thái rõ ràng + mũi tên mở),
                      thay cho pill nhỏ trước đây nhìn mờ nhạt, dễ bị bỏ sót giữa các field. */}
                  <button
                    type="button"
                    data-testid={`btn-open-node-canvas-${idx}`}
                    onClick={() => setDrawerNodeIdx(idx)}
                    className="w-full pt-2 flex items-center gap-3 p-2.5 bg-white hover:bg-blue-50/40 border border-slate-200 hover:border-blue-300 rounded-xl transition cursor-pointer text-left group/canvas-btn"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover/canvas-btn:bg-blue-100 transition">
                      <Icon name={IconName.GRID} size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900">Chi tiết Canvas</span>
                        {n.detailContent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Đã có bài phân tích chi tiết" />
                        )}
                      </div>
                      <span className="text-xs text-slate-500 truncate block">
                        {n.detailContent
                          ? `Đã có bài viết chi tiết${(n.mediaList?.length || 0) > 0 ? ` • ${n.mediaList?.length} tư liệu ảnh/video` : ''}`
                          : 'Chưa có nội dung — bấm để viết bài phân tích, chèn ảnh/video'}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-blue-700 group-hover/canvas-btn:text-blue-900 flex items-center gap-1 shrink-0">
                      <span>{n.detailContent ? 'Sửa' : 'Viết'}</span>
                      <Icon name={IconName.ARROW} size={12} />
                    </span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Nút thêm mốc */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handleAddManualNode}
          data-testid="btn-add-manual-node"
          className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
        >
          {TIMELINE_BLOCK_CONSTANTS.BTN_ADD_MANUAL}
        </button>
        <button
          type="button"
          onClick={() => setIsEventPickerOpen(true)}
          data-testid="btn-pick-timeline-event"
          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer flex items-center gap-1"
        >
          <Icon name={IconName.SEARCH} size={12} />
          <span>{TIMELINE_BLOCK_CONSTANTS.BTN_PICK_EVENT}</span>
        </button>
      </div>

      {/* Modal chọn Sự kiện từ kho dữ liệu */}
      <EventPickerModal
        isOpen={isEventPickerOpen}
        onClose={() => setIsEventPickerOpen(false)}
        onSelectEvent={handleSelectEvent}
      />

      {/* Drawer Canvas phân tích chi tiết cho mốc được chọn
          — trước đây thiếu `isOpen` nên component luôn tự return null (xem guard
          `if (!isOpen || !localNode) return null` trong TimelineNodeCanvasDrawer),
          và prop lưu bài sai tên (`onSave` thay vì `onSaveNode` thật của component). */}
      {drawerNodeIdx !== null && nodes[drawerNodeIdx] && (
        <TimelineNodeCanvasDrawer
          isOpen
          node={nodes[drawerNodeIdx]}
          onClose={() => setDrawerNodeIdx(null)}
          onSaveNode={(updatedNode) => {
            const next = nodes.map((n, i) => (i === drawerNodeIdx ? updatedNode : n));
            handleUpdateNodes(next);
          }}
        />
      )}
    </div>
  );
}
