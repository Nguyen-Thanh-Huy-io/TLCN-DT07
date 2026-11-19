'use client';

import React from 'react';
import {
  ChevronDown,
  FileText,
  ListTree,
  Palette,
  Plus,
  Star,
  SwatchBook,
  X,
} from 'lucide-react';
import {
  MAP_THEME_CONFIGS,
  MindmapEdgeStyle,
  MindmapInspectorTab,
  MindmapMapTheme,
  MindmapStructure,
  STRUCTURE_OPTIONS,
} from '../constants/mindmap.constants';
import type { MindmapGraph, MindmapNode } from '../services/mindmap.service';
import {
  MindmapNodeMarkersPanel,
  MindmapNodeNotesPanel,
  MindmapNodeStylePanel,
} from './MindmapNodeInspector';
import type { MindmapTreeModel } from '../utils/mindmap-tree.util';

function StructurePreviewSvg({ structure }: { structure: MindmapStructure }) {
  if (structure === MindmapStructure.ORG_CHART) {
    return (
      <svg viewBox="0 0 64 36" className="h-7 w-12 text-slate-600" fill="none">
        <rect x="23" y="3" width="18" height="7" rx="2" fill="currentColor" opacity="0.85" />
        <path d="M32 10 V17 M12 17 H52 M12 17 V23 M32 17 V23 M52 17 V23" stroke="currentColor" strokeWidth="1.6" />
        <rect x="5" y="23" width="14" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="25" y="23" width="14" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="45" y="23" width="14" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (structure === MindmapStructure.LOGIC_CHART) {
    return (
      <svg viewBox="0 0 64 36" className="h-7 w-12 text-slate-600" fill="none">
        <rect x="4" y="13" width="16" height="9" rx="2" fill="currentColor" opacity="0.85" />
        <path d="M20 17.5 C28 17.5 28 7 38 7 M20 17.5 H38 M20 17.5 C28 17.5 28 28 38 28" stroke="currentColor" strokeWidth="1.6" />
        <rect x="38" y="3" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="38" y="14" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
        <rect x="38" y="25" width="18" height="7" rx="2" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    );
  }
  if (structure === MindmapStructure.FISHBONE) {
    return (
      <svg viewBox="0 0 64 36" className="h-7 w-12 text-slate-600" fill="none">
        <rect x="4" y="14" width="14" height="8" rx="2" fill="currentColor" opacity="0.85" />
        <path d="M18 18 H58 M34 18 L24 7 M48 18 L38 7 M34 18 L24 29 M48 18 L38 29" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 36" className="h-7 w-12 text-slate-600" fill="none">
      <rect x="23" y="13" width="18" height="10" rx="2" fill="currentColor" opacity="0.85" />
      <path d="M23 18 C17 18 17 8 11 8 M23 18 C17 18 17 28 11 28 M41 18 C47 18 47 8 53 8 M41 18 C47 18 47 28 53 28" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2" y="5" width="11" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="25" width="11" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="51" y="5" width="11" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <rect x="51" y="25" width="11" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ThemeThumbnailSvg({ colors, bg }: { colors: readonly [string, string, string]; bg: string }) {
  return (
    <div style={{ backgroundColor: bg }} className="grid h-12 w-full place-items-center rounded-lg border border-slate-200/80 p-1">
      <svg viewBox="0 0 72 34" className="h-full w-full" fill="none">
        <path d="M36 17 C24 17 20 8 12 8 M36 17 C24 17 20 26 12 26 M36 17 C48 17 52 8 60 8 M36 17 C48 17 52 26 60 26" stroke={colors[1]} strokeWidth="2" />
        <rect x="26" y="12" width="20" height="10" rx="3" fill={colors[0]} />
        <rect x="3" y="4" width="13" height="7" rx="2" fill={colors[2]} stroke={colors[1]} strokeWidth="0.9" />
        <rect x="3" y="23" width="13" height="7" rx="2" fill={colors[2]} stroke={colors[1]} strokeWidth="0.9" />
        <rect x="56" y="4" width="13" height="7" rx="2" fill={colors[2]} stroke={colors[1]} strokeWidth="0.9" />
        <rect x="56" y="23" width="13" height="7" rx="2" fill={colors[2]} stroke={colors[1]} strokeWidth="0.9" />
      </svg>
    </div>
  );
}

function OutlineNodeRow({
  nodeId,
  depth,
  tree,
  selectedNodeId,
  onSelect,
  onAddChild,
}: {
  nodeId: string;
  depth: number;
  tree: MindmapTreeModel;
  selectedNodeId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  const node = tree.nodeMap.get(nodeId);
  if (!node) return null;
  const children = tree.childrenMap.get(nodeId) ?? [];
  const active = selectedNodeId === nodeId;

  return (
    <li>
      <div
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`group flex items-center justify-between gap-1 rounded-lg py-1.5 pr-2 text-xs transition ${
          active ? 'bg-blue-50 font-bold text-blue-800' : 'text-slate-700 hover:bg-slate-50'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelect(nodeId)}
          className="min-w-0 flex-1 truncate text-left cursor-pointer"
        >
          <span className="mr-1.5 text-[10px] text-slate-400">
            {depth === 0 ? '●' : '└'}
          </span>
          {node.title || 'Chưa đặt tên'}
        </button>
        <button
          type="button"
          onClick={() => onAddChild(nodeId)}
          title="Thêm nhánh con"
          className="rounded p-0.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-blue-100 hover:text-blue-700 cursor-pointer"
        >
          <Plus size={12} />
        </button>
      </div>
      {children.length > 0 && (
        <ul>
          {children.map((cId) => (
            <OutlineNodeRow
              key={cId}
              nodeId={cId}
              depth={depth + 1}
              tree={tree}
              selectedNodeId={selectedNodeId}
              onSelect={onSelect}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

const BG_SWATCHES = ['#FFFFFF', '#FAF6EA', '#F1F5F9', '#EFF6FF', '#FEFCE8', '#1F2128'];

/** Sidebar nổi bên phải giống MindMeister: Kiểu bản đồ / Thuộc tính Node / Mục lục cây. */
export function MindmapStyleSidebar({
  activeTab,
  onChangeTab,
  structure,
  mapTheme,
  balancedBranches,
  edgeStyle,
  customBgColor,
  showGrid,
  selectedNode,
  graph,
  tree,
  onUpdateGraphMeta,
  onUpdateNode,
  onAddChild,
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
  onSelectAndFocus,
  onOpenArticleInReader,
  onClose,
}: {
  activeTab: MindmapInspectorTab;
  onChangeTab: (tab: MindmapInspectorTab) => void;
  structure: MindmapStructure;
  mapTheme: MindmapMapTheme;
  balancedBranches: boolean;
  edgeStyle: MindmapEdgeStyle;
  customBgColor?: string;
  showGrid: boolean;
  selectedNode: MindmapNode | null;
  graph: MindmapGraph;
  tree: MindmapTreeModel;
  onUpdateGraphMeta: (patch: Partial<MindmapGraph>) => void;
  onUpdateNode: (nodeId: string, patch: Partial<MindmapNode>) => void;
  onAddChild: (parentId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onUpdateEdge: (edgeId: string, label: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onSelectAndFocus: (nodeId: string) => void;
  onOpenArticleInReader: (slug: string) => void;
  onClose: () => void;
}) {
  const [structOpen, setStructOpen] = React.useState(false);
  const currentStruct = STRUCTURE_OPTIONS.find((s) => s.id === structure) ?? STRUCTURE_OPTIONS[0];
  const nodeLevel = selectedNode ? tree.depthMap.get(selectedNode.id) ?? 1 : 1;

  const tabs: ReadonlyArray<{ id: MindmapInspectorTab; label: string; icon: typeof Palette }> = [
    { id: MindmapInspectorTab.NODE, label: 'Kiểu & Hình dáng Node', icon: Palette },
    { id: MindmapInspectorTab.MARKERS, label: 'Nhãn & Biểu tượng', icon: Star },
    { id: MindmapInspectorTab.STYLE, label: 'Chủ đề & Cấu trúc bản đồ', icon: SwatchBook },
    { id: MindmapInspectorTab.OUTLINE, label: 'Cấu trúc cây', icon: ListTree },
    { id: MindmapInspectorTab.NOTES, label: 'Ghi chú & Tư liệu HISGO', icon: FileText },
  ];
  const currentTabMeta = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <aside
      aria-label="Bảng thiết kế Sơ đồ tư duy"
      className="pointer-events-auto absolute right-3.5 top-4 bottom-4 z-30 flex w-72 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 shadow-lg backdrop-blur-xs sm:w-80 print:hidden"
    >
      {/* Hàng Tab Icon trên cùng khớp bố cục MindMeister */}
      <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2">
        <button
          type="button"
          onClick={onClose}
          title="Đóng bảng"
          className="grid size-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                title={tab.label}
                aria-label={tab.label}
                onClick={() => onChangeTab(tab.id)}
                className={`grid size-8 place-items-center rounded-xl transition cursor-pointer ${
                  active
                    ? 'bg-indigo-100 text-indigo-700 shadow-2xs'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {currentTabMeta.label}
      </div>

      {/* Nội dung Tab */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === MindmapInspectorTab.STYLE && (
          <div className="space-y-5 text-xs text-slate-700">
            {/* Bộ chọn Cấu trúc sơ đồ (Sơ đồ tư duy / Tổ chức / Cây logic / Xương cá) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setStructOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left hover:border-blue-400 cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <StructurePreviewSvg structure={structure} />
                  <div>
                    <div className="font-bold text-slate-800">{currentStruct.label}</div>
                    <div className="text-[10.5px] text-slate-500">{currentStruct.hint}</div>
                  </div>
                </div>
                <ChevronDown size={15} className={`text-slate-400 transition ${structOpen ? 'rotate-180' : ''}`} />
              </button>

              {structOpen && (
                <div className="grid grid-cols-1 gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-2">
                  {STRUCTURE_OPTIONS.map((opt) => {
                    const active = structure === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onUpdateGraphMeta({ structure: opt.id });
                          setStructOpen(false);
                        }}
                        className={`flex items-center gap-2.5 rounded-lg border p-2 text-left transition cursor-pointer ${
                          active
                            ? 'border-blue-500 bg-blue-50/80 text-blue-900'
                            : 'border-transparent bg-white hover:border-slate-200'
                        }`}
                      >
                        <StructurePreviewSvg structure={opt.id} />
                        <div className="min-w-0">
                          <div className="font-bold">{opt.label}</div>
                          <div className="truncate text-[10.5px] text-slate-500">{opt.hint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Lưới Chủ đề (Themes) 3 cột như ảnh mẫu */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <span className="block font-bold text-slate-600">Chủ đề</span>
              <div className="grid grid-cols-3 gap-2">
                {Object.values(MAP_THEME_CONFIGS).map((cfg) => {
                  const active = mapTheme === cfg.id;
                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      onClick={() => onUpdateGraphMeta({ mapTheme: cfg.id, customBgColor: undefined })}
                      title={cfg.label}
                      className={`group rounded-xl p-1 text-center transition cursor-pointer ${
                        active ? 'ring-2 ring-indigo-500 bg-indigo-50/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      <ThemeThumbnailSvg colors={cfg.previewColors} bg={cfg.canvasBg} />
                      <span className="mt-1 block truncate text-[10px] font-medium text-slate-600">
                        {cfg.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Màu nền canvas */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">Nền</span>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 cursor-pointer">
                  <input
                    type="color"
                    value={customBgColor ?? MAP_THEME_CONFIGS[mapTheme].canvasBg}
                    onChange={(e) => onUpdateGraphMeta({ customBgColor: e.target.value })}
                    className="h-6 w-10 cursor-pointer rounded border border-slate-200 bg-white p-0.5"
                  />
                </label>
              </div>
              <div className="flex items-center gap-2">
                {BG_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => onUpdateGraphMeta({ customBgColor: hex })}
                    style={{ backgroundColor: hex }}
                    className={`size-6 rounded-md border cursor-pointer ${
                      customBgColor === hex ? 'ring-2 ring-blue-500 border-blue-500' : 'border-slate-300'
                    }`}
                  />
                ))}
                {customBgColor && (
                  <button
                    type="button"
                    onClick={() => onUpdateGraphMeta({ customBgColor: undefined })}
                    className="text-[10.5px] font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    Mặc định
                  </button>
                )}
              </div>
            </div>

            {/* Kiểu bản đồ: Cân bằng các nút chính, Đường nối, Lưới */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <span className="block font-bold text-slate-600">Kiểu bản đồ</span>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Cân bằng các nút chính</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={balancedBranches}
                  onClick={() => onUpdateGraphMeta({ balancedBranches: !balancedBranches })}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                    balancedBranches ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block size-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                      balancedBranches ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700 font-medium">Hiện lưới chấm căn</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showGrid}
                  onClick={() => onUpdateGraphMeta({ showGrid: !showGrid })}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors cursor-pointer ${
                    showGrid ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block size-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
                      showGrid ? 'translate-x-4.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>

              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-slate-700">Kiểu đường nối</span>
                <select
                  value={edgeStyle}
                  onChange={(e) => onUpdateGraphMeta({ edgeStyle: e.target.value as MindmapEdgeStyle })}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value={MindmapEdgeStyle.AUTO}>Mặc định sơ đồ</option>
                  <option value={MindmapEdgeStyle.BEZIER}>Đường cong mượt</option>
                  <option value={MindmapEdgeStyle.STEP}>Vuông góc</option>
                  <option value={MindmapEdgeStyle.STRAIGHT}>Thẳng</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === MindmapInspectorTab.NODE && (
          selectedNode ? (
            <MindmapNodeStylePanel
              node={selectedNode}
              structure={structure}
              isRoot={selectedNode.id === tree.rootId}
              isLevel1={nodeLevel === 1}
              onChange={(patch) => onUpdateNode(selectedNode.id, patch)}
              onAddChild={() => onAddChild(selectedNode.id)}
              onDelete={() => onDeleteNode(selectedNode.id)}
            />
          ) : (
            <div className="grid h-48 place-items-center text-center text-xs text-slate-400">
              Nhấp vào một node trên sơ đồ để tuỳ biến hình dáng, văn bản, nhánh và hình ảnh.
            </div>
          )
        )}

        {activeTab === MindmapInspectorTab.MARKERS && (
          selectedNode ? (
            <MindmapNodeMarkersPanel
              node={selectedNode}
              onChange={(patch) => onUpdateNode(selectedNode.id, patch)}
            />
          ) : (
            <div className="grid h-48 place-items-center text-center text-xs text-slate-400">
              Nhấp vào một node để gắn biểu tượng đánh dấu, niên đại và thẻ nhãn.
            </div>
          )
        )}

        {activeTab === MindmapInspectorTab.NOTES && (
          selectedNode ? (
            <MindmapNodeNotesPanel
              node={selectedNode}
              edges={graph.edges}
              nodeMap={tree.nodeMap}
              onChange={(patch) => onUpdateNode(selectedNode.id, patch)}
              onUpdateEdge={onUpdateEdge}
              onDeleteEdge={onDeleteEdge}
              onOpenArticleInReader={onOpenArticleInReader}
            />
          ) : (
            <div className="grid h-48 place-items-center text-center text-xs text-slate-400">
              Nhấp vào một node để soạn ghi chú chi tiết và đính kèm tư liệu HISGO.
            </div>
          )
        )}

        {activeTab === MindmapInspectorTab.OUTLINE && (
          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-slate-500">
              Nhấn vào tên nhánh để căn giữa & chọn nhanh ({graph.nodes.length} node)
            </div>
            {tree.rootId && (
              <ul>
                <OutlineNodeRow
                  nodeId={tree.rootId}
                  depth={0}
                  tree={tree}
                  selectedNodeId={selectedNode?.id ?? null}
                  onSelect={onSelectAndFocus}
                  onAddChild={onAddChild}
                />
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
