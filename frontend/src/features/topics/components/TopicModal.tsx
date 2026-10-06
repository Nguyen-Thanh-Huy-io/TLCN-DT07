'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { TopicItem } from '@/types/models/topic.type';
import { PeriodItem } from '@/types/models/period.type';
import { ContentStatus } from '@/constants/enums';
import { PeriodApiService } from '@/services/entities/period.service';
import { TopicApiService } from '@/services/entities/topic.service';
import { extractErrorMessage } from '@/services/api';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';

export interface TopicFormData {
  periodId?: string | null;
  parentId?: string | null;
  name: string;
  description?: string;
  isSequential: boolean;
  displayOrder: number;
  status: ContentStatus;
}

export interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: TopicFormData) => void;
  initialData?: TopicItem | null;
  defaultParentId?: string | null;
  onRefreshList?: () => void;
  onOpenCreateChild?: (parentId: string) => void;
}

export function TopicModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultParentId,
  onRefreshList,
  onOpenCreateChild,
}: TopicModalProps) {
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [allTopics, setAllTopics] = useState<TopicItem[]>([]);
  const [childrenTopics, setChildrenTopics] = useState<TopicItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  const [periodId, setPeriodId] = useState('');
  const [parentId, setParentId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSequential, setIsSequential] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);

  const fetchChildren = useCallback(async (topicId: string) => {
    try {
      const detail = await TopicApiService.getTopicById(topicId);
      if (detail && Array.isArray(detail.children)) {
        setChildrenTopics(detail.children);
      }
    } catch (err) {
      console.error('Failed to load topic children:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setLoadingInitial(true);
      Promise.all([
        PeriodApiService.getPeriods({ limit: 100 }).catch(() => ({ items: [] })),
        TopicApiService.getTopics({ limit: 100 }).catch(() => ({ items: [] })),
      ])
        .then(([perRes, topRes]) => {
          setPeriods(perRes.items || []);
          setAllTopics(topRes.items || []);
        })
        .finally(() => setLoadingInitial(false));

      if (initialData) {
        setPeriodId(initialData.period?.id || initialData.periodId || '');
        setParentId(initialData.parentId || '');
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setIsSequential(Boolean(initialData.isSequential));
        setDisplayOrder(initialData.displayOrder ?? 1);
        setStatus(initialData.status || ContentStatus.PUBLISHED);
        fetchChildren(initialData.id);
      } else {
        setPeriodId('');
        setParentId(defaultParentId || '');
        setName('');
        setDescription('');
        setIsSequential(false);
        setDisplayOrder(1);
        setStatus(ContentStatus.PUBLISHED);
        setChildrenTopics([]);
      }
      setSelectedCandidateId('');
    }
  }, [isOpen, initialData, defaultParentId, fetchChildren]);

  // Lọc các chủ đề anh/chị/em (siblings) cùng giai đoạn và cùng chủ đề cha
  const siblings = useMemo(() => {
    return allTopics
      .filter((t) => {
        const sameParent = (t.parentId || '') === (parentId || '');
        const samePeriod = (t.period?.id || t.periodId || '') === (periodId || '');
        const notSelf = !initialData || t.id !== initialData.id;
        return sameParent && samePeriod && notSelf;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [allTopics, parentId, periodId, initialData]);

  // Tính vị trí kế tiếp gợi ý
  const maxSiblingOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.displayOrder ?? 0)) : 0;
  const suggestedNextOrder = maxSiblingOrder + 1;

  // Tự động gợi ý thứ tự tiếp theo khi tạo mới nếu chưa có chỉnh sửa
  useEffect(() => {
    if (!initialData && siblings.length > 0) {
      setDisplayOrder(suggestedNextOrder);
    }
  }, [parentId, periodId, siblings.length, initialData, suggestedNextOrder]);

  // Danh sách kết hợp xem trước trực quan (Timeline Sequence Preview)
  const previewSequence = useMemo(() => {
    const currentVirtualItem = {
      id: '__CURRENT__',
      name: name.trim() || (initialData?.name ?? 'Chủ đề này (đang tạo/sửa)'),
      displayOrder: Number(displayOrder || 0),
      isCurrent: true,
    };

    const combined = [
      ...siblings.map((s) => ({
        id: s.id,
        name: s.name,
        displayOrder: s.displayOrder ?? 0,
        isCurrent: false,
      })),
      currentVirtualItem,
    ];

    return combined.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.isCurrent ? -1 : 1;
    });
  }, [siblings, name, displayOrder, initialData]);

  if (!isOpen) return null;

  // Danh sách chủ đề có thể chọn làm cha (loại trừ chính nó và các con hiện tại của nó)
  const availableParents = allTopics.filter((t) => {
    if (!initialData) return true;
    if (t.id === initialData.id) return false;
    if (childrenTopics.some((c) => c.id === t.id)) return false;
    return true;
  });

  // Danh sách chủ đề có thể chọn để gán vào làm con của chủ đề hiện tại
  const availableCandidatesToAttach = allTopics.filter((t) => {
    if (!initialData) return false;
    if (t.id === initialData.id) return false;
    if (t.parentId === initialData.id) return false;
    if (childrenTopics.some((c) => c.id === t.id)) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên chủ đề.');
      return;
    }

    onSave({
      periodId: periodId ? periodId : null,
      parentId: parentId ? parentId : null,
      name: name.trim(),
      description: description.trim() || undefined,
      isSequential,
      displayOrder: Number(displayOrder || 0),
      status,
    });
  };

  // Hành động gắn một chủ đề hiện có vào chủ đề này
  const handleAttachChild = async () => {
    if (!initialData || !selectedCandidateId) return;
    try {
      setActionLoading(true);
      await TopicApiService.assignChildren(initialData.id, [selectedCandidateId]);
      await fetchChildren(initialData.id);
      const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
      setAllTopics(updatedTopics.items || []);
      setSelectedCandidateId('');
      onRefreshList?.();
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể gắn chủ đề con'));
    } finally {
      setActionLoading(false);
    }
  };

  // Hành động tách một chủ đề con ra thành chủ đề gốc độc lập
  const handleDetachChild = async (childId: string, childName: string) => {
    if (!initialData) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn tách chủ đề "${childName}" ra khỏi chủ đề này không? Chủ đề này sẽ trở thành Chủ đề gốc độc lập.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await TopicApiService.removeChild(initialData.id, childId);
      await fetchChildren(initialData.id);
      const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
      setAllTopics(updatedTopics.items || []);
      onRefreshList?.();
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể tách chủ đề con'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 680, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              {initialData ? 'Chỉnh sửa Chủ đề lịch sử' : 'Thêm Chủ đề mới'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấu hình thông tin cơ bản, vị trí dòng thời gian và quan hệ phân cấp
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ overflowY: 'auto' }}>
          {/* Section 1: Phân cấp Cấp trên */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Phân cấp Cấp trên & Giai đoạn
              </span>
              {parentId && (
                <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Thuộc cấp con
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="field">
                <span className="text-xs font-medium text-slate-700">Chủ đề cha</span>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  disabled={loadingInitial}
                  className="bg-white"
                >
                  <option value="">-- Không có (Đây là Chủ đề gốc) --</option>
                  {availableParents.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1">
                  Chọn chủ đề cấp trên nếu là nhánh con. Để trống nếu là chủ đề gốc.
                </span>
              </label>

              <label className="field">
                <span className="text-xs font-medium text-slate-700">Giai đoạn lịch sử</span>
                <select
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  disabled={loadingInitial}
                  className="bg-white"
                >
                  <option value="">-- Không thuộc giai đoạn (Phi niên đại) --</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1">
                  Gắn với giai đoạn niên đại tương ứng hoặc chuyên đề mở rộng.
                </span>
              </label>
            </div>
          </div>

          {/* Section 2: Thông tin chủ đề */}
          <div className="space-y-3 mb-4">
            <label className="field">
              <span className="text-xs font-medium text-slate-700">
                Tên chủ đề <b className="text-rose-500">*</b>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Lịch sử Châu Âu: Thời kỳ Khai sáng và Cách mạng"
                required
                className="bg-white"
              />
            </label>

            {/* Visual Order Placement & Timeline Preview (Taste-Skill Standard) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    2. Thứ tự hiển thị & Vị trí dòng thời gian
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDisplayOrder(1)}
                    className="text-[11px] font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded transition"
                    title="Đặt lên vị trí đầu tiên"
                  >
                    Đầu tiên (#1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayOrder(suggestedNextOrder)}
                    className="text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded transition"
                    title="Đặt ở vị trí kế tiếp cuối danh sách"
                  >
                    Kế tiếp (#{suggestedNextOrder})
                  </button>
                </div>
              </div>

              {/* Bộ điều khiển số thứ tự tinh tế */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center border border-slate-200 rounded-md bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => setDisplayOrder((prev) => Math.max(0, Number(prev || 0) - 1))}
                    className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-r border-slate-200 transition text-sm font-semibold"
                    title="Giảm thứ tự"
                  >
                    –
                  </button>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Math.max(0, Number(e.target.value)))}
                    min={0}
                    className="w-16 text-center font-mono text-xs font-semibold py-1 border-none focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setDisplayOrder((prev) => Number(prev || 0) + 1)}
                    className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-l border-slate-200 transition text-sm font-semibold"
                    title="Tăng thứ tự"
                  >
                    +
                  </button>
                </div>

                <div className="text-[11px] text-slate-600">
                  {parentId ? (
                    <span>
                      Phạm vi: Xếp thứ tự trong Chủ đề cha <b>"{allTopics.find((t) => t.id === parentId)?.name || 'Chủ đề cha'}"</b> (Cấp 2)
                    </span>
                  ) : (
                    <span>
                      Phạm vi: Xếp thứ tự trong Giai đoạn <b>"{periods.find((p) => p.id === periodId)?.name || 'Phi niên đại'}"</b> (Cấp 1 - Gốc)
                    </span>
                  )}
                </div>
              </div>

              {/* Dải xem trước dòng thời gian (Live Sequence Preview Strip) */}
              <div className="border border-slate-200/80 rounded-md bg-white p-2.5">
                <span className="text-[11px] font-medium text-slate-500 block mb-1.5 uppercase tracking-wide">
                  {parentId
                    ? `Xem trước thứ tự các nhánh con (${previewSequence.length} chủ đề):`
                    : `Xem trước thứ tự các chủ đề gốc (${previewSequence.length} chủ đề):`}
                </span>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {previewSequence.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                        item.isCurrent
                          ? 'border border-blue-400 bg-blue-50/80 text-blue-900 font-semibold shadow-xs'
                          : 'border border-slate-200 bg-slate-50/40 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`font-mono text-[11px] px-1.5 py-0.5 rounded shrink-0 ${
                            item.isCurrent
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          #{String(item.displayOrder).padStart(2, '0')}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.isCurrent && (
                        <span className="text-[10px] font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded shrink-0">
                          Vị trí đang chọn
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label className="field">
                <span className="text-xs font-medium text-slate-700">Trạng thái</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ContentStatus)}
                  className="bg-white"
                >
                  <option value={ContentStatus.DRAFT}>Bản nháp (Draft)</option>
                  <option value={ContentStatus.PENDING_REVIEW}>Chờ duyệt (Pending Review)</option>
                  <option value={ContentStatus.PUBLISHED}>Xuất bản (Published)</option>
                  <option value={ContentStatus.ARCHIVED}>Lưu trữ (Archived)</option>
                </select>
              </label>

              <label className="field-checkbox" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
                <input
                  type="checkbox"
                  checked={isSequential}
                  onChange={(e) => setIsSequential(e.target.checked)}
                />
                <span className="text-xs text-slate-700">Yêu cầu học tuần tự</span>
              </label>
            </div>

            <label className="field">
              <span className="text-xs font-medium text-slate-700">Mô tả chủ đề</span>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả bối cảnh và mục tiêu học tập của chủ đề..."
                className="bg-white"
              />
            </label>
          </div>

          {/* Section 3: Quản lý Chủ đề con trực thuộc (Outbound Hierarchy) */}
          {initialData && (
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    3. Chủ đề con trực thuộc
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                    {childrenTopics.length} chủ đề con
                  </span>
                </div>
                {onOpenCreateChild && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCreateChild(initialData.id);
                    }}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>+ Tạo chủ đề con mới</span>
                  </button>
                )}
              </div>

              {/* Danh sách các chủ đề con hiện tại */}
              {childrenTopics.length > 0 ? (
                <div className="space-y-1.5 mb-3">
                  {childrenTopics.map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-md text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <Icon name={IconName.FOLDER} size={14} className="text-slate-400 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">{child.name}</span>
                        {child._count?.lessons !== undefined && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {child._count.lessons} bài học
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDetachChild(child.id, child.name)}
                        disabled={actionLoading}
                        className="text-[11px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition shrink-0"
                        title="Tách chủ đề này ra thành chủ đề gốc độc lập"
                      >
                        Tách ra
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 bg-white border border-dashed border-slate-200 rounded-md p-3 text-center mb-3">
                  Chưa có chủ đề con nào trực thuộc chủ đề này.
                </div>
              )}

              {/* Gắn thêm chủ đề con hiện có */}
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[11px] font-medium text-slate-600 block mb-1.5">
                  Gắn thêm chủ đề hiện có vào chủ đề này:
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    disabled={actionLoading || availableCandidatesToAttach.length === 0}
                    className="text-xs bg-white flex-1"
                  >
                    <option value="">
                      {availableCandidatesToAttach.length > 0
                        ? '-- Chọn chủ đề cần gán làm con --'
                        : '-- Không có chủ đề khả dụng để gán --'}
                    </option>
                    {availableCandidatesToAttach.map((cand) => (
                      <option key={cand.id} value={cand.id}>
                        {cand.name} {cand.parent ? `(Đang là con của: ${cand.parent.name})` : '(Chủ đề gốc)'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAttachChild}
                    disabled={!selectedCandidateId || actionLoading}
                    className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap"
                  >
                    {actionLoading ? 'Đang gắn...' : 'Gắn vào'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="modal-actions pt-3 border-t border-slate-100">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {initialData ? 'Lưu thay đổi' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
