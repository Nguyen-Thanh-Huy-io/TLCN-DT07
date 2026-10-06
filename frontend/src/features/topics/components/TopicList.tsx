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

  // Quản lý trạng thái mở rộng/thu gọn của từng chủ đề cha (mặc định mở rộng tất cả)
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await TopicApiService.getTopics({ limit: 100 });
      if (res.items && res.items.length > 0) {
        setTopics(res.items);
        // Tự động mở rộng tất cả các chủ đề cha có con
        const newExpanded: Record<string, boolean> = {};
        res.items.forEach((t) => {
          if (!t.parentId) {
            newExpanded[t.id] = true;
          }
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
      if (!t.parentId) next[t.id] = true;
    });
    setExpandedMap(next);
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    topics.forEach((t) => {
      if (!t.parentId) next[t.id] = false;
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

  // Hoán đổi thứ tự hiển thị nhanh trong phạm vi nhóm cha hoặc nhóm con (Scoped Reorder)
  const handleMoveOrder = async (item: TopicTreeRow, direction: 'UP' | 'DOWN') => {
    // Xác định nhóm cùng cấp (nếu là con thì gom các con cùng cha; nếu là gốc thì gom các gốc cùng giai đoạn)
    const group = topics
      .filter((t) => {
        if (item.isChild) {
          return t.parentId === item.parentId;
        }
        return !t.parentId && (t.period?.id || t.periodId || '') === (item.period?.id || item.periodId || '');
      })
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

  // Xây dựng danh sách cây gom nhóm Cha - Con (Tree-structured rows)
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
        isChild: false,
        hasChildren: (childrenMap.get(r.id)?.length || 0) > 0,
        childrenCount: childrenMap.get(r.id)?.length || 0,
      }));
    }

    if (hierarchyFilter === 'CHILD_ONLY') {
      const allChildren: TopicTreeRow[] = [];
      childrenMap.forEach((children) => {
        children.forEach((c) => {
          const parent = topics.find((p) => p.id === c.parentId);
          allChildren.push({
            ...c,
            isChild: true,
            parentName: parent?.name,
            hasChildren: false,
            childrenCount: 0,
          });
        });
      });
      return allChildren.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }

    // Mặc định: ALL -> Gom nhóm Cha kèm các Con ngay bên dưới nếu đang mở rộng
    const rows: TopicTreeRow[] = [];

    rootTopics.forEach((root) => {
      const children = childrenMap.get(root.id) || [];
      const isExpanded = expandedMap[root.id] !== false;

      // Dòng Cha (Root)
      rows.push({
        ...root,
        isChild: false,
        hasChildren: children.length > 0,
        childrenCount: children.length,
      });

      // Các dòng Con (nếu đang mở rộng)
      if (isExpanded && children.length > 0) {
        children.forEach((child) => {
          rows.push({
            ...child,
            isChild: true,
            parentName: root.name,
            hasChildren: false,
            childrenCount: 0,
          });
        });
      }
    });

    // Xử lý những topic con mồ côi (nếu parentId không tồn tại trong danh sách)
    topics.forEach((t) => {
      if (t.parentId && !topics.some((p) => p.id === t.parentId)) {
        rows.push({
          ...t,
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
        if (item.isChild) {
          return (
            <div className="flex items-center pl-7 py-1 text-slate-700">
              <span className="text-slate-300 mr-2 font-mono text-xs select-none">└──</span>
              <div className="flex items-center gap-2">
                <Icon name={IconName.FOLDER} size={14} className="text-slate-400 shrink-0" />
                <div>
                  <div className="font-medium text-xs text-slate-800 flex items-center gap-1.5">
                    <Link
                      href={`/topics/${item.id}`}
                      className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                    >
                      {item.name}
                    </Link>
                    {item.isSequential && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                        Tuần tự
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{item.description || 'Chưa có mô tả'}</div>
                </div>
              </div>
            </div>
          );
        }

        // Dòng Chủ đề Cha (Root)
        const isExpanded = expandedMap[item.id] !== false;
        return (
          <div className="flex items-center gap-2 py-0.5">
            {item.hasChildren ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(item.id);
                }}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500 transition text-[10px] shrink-0 font-bold"
                title={isExpanded ? 'Thu gọn chủ đề con' : 'Mở rộng chủ đề con'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <div className="w-5 shrink-0" />
            )}
            <Icon name={IconName.FOLDER} size={16} className="text-amber-500/80 shrink-0" />
            <div>
              <div className="font-semibold text-xs text-slate-900 flex items-center gap-2">
                <Link
                  href={`/topics/${item.id}`}
                  className="hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                >
                  {item.name}
                </Link>
                {item.hasChildren && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(item.id);
                    }}
                    className="text-[10px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 cursor-pointer transition shrink-0 select-none"
                    title="Nhấp để đóng/mở danh sách con"
                  >
                    {item.childrenCount} chủ đề con
                  </span>
                )}
                {item.isSequential && (
                  <span className="text-[10px] text-amber-600 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                    Tuần tự
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-400 line-clamp-1">{item.description || 'Chưa có mô tả'}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Vị trí phân cấp',
      cell: (item) => {
        if (item.isChild) {
          return (
            <div className="flex flex-col text-xs pl-7">
              <span className="font-medium text-blue-700 text-[11px] truncate max-w-[180px]">
                ↳ Con của: {item.parentName || 'Chủ đề cha'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Nhánh con (Cấp 2)</span>
            </div>
          );
        }

        return (
          <div className="flex flex-col text-xs">
            <span className="font-medium text-slate-800 text-[11px] truncate max-w-[180px]">
              {item.period?.name || 'Phi niên đại'}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-slate-400 font-mono">Chủ đề gốc (Cấp 1)</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNavigateCreateChild(item.id);
                }}
                className="text-[10px] font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 transition shrink-0"
                title={`Thêm chủ đề con trực thuộc "${item.name}"`}
              >
                + Thêm con
              </button>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Thứ tự',
      cell: (item) => {
        // Lấy nhóm cùng cấp để kiểm tra xem có chuyển lên/xuống được không
        const group = topics
          .filter((t) => {
            if (item.isChild) {
              return t.parentId === item.parentId;
            }
            return !t.parentId && (t.period?.id || t.periodId || '') === (item.period?.id || item.periodId || '');
          })
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

        const currentIndex = group.findIndex((t) => t.id === item.id);
        const canMoveUp = currentIndex > 0;
        const canMoveDown = currentIndex !== -1 && currentIndex < group.length - 1;

        return (
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs font-semibold px-1.5 py-0.5 rounded border ${
                item.isChild
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-800 border-slate-200/80'
              }`}
              title={item.isChild ? 'Thứ tự trong chủ đề cha' : 'Thứ tự trong giai đoạn'}
            >
              {item.isChild
                ? `Nhánh #${String(item.displayOrder ?? 0).padStart(2, '0')}`
                : `Gốc #${String(item.displayOrder ?? 0).padStart(2, '0')}`}
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
        filters={[{ label: 'Giai đoạn' }, { label: 'Trạng thái' }]}
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
