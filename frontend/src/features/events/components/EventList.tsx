'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import {
  ContentStatus,
  EventCategory,
  EVENT_CATEGORY_LABELS,
} from '@/constants/enums';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { APP_ROUTES } from '@/constants/routes';
import {
  HistoricalEventApiService,
  HistoricalEventItem,
} from '@/services/entities/historical-event.service';
import api, { extractErrorMessage } from '@/services/api';
import { formatHistoricalYear } from '@/utils/history-year.utils';

interface PeriodFilterOption {
  id: string;
  name: string;
}

interface TreeEventNode {
  item: HistoricalEventItem;
  level: number;
  children: TreeEventNode[];
  childCount: number;
  parentTitle?: string;
}

export function EventList() {
  const router = useRouter();
  const [eventsList, setEventsList] = useState<HistoricalEventItem[]>([]);
  const [periods, setPeriods] = useState<PeriodFilterOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Chế độ xem: 'TREE' (Bảng cây phân cấp) | 'TREE_VIEW' (Sơ đồ cây nhánh thư mục như image.png) | 'FLAT' (Danh sách phẳng)
  const [viewMode, setViewMode] = useState<'TREE' | 'TREE_VIEW' | 'FLAT'>('TREE');

  // Bộ lọc
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContentStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | EventCategory>('ALL');
  const [topLevelOnly, setTopLevelOnly] = useState<boolean>(false);

  // Trạng thái mở rộng các nhánh cây
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Modal xóa
  const [deletingEvent, setDeletingEvent] = useState<HistoricalEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  const fetchReferenceData = useCallback(async () => {
    try {
      const pRes = await api.get('/periods?limit=100');
      const pItems = Array.isArray(pRes.data)
        ? pRes.data
        : pRes.data?.items || [];
      setPeriods(pItems.map((p: any) => ({ id: p.id, name: p.name })));
    } catch (err) {
      console.warn('Could not load periods for filter:', err);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await HistoricalEventApiService.getEvents({ limit: 100 });
      const items = res.items || [];
      setEventsList(items);

      // Mặc định mở rộng tất cả các sự kiện cha có con
      const parentIdsWithChildren = new Set<string>();
      items.forEach((item) => {
        if (item.parentId) {
          parentIdsWithChildren.add(item.parentId);
        }
      });
      setExpandedIds(parentIdsWithChildren);
    } catch (err) {
      console.error('Failed to load historical events:', err);
      setEventsList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReferenceData();
    fetchEvents();
  }, [fetchReferenceData, fetchEvents]);

  const handleNavigateCreate = () => {
    router.push(APP_ROUTES.EVENTS.CREATE);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allParentIds = new Set<string>();
    eventsList.forEach((e) => {
      if ((e._count?.children && e._count.children > 0) || eventsList.some((child) => child.parentId === e.id)) {
        allParentIds.add(e.id);
      }
    });
    setExpandedIds(allParentIds);
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleDeletePrompt = (item: HistoricalEventItem) => {
    setDeleteErrorMessage(null);
    setDeletingEvent(item);
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;

    // Kiểm tra phía Client trước khi gọi backend
    const hasChildren =
      (deletingEvent._count?.children && deletingEvent._count.children > 0) ||
      eventsList.some((e) => e.parentId === deletingEvent.id);

    if (hasChildren) {
      const count =
        deletingEvent._count?.children ||
        eventsList.filter((e) => e.parentId === deletingEvent.id).length;
      setDeleteErrorMessage(
        `Không thể xóa sự kiện cha này vì đang có ${count} sự kiện thành phần con trực thuộc. Vui lòng chuyển hoặc xóa các sự kiện con trước.`,
      );
      return;
    }

    try {
      setIsDeleting(true);
      await HistoricalEventApiService.deleteEvent(deletingEvent.id);
      setEventsList((prev) => prev.filter((e) => e.id !== deletingEvent.id));
      setDeletingEvent(null);
    } catch (err) {
      console.error('Failed to delete historical event:', err);
      setDeleteErrorMessage(extractErrorMessage(err, 'Không thể xóa sự kiện lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Lọc dữ liệu danh sách phẳng ban đầu
  const filteredEvents = useMemo(() => {
    return eventsList.filter((item) => {
      // 1. Lọc theo trạng thái
      if (statusFilter !== 'ALL' && (item.status || ContentStatus.PUBLISHED) !== statusFilter) {
        return false;
      }
      // 2. Lọc theo Thời kỳ
      if (selectedPeriodId !== 'ALL') {
        const itemPeriodId = item.periodId || item.topic?.periodId;
        if (itemPeriodId !== selectedPeriodId) {
          return false;
        }
      }
      // 3. Lọc chỉ xem cấp cao nhất (topLevelOnly)
      if (topLevelOnly && Boolean(item.parentId)) {
        return false;
      }
      // 4. Lọc theo từ khóa tìm kiếm
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const locName = item.historicalLocation?.name || (item.metadata?.rawLocation as string) || '';
        const matchesSelf =
          item.title.toLowerCase().includes(q) ||
          locName.toLowerCase().includes(q) ||
          (item.summary && item.summary.toLowerCase().includes(q));
        if (!matchesSelf) {
          // Kiểm tra xem có phải là cha của một con khớp tìm kiếm không
          const hasMatchingChild = eventsList.some(
            (c) =>
              c.parentId === item.id &&
              (c.title.toLowerCase().includes(q) ||
                ((c.historicalLocation?.name || (c.metadata?.rawLocation as string) || '').toLowerCase().includes(q))),
          );
          if (!hasMatchingChild) return false;
        }
      }
      return true;
    });
  }, [eventsList, statusFilter, selectedPeriodId, topLevelOnly, searchQuery]);

  // Xây dựng Cấu trúc Cây Phân cấp (Tree Structure)
  const treeNodes: TreeEventNode[] = useMemo(() => {
    const itemMap = new Map<string, HistoricalEventItem>();
    eventsList.forEach((e) => itemMap.set(e.id, e));

    const childrenMap = new Map<string, HistoricalEventItem[]>();
    eventsList.forEach((e) => {
      if (e.parentId) {
        const list = childrenMap.get(e.parentId) || [];
        list.push(e);
        childrenMap.set(e.parentId, list);
      }
    });

    const buildNode = (item: HistoricalEventItem, level: number): TreeEventNode => {
      const rawChildren = childrenMap.get(item.id) || [];
      const childrenNodes = rawChildren
        .filter((child) => {
          // Đảm bảo con cũng thỏa mãn bộ lọc trạng thái và thời kỳ nếu đang bật
          if (statusFilter !== 'ALL' && (child.status || ContentStatus.PUBLISHED) !== statusFilter) {
            return false;
          }
          if (selectedPeriodId !== 'ALL') {
            const childPeriodId = child.periodId || child.topic?.periodId;
            if (childPeriodId && childPeriodId !== selectedPeriodId) {
              return false;
            }
          }
          return true;
        })
        .map((child) => buildNode(child, level + 1));

      return {
        item,
        level,
        children: childrenNodes,
        childCount: childrenNodes.length,
        parentTitle: item.parentId ? itemMap.get(item.parentId)?.title : undefined,
      };
    };

    // Sự kiện gốc là những sự kiện không có parentId, hoặc parentId không nằm trong danh sách
    const rootItems = filteredEvents.filter(
      (e) => !e.parentId || !itemMap.has(e.parentId),
    );

    return rootItems.map((root) => buildNode(root, 0));
  }, [eventsList, filteredEvents, statusFilter, selectedPeriodId]);

  // Hàm render đệ quy các cấp Sự kiện theo phong cách nhánh cây thư mục chuẩn giao diện image.png
  const renderEventTreeNode = (node: TreeEventNode, depth: number = 0) => {
    const item = node.item;
    const isExpanded = expandedIds.has(item.id);
    const hasChildren = node.children.length > 0;
    const isRoot = depth === 0;

    return (
      <div key={item.id} className="event-tree-branch space-y-1">
        {/* Thanh hàng node cây */}
        <div
          className={`flex items-center justify-between transition-colors ${
            isRoot
              ? 'p-2.5 px-3.5 rounded-xl border border-blue-100 bg-[#F0F6FF] text-slate-900 shadow-2xs font-semibold'
              : 'p-2 px-3 rounded-lg hover:bg-slate-50 text-slate-700 transition'
          }`}
          style={{ marginLeft: `${depth * 18}px` }}
        >
          {/* Cụm Trái: Mũi tên đóng/mở + Icon Thư mục + Tên sự kiện (Kèm năm) */}
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
                }}
                className={`p-0.5 rounded hover:bg-slate-200/80 text-slate-500 transition-transform cursor-pointer ${
                  isExpanded ? 'rotate-90' : ''
                }`}
                title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
              >
                <Icon name={IconName.CHEVRON} size={13} />
              </button>
            ) : (
              <span className="w-4 inline-block" />
            )}

            <Icon
              name={IconName.FOLDER}
              size={isRoot ? 16 : 14}
              className={
                isRoot
                  ? 'text-slate-700 shrink-0'
                  : 'text-slate-400 shrink-0'
              }
            />

            <Link
              href={APP_ROUTES.EVENTS.DETAIL(item.id)}
              className={`truncate hover:text-blue-700 hover:underline transition ${
                isRoot ? 'text-[13px] font-bold text-slate-900' : 'text-xs font-medium text-slate-800'
              }`}
              title={item.title}
            >
              {item.title}
              {item.startYear ? ` (${item.endYear && item.endYear !== item.startYear ? `${item.startYear} – ${item.endYear}` : item.startYear})` : ''}
            </Link>

            {item.category && (
              <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80 shrink-0 hidden sm:inline-block">
                {EVENT_CATEGORY_LABELS[item.category] || item.category}
              </span>
            )}
          </div>

          {/* Cụm Phải: Số lượng con (5 con / 2 chuyên đề / 1 bài) + Nút thao tác */}
          <div className="flex items-center gap-3 shrink-0 ml-2">
            <span className="text-xs text-slate-400 font-mono">
              {hasChildren ? `${node.children.length} con` : '1 bài'}
            </span>

            <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100">
              <Link
                href={APP_ROUTES.EVENTS.DETAIL(item.id)}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-50 transition"
              >
                Sửa
              </Link>
              <button
                type="button"
                onClick={() => handleDeletePrompt(item)}
                className="text-[11px] font-medium text-rose-600 hover:text-rose-800 px-2 py-0.5 rounded border border-rose-200 bg-white hover:bg-rose-50 transition cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>

        {/* Khối con hiển thị lồng nhau có đường kẻ trục dọc (border-l) */}
        {hasChildren && isExpanded && !topLevelOnly && (
          <div className="event-tree-subcontainer ml-4 pl-3.5 border-l border-slate-200/90 my-1 space-y-1">
            {node.children.map((child) => renderEventTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const publishedCount = eventsList.filter(
    (e) => (e.status || ContentStatus.PUBLISHED) === ContentStatus.PUBLISHED,
  ).length;
  const draftCount = eventsList.filter(
    (e) => e.status === ContentStatus.DRAFT,
  ).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Quản lý Sự kiện */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Quản lý sự kiện
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 font-bold">
              {eventsList.length} sự kiện
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sự kiện lịch sử • Phân cấp và diễn biến
          </p>
        </div>

        <button
          type="button"
          onClick={handleNavigateCreate}
          className="px-4 py-2.5 rounded-full bg-[#5C3D1E] hover:bg-[#432c15] text-white font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
        >
          <span>+</span>
          <span>Thêm sự kiện</span>
        </button>
      </div>

      {/* 2. Thanh Điều khiển, Lọc & Chuyển đổi Chế độ Xem */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Ô tìm kiếm */}
          <div className="relative min-w-[280px] flex-1 max-w-md">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện, địa điểm, diễn biến..."
              className="w-full text-xs pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 focus:bg-white focus:ring-2 focus:ring-amber-100 transition"
            />
          </div>

          {/* Bộ chuyển đổi chế độ xem: Cây phân cấp | Danh sách phẳng */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('TREE')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'TREE'
                    ? 'bg-[#EFE3C8] text-[#5C3D1E] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bảng phân cấp
              </button>
              <button
                type="button"
                onClick={() => setViewMode('TREE_VIEW')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'TREE_VIEW'
                    ? 'bg-[#EFE3C8] text-[#5C3D1E] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sơ đồ cây
              </button>
              <button
                type="button"
                onClick={() => setViewMode('FLAT')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                  viewMode === 'FLAT'
                    ? 'bg-[#EFE3C8] text-[#5C3D1E] shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Danh sách phẳng
              </button>
            </div>
          </div>
        </div>

        {/* Dải bộ lọc: Thời kỳ, Trạng thái, Checkbox cấp cao nhất, Thao tác cây */}
        <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Lọc theo Thời kỳ */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Thời kỳ:</span>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">Tất cả thời kỳ</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc theo Trạng thái */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-600">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL">Tất cả ({eventsList.length})</option>
                <option value={ContentStatus.PUBLISHED}>
                  Đã xuất bản ({publishedCount})
                </option>
                <option value={ContentStatus.DRAFT}>
                  Bản nháp ({draftCount})
                </option>
              </select>
            </div>

            {/* Checkbox Chỉ xem cấp cao nhất */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 font-medium select-none">
              <input
                type="checkbox"
                checked={topLevelOnly}
                onChange={(e) => setTopLevelOnly(e.target.checked)}
                className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500 border-slate-300 cursor-pointer"
              />
              <span>Chỉ xem cấp cao nhất</span>
            </label>
          </div>

          {/* Nút thao tác mở rộng / thu gọn cây */}
          {(viewMode === 'TREE' || viewMode === 'TREE_VIEW') && !topLevelOnly && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Mở rộng cây
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Thu gọn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. BẢNG DỮ LIỆU: TREE TABLE HOẶC DANH SÁCH PHẲNG */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-xs text-slate-500">
          Đang tải dữ liệu phân cấp sự kiện lịch sử...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Header Bảng: 5 cột đặc thù của Sự kiện + Thao tác */}
          <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-4">Tên sự kiện / phân cấp</div>
            <div className="col-span-2">Thời gian</div>
            <div className="col-span-2">Địa điểm</div>
            <div className="col-span-2">Giai đoạn</div>
            <div className="col-span-1">Trạng thái</div>
            <div className="col-span-1 text-right">Thao tác</div>
          </div>

          {/* Dữ liệu hàng */}
          {viewMode === 'TREE_VIEW' ? (
            treeNodes.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Không tìm thấy sự kiện nào phù hợp với bộ lọc phân cấp.
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {treeNodes.map((rootNode) => renderEventTreeNode(rootNode, 0))}
              </div>
            )
          ) : viewMode === 'TREE' ? (
            treeNodes.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Không tìm thấy sự kiện nào phù hợp với bộ lọc phân cấp.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {treeNodes.map((rootNode) => {
                  const item = rootNode.item;
                  const isExpanded = expandedIds.has(item.id);
                  const hasChildren = rootNode.childCount > 0;
                  const displayLocation =
                    item.historicalLocation?.name || (item.metadata?.rawLocation as string) || 'Chưa gắn địa điểm';
                  const periodName =
                    item.period?.name ||
                    item.topic?.period?.name ||
                    'Kháng chiến chống Mỹ (1954 – 1975)';

                  return (
                    <div
                      key={item.id}
                      className={`transition-colors ${
                        hasChildren && isExpanded ? 'bg-amber-50/20' : 'hover:bg-slate-50/70'
                      }`}
                    >
                      {/* HÀNG SỰ KIỆN CHA / ĐỘC LẬP */}
                      <div className="grid grid-cols-12 px-5 py-3.5 items-center">
                        {/* Cột 1: Tên sự kiện & Bộ điều khiển phân cấp */}
                        <div className="col-span-4 flex items-start gap-2.5 min-w-0 pr-2">
                          {/* Nút bấm xổ ra / thu gọn */}
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0 text-xs font-bold shadow-2xs mt-0.5 ${
                                isExpanded
                                  ? 'bg-[#5C3D1E] text-white hover:bg-[#432c15]'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                              }`}
                              title={isExpanded ? 'Thu gọn sự kiện con' : 'Mở rộng sự kiện con'}
                            >
                              {isExpanded ? '▾' : '▸'}
                            </button>
                          ) : (
                            <span className="w-6 h-6 shrink-0 flex items-center justify-center text-slate-300 font-mono text-sm mt-0.5">
                              •
                            </span>
                          )}

                          {/* Thumbnail / Icon */}
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100 mt-0.5"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                              {hasChildren ? '★' : '•'}
                            </div>
                          )}

                          {/* Tiêu đề & Badge */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <Link
                                href={APP_ROUTES.EVENTS.DETAIL(item.id)}
                                className="text-xs font-bold text-slate-900 hover:text-blue-700 hover:underline transition"
                              >
                                {item.title}
                              </Link>

                              {/* Badge phân cấp */}
                              {hasChildren ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExpand(item.id)}
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 transition cursor-pointer shrink-0"
                                >
                                  {isExpanded ? '▼' : '▶'} {rootNode.childCount} mục con
                                </button>
                              ) : (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                  Sự kiện độc lập
                                </span>
                              )}
                              {/* Badge phân loại thể loại sự kiện */}
                              {item.category && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                                  {EVENT_CATEGORY_LABELS[item.category] || item.category}
                                </span>
                              )}
                            </div>

                            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {item.summary || 'Sự kiện trong hệ thống sử học'}
                            </div>
                          </div>
                        </div>

                        {/* Cột 2: Thời gian */}
                        <div className="col-span-2 text-xs">
                          <span className="font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-block">
                            {item.endYear && item.endYear !== item.startYear
                              ? `${formatHistoricalYear(item.startYear)} – ${formatHistoricalYear(item.endYear)}`
                              : formatHistoricalYear(item.startYear)}
                          </span>
                          {item.eventDateNote && (
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono truncate">
                              {item.eventDateNote}
                            </div>
                          )}
                        </div>

                        {/* Cột 3: Địa điểm */}
                        <div className="col-span-2 text-xs pr-2">
                          <span className="font-medium text-slate-800 block truncate" title={displayLocation}>
                            {displayLocation}
                          </span>
                        </div>

                        {/* Cột 4: Giai đoạn */}
                        <div className="col-span-2 text-xs pr-2">
                          <span className="font-semibold text-slate-800 block truncate" title={periodName}>
                            {periodName}
                          </span>
                          {item.topic?.name && (
                            <span className="text-[10px] text-slate-500 block truncate mt-0.5" title={item.topic.name}>
                              ↳ {item.topic.name}
                            </span>
                          )}
                        </div>

                        {/* Cột 5: Trạng thái */}
                        <div className="col-span-1">
                          <Badge tone={STATUS_TONE_MAP[item.status || ContentStatus.PUBLISHED]}>
                            {STATUS_LABEL_MAP[item.status || ContentStatus.PUBLISHED]}
                          </Badge>
                        </div>

                        {/* Cột 6: Thao tác */}
                        <div className="col-span-1 flex items-center justify-end gap-1.5 text-xs">
                          <Link
                            href={APP_ROUTES.EVENTS.DETAIL(item.id)}
                            className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition font-medium border border-slate-200"
                          >
                            Sửa
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeletePrompt(item)}
                            className="px-2 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition font-medium border border-rose-200 cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>

                      {/* KHỐI CON XỔ RA NẰM TRỌN TRONG SỰ KIỆN CHA */}
                      {hasChildren && isExpanded && !topLevelOnly && (
                        <div className="bg-[#FAF7F2] border-t border-b border-amber-200/80 px-6 py-3.5 mx-4 my-2 rounded-2xl border border-amber-300/80 shadow-xs">
                          {/* Tiêu đề thanh phân cấp con */}
                          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-amber-200/60 text-xs">
                            <div className="flex items-center gap-2 font-bold text-[#5C3D1E]">
                              <span className="text-amber-700 text-sm">↳</span>
                              <span>SỰ KIỆN THÀNH PHẦN TRỰC THUỘC ({rootNode.children.length})</span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Thuộc diễn biến: <strong className="text-slate-800 font-semibold">{item.title}</strong>
                            </span>
                          </div>

                          {/* Danh sách các thẻ sự kiện con */}
                          <div className="space-y-2">
                            {rootNode.children.map((childNode, idx) => {
                              const child = childNode.item;
                              const childDisplayLoc =
                                child.historicalLocation?.name || (child.metadata?.rawLocation as string) || 'Chưa gắn địa điểm';

                              return (
                                <div
                                  key={child.id}
                                  className="bg-white border border-slate-200/90 rounded-xl p-3 hover:border-amber-400 hover:shadow-xs transition"
                                >
                                  <div className="grid grid-cols-12 items-center gap-3">
                                    {/* Cột tên con kèm ký hiệu nhánh cây */}
                                    <div className="col-span-5 flex items-start gap-2.5 min-w-0">
                                      <span className="text-amber-600 font-mono text-sm mt-0.5 shrink-0 font-bold">
                                        {idx === rootNode.children.length - 1 ? '└──' : '├──'}
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <Link
                                            href={APP_ROUTES.EVENTS.DETAIL(child.id)}
                                            className="text-xs font-bold text-slate-900 hover:text-blue-700 hover:underline"
                                          >
                                            {child.title}
                                          </Link>
                                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                                            Sự kiện thành phần
                                          </span>
                                          {child.category && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                                              {EVENT_CATEGORY_LABELS[child.category] || child.category}
                                            </span>
                                          )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                          {child.summary || 'Sự kiện thành phần trong chiến dịch'}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Cột thời gian */}
                                    <div className="col-span-2 text-xs">
                                      <span className="font-mono font-bold text-amber-900 bg-amber-50/80 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                                        {formatHistoricalYear(child.startYear)}
                                      </span>
                                      {child.eventDateNote && (
                                        <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                                          {child.eventDateNote}
                                        </div>
                                      )}
                                    </div>

                                    {/* Cột địa điểm */}
                                    <div className="col-span-2 text-xs text-slate-700 truncate" title={childDisplayLoc}>
                                      {childDisplayLoc}
                                    </div>

                                    {/* Cột trạng thái */}
                                    <div className="col-span-1">
                                      <Badge tone={STATUS_TONE_MAP[child.status || ContentStatus.PUBLISHED]}>
                                        {STATUS_LABEL_MAP[child.status || ContentStatus.PUBLISHED]}
                                      </Badge>
                                    </div>

                                    {/* Cột thao tác */}
                                    <div className="col-span-2 flex items-center justify-end gap-1.5 text-xs">
                                      <Link
                                        href={APP_ROUTES.EVENTS.DETAIL(child.id)}
                                        className="px-2 py-0.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 text-[11px]"
                                      >
                                        Sửa
                                      </Link>
                                      <button
                                        type="button"
                                        onClick={() => handleDeletePrompt(child)}
                                        className="px-2 py-0.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 text-[11px] cursor-pointer"
                                      >
                                        Xóa
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* Chế độ DANH SÁCH PHẲNG (FLAT LIST) */
            filteredEvents.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Không tìm thấy sự kiện nào trong danh sách phẳng.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredEvents.map((item) => {
                  const displayLocation =
                    item.historicalLocation?.name || (item.metadata?.rawLocation as string) || 'Chưa gắn địa điểm';
                  const periodName =
                    item.period?.name ||
                    item.topic?.period?.name ||
                    'Kháng chiến chống Mỹ (1954 – 1975)';

                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 px-5 py-3.5 items-center hover:bg-slate-50/80 transition"
                    >
                      <div className="col-span-4 flex items-start gap-2.5 min-w-0">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100 mt-0.5"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                            {item.parentId ? '↳' : '•'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              href={APP_ROUTES.EVENTS.DETAIL(item.id)}
                              className="font-bold text-xs text-slate-900 hover:text-blue-700 hover:underline transition truncate"
                            >
                              {item.title}
                            </Link>
                            {item.parent && (
                              <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                Thuộc: {item.parent.title}
                              </span>
                            )}
                            {item.category && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 shrink-0">
                                {EVENT_CATEGORY_LABELS[item.category] || item.category}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {item.summary || 'Sự kiện trong hệ thống sử học'}
                          </p>
                        </div>
                      </div>

                      <div className="col-span-2 text-xs">
                        <span className="font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded inline-block">
                          {item.endYear && item.endYear !== item.startYear
                            ? `${formatHistoricalYear(item.startYear)} – ${formatHistoricalYear(item.endYear)}`
                            : formatHistoricalYear(item.startYear)}
                        </span>
                      </div>

                      <div className="col-span-2 text-xs pr-2">
                        <span className="font-medium text-slate-800 block truncate" title={displayLocation}>
                          {displayLocation}
                        </span>
                      </div>

                      <div className="col-span-2 text-xs pr-2">
                        <span className="font-semibold text-slate-800 block truncate" title={periodName}>
                          {periodName}
                        </span>
                        {item.topic?.name && (
                          <span className="text-[10px] text-slate-500 block truncate mt-0.5" title={item.topic.name}>
                            ↳ {item.topic.name}
                          </span>
                        )}
                      </div>

                      <div className="col-span-1">
                        <Badge tone={STATUS_TONE_MAP[item.status || ContentStatus.PUBLISHED]}>
                          {STATUS_LABEL_MAP[item.status || ContentStatus.PUBLISHED]}
                        </Badge>
                      </div>

                      <div className="col-span-1 flex items-center justify-end gap-1.5 text-xs">
                        <Link
                          href={APP_ROUTES.EVENTS.DETAIL(item.id)}
                          className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition font-medium border border-slate-200"
                        >
                          Sửa
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeletePrompt(item)}
                          className="px-2 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition font-medium border border-rose-200 cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      )}

      {/* Dòng ghi chú nguyên tắc dữ liệu phân cấp chuẩn */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 flex items-center justify-between gap-3 flex-wrap">
        <div>
          Cấu trúc cây phân cấp thể hiện mối quan hệ giữa các chiến dịch lớn và các sự kiện/trận đánh thành phần đã được kiểm duyệt trong cơ sở dữ liệu lịch sử.
        </div>
        <div className="font-medium text-slate-600">
          Tổng cộng: <b>{filteredEvents.length}</b> sự kiện phù hợp
        </div>
      </div>

      {/* Modal xác nhận xóa hoặc cảnh báo chặn xóa cascade */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingEvent)}
        title={deleteErrorMessage ? 'Không thể xóa sự kiện cha' : 'Xóa Sự kiện lịch sử'}
        message={
          deleteErrorMessage ||
          `Bạn có chắc chắn muốn xóa sự kiện "${deletingEvent?.title}" khỏi Từ điển tri thức? Thao tác này không thể hoàn tác.`
        }
        confirmLabel={deleteErrorMessage ? 'Đã hiểu' : isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={deleteErrorMessage ? () => setDeletingEvent(null) : handleDeleteEvent}
        onClose={() => setDeletingEvent(null)}
      />
    </div>
  );
}
