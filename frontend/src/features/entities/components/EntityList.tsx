'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/table/DataTable';
import { ContentCell } from '@/components/common/ContentCell';
import { Badge } from '@/components/common/Badge';
import { ConfirmDeleteModal } from '@/components/common/ConfirmDeleteModal';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { STATUS_LABEL_MAP, STATUS_TONE_MAP } from '@/constants/ui-theme';
import { ContentStatus, EntityType } from '@/constants/enums';
import { ENTITY_TYPE_LABELS } from '@/features/entities/components/entity-editor.constants';
import { useFigureRoles } from '@/components/figures/useFigureRoles';
import { APP_ROUTES } from '@/constants/routes';
import { ColumnDef } from '@/types/table.types';
import { HistoricalEntityItem } from '@/types/models/historical-entity.type';
import { HistoricalEntityApiService } from '@/services/entities/historical-entity.service';
import { PeriodApiService } from '@/services/entities/period.service';
import type { PeriodItem } from '@/types/models/period.type';
import { extractErrorMessage } from '@/services/api';

const CREATABLE_ENTITY_TYPES: Array<{ type: EntityType; label: string; desc: string }> = [
  { type: EntityType.PERSON, label: ENTITY_TYPE_LABELS[EntityType.PERSON], desc: 'Vua chúa, tướng lĩnh, anh hùng, danh nhân...' },
  { type: EntityType.DYNASTY, label: ENTITY_TYPE_LABELS[EntityType.DYNASTY], desc: 'Các triều đại, nhà nước, thể chế...' },
  { type: EntityType.ORGANIZATION, label: ENTITY_TYPE_LABELS[EntityType.ORGANIZATION], desc: 'Đảng phái, hội đồng, liên minh...' },
  { type: EntityType.MILITARY_FORCE, label: ENTITY_TYPE_LABELS[EntityType.MILITARY_FORCE], desc: 'Binh đoàn, cánh quân, nghĩa quân...' },
  { type: EntityType.ARTIFACT, label: ENTITY_TYPE_LABELS[EntityType.ARTIFACT], desc: 'Bảo vật quốc gia, cổ vật, vũ khí...' },
  {
    type: EntityType.OTHER,
    label: ENTITY_TYPE_LABELS[EntityType.OTHER],
    desc: 'Hiệp ước, văn kiện, phong trào, học thuyết, khái niệm lịch sử...',
  },
];

export interface EntityListProps {
  filterType?: EntityType;
  title?: string;
  createRoute?: string;
  detailRoutePrefix?: string;
}

export function EntityList({
  filterType,
  title,
  createRoute,
  detailRoutePrefix,
}: EntityListProps = {}) {
  const router = useRouter();
  const [entities, setEntities] = useState<HistoricalEntityItem[]>([]);
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPeriodIds, setSelectedPeriodIds] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [deletingEntity, setDeletingEntity] =
    useState<HistoricalEntityItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const createMenuRef = useRef<HTMLDivElement>(null);

  // Danh mục vai trò nhân vật tải động từ Taxonomy (FIGURE_ROLE)
  const { options: figureRoleOptions } = useFigureRoles();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(e.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    if (isCreateMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isCreateMenuOpen]);

  useEffect(() => {
    Promise.all([
      HistoricalEntityApiService.getEntities({
        type: filterType,
        limit: 100,
      }),
      PeriodApiService.getPeriods({ limit: 100 }).catch(() => ({ items: [] })),
    ])
      .then(([entitiesRes, periodsRes]) => {
        setEntities(entitiesRes.items || []);
        setPeriods(periodsRes.items || []);
      })
      .catch((err) => {
        console.error('Failed to fetch historical entities:', err);
        setEntities([]);
      })
      .finally(() => setLoading(false));
  }, [filterType]);

  const handleDeleteEntity = async () => {
    if (!deletingEntity) return;
    try {
      setIsDeleting(true);
      await HistoricalEntityApiService.deleteEntity(deletingEntity.id);
      setEntities((prev) => prev.filter((e) => e.id !== deletingEntity.id));
      setDeletingEntity(null);
    } catch (err) {
      console.error('Delete entity failed:', err);
      alert(extractErrorMessage(err, 'Không thể xóa Thực thể lịch sử.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiguresMode = filterType === EntityType.PERSON;

  const displayedEntities = useMemo(() => {
    return entities.filter((e) => {
      // 1. Lọc theo Thời kỳ lịch sử (Multi-Select)
      if (selectedPeriodIds.length > 0) {
        const matchesPrimary = e.periodId && selectedPeriodIds.includes(e.periodId);
        const matchesMultiple = Boolean(e.periodIds?.some((id) => selectedPeriodIds.includes(id)));
        if (!matchesPrimary && !matchesMultiple) {
          return false;
        }
      }
      // 2. Lọc theo vai trò nhân vật (Multi-Select từ Taxonomy FIGURE_ROLE)
      if (isFiguresMode && selectedRoles.length > 0) {
        const itemRoles = e.roles || [];
        const hasMatchingRole = itemRoles.some((r) => selectedRoles.includes(r));
        if (!hasMatchingRole) {
          return false;
        }
      }
      // 3. Lọc theo phân loại thực thể (Multi-Select)
      if (!isFiguresMode && selectedCategories.length > 0) {
        if (!selectedCategories.includes(e.type)) {
          return false;
        }
      }
      // 4. Lọc theo trạng thái xuất bản
      if (selectedStatus !== 'ALL') {
        const itemStatus = e.status || ContentStatus.PUBLISHED;
        if (itemStatus !== selectedStatus) {
          return false;
        }
      }
      return true;
    });
  }, [entities, isFiguresMode, selectedPeriodIds, selectedRoles, selectedCategories, selectedStatus]);

  const columns = useMemo<ColumnDef<HistoricalEntityItem>[]>(
    () => [
      {
        header: isFiguresMode ? 'DANH NHÂN / NHÂN VẬT LỊCH SỬ' : 'THỰC THỂ / NHÂN VẬT LỊCH SỬ',
        cell: (item) => (
          <ContentCell
            icon={IconName.USERS}
            title={item.name}
            sub={item.tagline || item.description || 'Chưa có mô tả tóm tắt'}
          />
        ),
      },
      {
        header: 'PHÂN LOẠI',
        cell: (item) => (
          <Badge tone="blue">
            {ENTITY_TYPE_LABELS[item.type] || item.type}
          </Badge>
        ),
      },
      {
        header: 'NIÊN ĐẠI / HOẠT ĐỘNG',
        cell: (item) => {
          let label = 'Chưa rõ';
          if (item.birthDateLabel && item.deathDateLabel) {
            label = `${item.birthDateLabel} – ${item.deathDateLabel}`;
          } else if (item.birthYear && item.deathYear) {
            label = `${item.birthYear} – ${item.deathYear}`;
          } else if (item.birthDateLabel) {
            label = item.birthDateLabel;
          } else if (item.birthYear) {
            label = `Từ năm ${item.birthYear}`;
          }
          return <span className="text-slate-700 text-xs font-medium">{label}</span>;
        },
      },
      {
        header: 'TRẠNG THÁI',
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
        header: 'CẬP NHẬT',
        cell: (item) => (
          <span className="text-slate-700 text-xs font-medium">
            {item.updatedAt
              ? new Date(item.updatedAt).toLocaleDateString('vi-VN')
              : 'Chưa cập nhật'}
          </span>
        ),
      },
    ],
    [isFiguresMode],
  );

  const resolveDetailUrl = (id: string) => {
    if (detailRoutePrefix) return `${detailRoutePrefix}/${id}`;
    if (isFiguresMode) return APP_ROUTES.FIGURES.DETAIL(id);
    return APP_ROUTES.ENTITIES.DETAIL(id);
  };

  const renderCreateMenu = () => {
    if (isFiguresMode) {
      return (
        <button
          type="button"
          className="primary-button !h-9 !px-4 !text-xs sm:!text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          onClick={() => router.push(createRoute || APP_ROUTES.FIGURES.CREATE)}
        >
          <Icon name={IconName.PLUS} size={15} />
          <span>+ Thêm nhân vật lịch sử</span>
        </button>
      );
    }

    return (
      <div className="relative inline-block text-left" ref={createMenuRef}>
        <button
          type="button"
          className="primary-button !h-9 !px-3.5 !text-xs sm:!text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          onClick={() => setIsCreateMenuOpen((prev) => !prev)}
        >
          <Icon name={IconName.PLUS} size={15} />
          <span>+ Thêm thực thể</span>
          <span className="text-[10px] ml-0.5 opacity-80">▼</span>
        </button>

        {isCreateMenuOpen && (
          <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white shadow-xl border border-slate-200 z-50 py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
              Chọn loại thực thể muốn tạo
            </div>
            {CREATABLE_ENTITY_TYPES.map((item) => (
              <button
                key={item.type}
                type="button"
                className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/80 transition flex flex-col group cursor-pointer"
                onClick={() => {
                  setIsCreateMenuOpen(false);
                  router.push(`${createRoute || APP_ROUTES.ENTITIES.CREATE}?type=${item.type}`);
                }}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-slate-800 group-hover:text-amber-900">
                    {item.label}
                  </span>
                  <span className="text-slate-300 group-hover:text-amber-600 font-bold">
                    →
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-1">
                  {item.desc}
                </span>
              </button>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                type="button"
                className="w-full text-left px-3.5 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-[11px] font-medium transition cursor-pointer"
                onClick={() => {
                  setIsCreateMenuOpen(false);
                  router.push(APP_ROUTES.ENTITIES.CREATE);
                }}
              >
                Chưa xác định loại (Chọn sau trong form)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Tùy chọn vai trò nhân vật tải động từ Taxonomy (FIGURE_ROLE)
  const roleFilterOptions = useMemo(
    () => [
      { label: 'Tất cả vai trò', value: 'ALL' },
      ...figureRoleOptions.map((opt) => ({
        label: opt.label,
        value: opt.code,
      })),
    ],
    [figureRoleOptions]
  );

  // Tùy chọn phân loại thực thể từ từ điển chuẩn hóa tập trung
  const categoryOptions = useMemo(
    () => [
      { label: 'Tất cả phân loại', value: 'ALL' },
      ...[
        EntityType.DYNASTY,
        EntityType.ORGANIZATION,
        EntityType.MILITARY_FORCE,
        EntityType.ARTIFACT,
        EntityType.OTHER,
      ].map((type) => ({
        label: ENTITY_TYPE_LABELS[type] || type,
        value: type,
      })),
    ],
    []
  );

  // Tùy chọn thời kỳ lịch sử (Tải động từ CSDL)
  const periodFilterOptions = useMemo(
    () =>
      periods.map((p) => ({
        label: p.name,
        value: p.id,
        subLabel: p.startYear
          ? `${p.startYear}${p.endYear ? ` – ${p.endYear}` : ''}`
          : undefined,
      })),
    [periods]
  );

  // Tùy chọn trạng thái xuất bản
  const statusOptions = useMemo(
    () => [
      { label: 'Tất cả trạng thái', value: 'ALL' },
      ...[
        ContentStatus.PUBLISHED,
        ContentStatus.DRAFT,
        ContentStatus.PENDING_REVIEW,
        ContentStatus.ARCHIVED,
      ].map((st) => ({
        label: STATUS_LABEL_MAP[st] || st,
        value: st,
      })),
    ],
    []
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-sm text-slate-500">
        <div className="w-5 h-5 border-2 border-slate-300 border-t-amber-800 rounded-full animate-spin mr-2" />
        <span>Đang tải danh sách {isFiguresMode ? 'nhân vật' : 'thực thể'} lịch sử...</span>
      </div>
    );
  }

  return (
    <>
      {!isFiguresMode && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-3 border-b border-slate-200/80 text-xs font-semibold">
          {[
            { key: 'ALL', label: 'Tất cả thực thể' },
            ...[
              EntityType.DYNASTY,
              EntityType.ORGANIZATION,
              EntityType.MILITARY_FORCE,
              EntityType.ARTIFACT,
              EntityType.OTHER,
            ].map((k) => ({ key: k, label: ENTITY_TYPE_LABELS[k] || k })),
          ].map((tab) => {
            const count =
              tab.key === 'ALL'
                ? entities.length
                : entities.filter((e) => e.type === tab.key).length;
            const isActive =
              tab.key === 'ALL'
                ? selectedCategories.length === 0
                : selectedCategories.length === 1 && selectedCategories[0] === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  if (tab.key === 'ALL') {
                    setSelectedCategories([]);
                  } else {
                    setSelectedCategories([tab.key]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-2xs font-bold'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-amber-700/80 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <DataTable<HistoricalEntityItem>
        columns={columns}
        data={displayedEntities}
        searchPlaceholder={
          isFiguresMode
            ? 'Tìm kiếm nhân vật, danh nhân, tướng lĩnh, anh hùng lịch sử...'
            : 'Tìm kiếm nhân vật, triều đại, hiện vật lịch sử...'
        }
        customPrimaryAction={renderCreateMenu()}
        onView={(item) => {
          router.push(resolveDetailUrl(item.id));
        }}
        onEdit={(item) => {
          router.push(resolveDetailUrl(item.id));
        }}
        onDelete={(item) => setDeletingEntity(item)}
        filters={[
          {
            label: 'Thời kỳ lịch sử',
            options: periodFilterOptions,
            selectedValues: selectedPeriodIds,
            isMultiSelect: true,
            onSelectMultiple: setSelectedPeriodIds,
          },
          ...(isFiguresMode
            ? [
                {
                  label: 'Vai trò',
                  options: roleFilterOptions,
                  selectedValues: selectedRoles,
                  isMultiSelect: true,
                  onSelectMultiple: setSelectedRoles,
                },
              ]
            : [
                {
                  label: 'Phân loại',
                  options: categoryOptions,
                  selectedValues: selectedCategories,
                  isMultiSelect: true,
                  onSelectMultiple: setSelectedCategories,
                },
              ]),
          {
            label: 'Trạng thái',
            options: statusOptions,
            selectedValue: selectedStatus,
            onSelect: setSelectedStatus,
          },
        ]}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(deletingEntity)}
        title="Xóa Thực thể Lịch sử"
        message={`Bạn có chắc chắn muốn xóa "${deletingEntity?.name}" khỏi cơ sở dữ liệu? Toàn bộ các liên kết đồ thị quan hệ sẽ bị gỡ bỏ.`}
        confirmLabel={isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
        onConfirm={handleDeleteEntity}
        onClose={() => setDeletingEntity(null)}
      />
    </>
  );
}
