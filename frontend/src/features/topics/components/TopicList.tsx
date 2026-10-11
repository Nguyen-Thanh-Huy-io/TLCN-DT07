'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DataTable } from '@/components/table/DataTable';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus } from '@/constants/enums';
import { ColumnDef } from '@/types/table.types';
import { TopicItem } from '@/types/models/topic.type';
import { TopicApiService } from '@/services/entities/topic.service';
import { extractErrorMessage } from '@/services/api';

type HierarchyFilterType = 'ALL' | 'ROOT_ONLY' | 'CHILD_ONLY';

export interface TopicTreeRow extends TopicItem {
  depth: number;
  isChild: boolean;
  parentName?: string;
  hasChildren: boolean;
  childrenCount: number;
}

export function TopicList() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingTopic, setDeletingTopic] = useState<TopicItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hierarchyFilter, setHierarchyFilter] = useState<HierarchyFilterType>('ALL');

  // Quản lý trạng thái mở rộng/thu gọn của từng chủ đề (mặc định mở rộng tất cả)
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await TopicApiService.getTopics({ limit: 100 });
      if (res.items && res.items.length > 0) {
        setTopics(res.items);
        // Tự động mở rộng tất cả các node trong cây
        const newExpanded: Record<string, boolean> = {};
        res.items.forEach((t) => {
          newExpanded[t.id] = true;
        });
        setExpandedMap((prev) => ({ ...newExpanded, ...prev }));
      } else {
        setTopics([]);
      }
    } catch (err) {
      console.error('Failed to fetch topics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const toggleExpand = (id: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: prev[id] === false ? true : false,
    }));
  };

  const expandAll = () => {
    const next: Record<string, boolean> = {};
    topics.forEach((t) => {
      next[t.id] = true;
    });
    setExpandedMap(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    topics.forEach((t) => {
      next[t.id] = false;
    });
    setExpandedMap(next);
  };

  // Điều hướng sang Route trang mới (Full-page Editorial Layout)
  const handleNavigateCreate = () => {
    router.push('/topics/create');
  };

  const handleNavigateCreateChild = (parentId: string) => {
    router.push(`/topics/create?parentId=${encodeURIComponent(parentId)}`);
  };

  const handleNavigateEdit = (item: TopicItem) => {
    router.push(`/topics/${item.id}`);
  };

  const handleDeleteTopic = async () => {
    if (!deletingTopic) return;
    try {
      setIsDeleting(true);
      await TopicApiService.deleteTopic(deletingTopic.id);
      setTopics((prev) => prev.filter((t) => t.id !== deletingTopic.id));
      setDeletingTopic(null);
    } catch (err: unknown) {
      console.error('Failed to delete topic:', err);
      alert(extractErrorMessage(err, 'Không thể xóa chủ đề lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Hoán đổi thứ tự hiển thị nhanh trong phạm vi nhóm cùng cấp (Scoped Reorder theo parentId)
  const handleMoveOrder = async (item: TopicTreeRow, direction: 'UP' | 'DOWN') => {
    const group = topics
      .filter((t) => t.parentId === item.parentId)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    const currentIndex = group.findIndex((t) => t.id === item.id);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= group.length) return;

    const targetItem = group[targetIndex];

    let currentNewOrder = targetItem.displayOrder ?? 0;
    let targetNewOrder = item.displayOrder ?? 0;

    if (currentNewOrder === targetNewOrder) {
      if (direction === 'UP') {
        currentNewOrder = Math.max(0, currentNewOrder - 1);
      } else {
        currentNewOrder = currentNewOrder + 1;
      }
    }

    const previousTopics = [...topics];
    // Optimistic UI update
    setTopics((prev) =>
      prev.map((t) => {
        if (t.id === item.id) return { ...t, displayOrder: currentNewOrder };
        if (t.id === targetItem.id) return { ...t, displayOrder: targetNewOrder };
        return t;
      })
    );

    try {
      await TopicApiService.reorderTopics([
        { id: item.id, displayOrder: currentNewOrder },
        { id: targetItem.id, displayOrder: targetNewOrder },
      ]);
      await fetchTopics();
    } catch (err) {
      console.error('Failed to reorder topics:', err);
      setTopics(previousTopics);
      alert(extractErrorMessage(err, 'Không thể cập nhật thứ tự chủ đề'));
    }
  };

  // Xây dựng danh sách cây gom nhóm Đa cấp Cha - Con (Composite Tree DFS Traversal)
  const displayRows = useMemo(() => {
    // Map danh sách con theo parentId
    const childrenMap = new Map<string, TopicItem[]>();
    const rootTopics: TopicItem[] = [];

    topics.forEach((t) => {
      if (t.parentId) {
        const arr = childrenMap.get(t.parentId) || [];
        arr.push(t);
        childrenMap.set(t.parentId, arr);
      } else {
        rootTopics.push(t);
      }
    });

    // Sắp xếp các root topics theo displayOrder
    rootTopics.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

    // Sắp xếp danh sách con trong từng cha theo displayOrder
    childrenMap.forEach((childList) => {
      childList.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    });

    if (hierarchyFilter === 'ROOT_ONLY') {
      return rootTopics.map((r) => ({
        ...r,
        depth: 0,
        isChild: false,
        hasChildren: (childrenMap.get(r.id)?.length || 0) > 0,
        childrenCount: childrenMap.get(r.id)?.length || 0,
      }));
    }

    if (hierarchyFilter === 'CHILD_ONLY') {
      const allChildren: TopicTreeRow[] = [];
      const collectChildren = (parentId: string, parentName: string, depth: number) => {
        const children = childrenMap.get(parentId) || [];
        children.forEach((c) => {
          const cChildren = childrenMap.get(c.id) || [];
          allChildren.push({
            ...c,
            depth,
            isChild: true,
            parentName,
            hasChildren: cChildren.length > 0,
            childrenCount: cChildren.length,
          });
          collectChildren(c.id, c.name, depth + 1);
        });
      };

      rootTopics.forEach((r) => {
        collectChildren(r.id, r.name, 1);
      });

      return allChildren;
    }

    // Mặc định: ALL -> Duyệt cây đa tầng DFS (Depth 0: Gốc -> Depth 1: Giai đoạn -> Depth 2: Chuyên đề)
    const rows: TopicTreeRow[] = [];

    const traverse = (node: TopicItem, depth: number, parentName?: string) => {
      const children = childrenMap.get(node.id) || [];
      const hasChildren = children.length > 0;
      const isExpanded = expandedMap[node.id] !== false;

      rows.push({
        ...node,
        depth,
        isChild: depth > 0,
        parentName,
        hasChildren,
        childrenCount: children.length,
      });

      // Nếu node đang được mở rộng, duyệt tiếp các node con
      if (hasChildren && isExpanded) {
        children.forEach((child) => {
          traverse(child, depth + 1, node.name);
        });
      }
    };

    rootTopics.forEach((root) => {
      traverse(root, 0);
    });

    // Xử lý node mồ côi (nếu có trường hợp cha không nằm trong danh sách)
    const visitedIds = new Set(rows.map((r) => r.id));
    topics.forEach((t) => {
      if (!visitedIds.has(t.id)) {
        rows.push({
          ...t,
          depth: 1,
          isChild: true,
          parentName: 'Không xác định',
          hasChildren: false,
          childrenCount: 0,
        });
      }
    });

    return rows;
  }, [topics, hierarchyFilter, expandedMap]);

  const columns: ColumnDef<TopicTreeRow>[] = [
    {
      header: 'Chủ đề (Phân cấp Cha - Con)',
      cell: (item) => {
        const isExpanded = expandedMap[item.id] !== false;
        const indentClass =
          item.depth === 0 ? 'pl-0' : item.depth === 1 ? 'pl-6' : 'pl-12';

        return (
          <div className={`flex items-center gap-1.5 py-1 ${indentClass}`}>
            {/* Ký hiệu phân nhánh cây */}
            {item.depth === 1 && (
              <span className="text-slate-300 font-mono text-xs select-none shrink-0 mr-0.5">
                ├──
              </span>
            )}
            {item.depth >= 2 && (
              <span className="text-slate-300 font-mono text-xs select-none shrink-0 mr-0.5">
                └──
              </span>
            )}

            {/* Nút Đóng / Mở nhánh */}
            {item.hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
                }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition text-[10px] shrink-0 font-bold"
                title={isExpanded ? 'Thu gọn nhánh' : 'Mở rộng nhánh'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <div className="w-5 shrink-0" />
            )}

            {/* Biểu tượng phân cấp theo tầng */}
            {item.depth === 0 ? (
              <Icon name={IconName.FOLDER} size={16} className="text-amber-500 shrink-0" />
            ) : item.depth === 1 ? (
              <Icon name={IconName.FOLDER} size={15} className="text-blue-500 shrink-0" />
            ) : (
              <Icon name={IconName.TAG} size={13} className="text-slate-400 shrink-0" />
            )}

            {/* Thông tin chủ đề */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  href={`/topics/${item.id}`}
                  className={`hover:text-blue-600 hover:underline transition-colors cursor-pointer truncate ${
                    item.depth === 0
                      ? 'font-bold text-xs text-slate-900'
                      : item.depth === 1
                      ? 'font-semibold text-xs text-slate-800'
                      : 'font-normal text-xs text-slate-700'
                  }`}
                >
                  {item.name}
                </Link>

                {item.hasChildren && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(item.id);
                    }}
                    className={`text-[10px] font-medium px-1.5 py-0.2 rounded border cursor-pointer transition shrink-0 select-none ${
                      item.depth === 0
                        ? 'text-amber-800 bg-amber-50 border-amber-200 hover:bg-amber-100'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                    }`}
                    title="Nhấp để đóng/mở nhánh con"
                  >
                    {item.childrenCount} {item.depth === 0 ? 'giai đoạn' : 'chuyên đề'}
                  </span>
                )}

                {item.isSequential && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                    Tuần tự
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1 max-w-[500px]">
                {item.description || 'Chưa có mô tả'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Vị trí phân cấp',
      cell: (item) => {
        if (item.depth === 0) {
          return (
            <div className="flex flex-col text-xs">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  Chủ đề gốc
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigateCreateChild(item.id);
                  }}
                  className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 transition shrink-0"
                  title={`Thêm chủ đề con trực thuộc "${item.name}"`}
                >
                  + Thêm chủ đề con
                </button>
              </div>
            </div>
          );
        }

        return (
          <div className="flex flex-col text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                Chủ đề con
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateCreateChild(item.id);
                }}
                className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 transition shrink-0"
                title={`Thêm chủ đề con trực thuộc "${item.name}"`}
              >
                + Thêm chủ đề con
              </button>
            </div>
            {item.parentName && (
              <span
                className="text-[10px] text-slate-500 truncate max-w-[190px] mt-0.5"
                title={`Thuộc: ${item.parentName}`}
              >
                ↳ Thuộc: {item.parentName}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Thứ tự',
      cell: (item) => {
        const group = topics
          .filter((t) => t.parentId === item.parentId)
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

        const currentIndex = group.findIndex((t) => t.id === item.id);
        const canMoveUp = currentIndex > 0;
        const canMoveDown = currentIndex !== -1 && currentIndex < group.length - 1;

        const orderBadgeLabel =
          item.depth === 0
            ? `Gốc #${String(item.displayOrder ?? 0).padStart(2, '0')}`
            : item.depth === 1
            ? `Giai đoạn #${String(item.displayOrder ?? 0).padStart(2, '0')}`
            : `Chuyên đề #${String(item.displayOrder ?? 0).padStart(2, '0')}`;

        const badgeClass =
          item.depth === 0
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : item.depth === 1
            ? 'bg-blue-50 text-blue-700 border-blue-200'
            : 'bg-slate-100 text-slate-700 border-slate-200';

        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded border ${badgeClass}`}
              title={`Thứ tự hiển thị: ${item.displayOrder ?? 0}`}
            >
              {orderBadgeLabel}
            </span>

            <div className="flex flex-col -space-y-1">
              <button
                type="button"
                disabled={!canMoveUp}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveOrder(item, 'UP');
                }}
                className={`p-0.5 text-[9px] leading-none transition ${
                  canMoveUp
                    ? 'text-slate-500 hover:text-blue-600 cursor-pointer'
                    : 'text-slate-200 cursor-not-allowed'
                }`}
                title={canMoveUp ? 'Chuyển lên trên trong nhóm cùng cấp' : 'Đã ở vị trí đầu'}
              >
                ▲
              </button>
              <button
                type="button"
                disabled={!canMoveDown}
                onClick={(e) => {
                  e.stopPropagation();
                  handleMoveOrder(item, 'DOWN');
                }}
                className={`p-0.5 text-[9px] leading-none transition ${
                  canMoveDown
                    ? 'text-slate-500 hover:text-blue-600 cursor-pointer'
                    : 'text-slate-200 cursor-not-allowed'
                }`}
                title={canMoveDown ? 'Chuyển xuống dưới trong nhóm cùng cấp' : 'Đã ở vị trí cuối'}
              >
                ▼
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Bài học',
      cell: (item) => {
        const count = item._count?.lessons ?? 0;
        return (
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                count > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {count} bài
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/lessons/create?topicId=${item.id}`);
              }}
              className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 transition cursor-pointer"
              title={`Tạo bài học mới cho chủ đề "${item.name}"`}
            >
              + Bài học
            </button>
          </div>
        );
      },
    },
    {
      header: 'Trạng thái',
      cell: (item) => {
        const status = item.status || ContentStatus.PUBLISHED;
        return (
          <Badge tone={STATUS_TONE_MAP[status]}>
            {STATUS_LABEL_MAP[status]}
          </Badge>
        );
      },
    },
    {
      header: 'Cập nhật',
      cell: (item) =>
        item.updatedAt
          ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
          : 'Chưa cập nhật',
    },
  ];

  if (loading) {
    return <div style={{ padding: 20 }}>Đang tải dữ liệu...</div>;
  }

  const rootCount = topics.filter((t) => !t.parentId).length;
  const childCount = topics.filter((t) => Boolean(t.parentId)).length;

  return (
    <>
      {/* Toolbar: Phân cấp Segmented Tabs & Tiện ích Mở rộng */}
      <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setHierarchyFilter('ALL')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              hierarchyFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Cây phân cấp Cha - Con ({topics.length})
          </button>
          <button
            type="button"
            onClick={() => setHierarchyFilter('ROOT_ONLY')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              hierarchyFilter === 'ROOT_ONLY'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Chỉ chủ đề gốc ({rootCount})
          </button>
          <button
            type="button"
            onClick={() => setHierarchyFilter('CHILD_ONLY')}
            className={`px-3 py-1 rounded-md font-medium transition ${
              hierarchyFilter === 'CHILD_ONLY'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Chỉ chủ đề con ({childCount})
          </button>
        </div>

        {hierarchyFilter === 'ALL' && (
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={expandAll}
              className="text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition"
            >
              Mở rộng tất cả
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={collapseAll}
              className="text-slate-500 hover:text-slate-800 px-2 py-1 rounded hover:bg-slate-100 transition"
            >
              Thu gọn tất cả
            </button>
          </div>
        )}
      </div>

      <DataTable<TopicTreeRow>
        columns={columns}
        data={displayRows}
        searchPlaceholder="Tìm kiếm chủ đề lịch sử..."
        primaryButtonLabel="Thêm chủ đề"
        onPrimaryButtonClick={handleNavigateCreate}
        onEdit={handleNavigateEdit}
        onDelete={(item) => setDeletingTopic(item)}
        filters={[{ label: 'Trạng thái' }]}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingTopic)}
        title="Xóa Chủ đề lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingTopic?.name}"? Mọi bài học và sự kiện trực thuộc chủ đề này cũng sẽ bị xóa liên đới (Cascade).`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteTopic}
        onClose={() => setDeletingTopic(null)}
      />
    </>
  );
}
