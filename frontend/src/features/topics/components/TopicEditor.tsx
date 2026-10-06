'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { ContentStatus, LearningPathType } from '@/constants/enums';
import { PeriodItem } from '@/types/models/period.type';
import { TopicItem } from '@/types/models/topic.type';
import { TopicApiService } from '@/services/entities/topic.service';
import { PeriodApiService } from '@/services/entities/period.service';
import { extractErrorMessage } from '@/services/api';

export interface TopicEditorProps {
  topicId?: string;
}

export function TopicEditor({ topicId }: TopicEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParentId = searchParams.get('parentId') || '';

  const isEditMode = Boolean(topicId);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Dữ liệu options
  const [periods, setPeriods] = useState<PeriodItem[]>([]);
  const [allTopics, setAllTopics] = useState<TopicItem[]>([]);
  const [childrenTopics, setChildrenTopics] = useState<TopicItem[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [parentId, setParentId] = useState('');
  const [pathType, setPathType] = useState<LearningPathType>(LearningPathType.CHRONOLOGICAL);
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [isSequential, setIsSequential] = useState(false);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);
  const [createdAt, setCreatedAt] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string>('');

  // Tải chi tiết chủ đề con nếu đang ở edit mode
  const fetchTopicDetail = useCallback(async (id: string) => {
    try {
      const detail = await TopicApiService.getTopicById(id);
      if (detail) {
        setName(detail.name || '');
        setPeriodId(detail.period?.id || detail.periodId || '');
        setParentId(detail.parentId || '');
        setPathType(detail.pathType || LearningPathType.CHRONOLOGICAL);
        setDisplayOrder(detail.displayOrder ?? 1);
        setDescription(detail.description || '');
        setIsSequential(Boolean(detail.isSequential));
        setStatus(detail.status || ContentStatus.PUBLISHED);
        setCreatedAt(detail.createdAt || '');
        setUpdatedAt(detail.updatedAt || '');
        if (Array.isArray(detail.children)) {
          setChildrenTopics(detail.children);
        }
      }
    } catch (err) {
      console.error('Failed to load topic detail:', err);
      alert(extractErrorMessage(err, 'Không thể tải thông tin chi tiết chủ đề.'));
      router.push('/topics');
    }
  }, [router]);

  useEffect(() => {
    setLoadingInitial(true);
    Promise.all([
      PeriodApiService.getPeriods({ limit: 100 }).catch(() => ({ items: [] })),
      TopicApiService.getTopics({ limit: 100 }).catch(() => ({ items: [] })),
    ])
      .then(async ([perRes, topRes]) => {
        setPeriods(perRes.items || []);
        setAllTopics(topRes.items || []);

        if (isEditMode && topicId) {
          await fetchTopicDetail(topicId);
        } else {
          // Create Mode: Nhận parentId từ query param nếu có
          if (queryParentId) {
            setParentId(queryParentId);
            // Kế thừa periodId từ chủ đề cha nếu cha có periodId
            const parentTopic = (topRes.items || []).find((t) => t.id === queryParentId);
            if (parentTopic?.periodId || parentTopic?.period?.id) {
              setPeriodId(parentTopic.periodId || parentTopic.period?.id || '');
            }
          }
        }
      })
      .finally(() => setLoadingInitial(false));
  }, [isEditMode, topicId, queryParentId, fetchTopicDetail]);

  // Lọc các chủ đề anh/chị/em (siblings) cùng giai đoạn và cùng chủ đề cha
  const siblings = useMemo(() => {
    return allTopics
      .filter((t) => {
        const sameParent = (t.parentId || '') === (parentId || '');
        const samePeriod = (t.period?.id || t.periodId || '') === (periodId || '');
        const notSelf = !isEditMode || t.id !== topicId;
        return sameParent && samePeriod && notSelf;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [allTopics, parentId, periodId, isEditMode, topicId]);

  // Tính vị trí kế tiếp gợi ý
  const maxSiblingOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.displayOrder ?? 0)) : 0;
  const suggestedNextOrder = maxSiblingOrder + 1;

  // Tự động gán vị trí kế tiếp khi tạo mới
  useEffect(() => {
    if (!isEditMode && siblings.length > 0) {
      setDisplayOrder(suggestedNextOrder);
    }
  }, [parentId, periodId, siblings.length, isEditMode, suggestedNextOrder]);

  // Danh sách xem trước thứ tự (Timeline Sequence Preview)
  const previewSequence = useMemo(() => {
    const currentVirtualItem = {
      id: '__CURRENT__',
      name: name.trim() || (isEditMode ? 'Chủ đề hiện tại' : 'Chủ đề mới đang nhập'),
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
  }, [siblings, name, displayOrder, isEditMode]);

  // Danh sách chủ đề có thể chọn làm cha (loại trừ chính nó và các con của nó)
  const availableParents = allTopics.filter((t) => {
    if (!isEditMode) return true;
    if (t.id === topicId) return false;
    if (childrenTopics.some((c) => c.id === t.id)) return false;
    return true;
  });

  // Danh sách chủ đề có thể chọn để gán làm con
  const availableCandidatesToAttach = allTopics.filter((t) => {
    if (!isEditMode || !topicId) return false;
    if (t.id === topicId) return false;
    if (t.parentId === topicId) return false;
    if (childrenTopics.some((c) => c.id === t.id)) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Vui lòng nhập tên chủ đề.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        periodId: periodId ? periodId : null,
        parentId: parentId ? parentId : null,
        pathType,
        displayOrder: Number(displayOrder || 0),
        isSequential,
        status,
      };

      if (isEditMode && topicId) {
        await TopicApiService.updateTopic(topicId, payload);
      } else {
        await TopicApiService.createTopic({
          ...payload,
          periodId: payload.periodId || undefined,
          parentId: payload.parentId || undefined,
        });
      }
      router.push('/topics');
    } catch (err) {
      console.error('Failed to save topic:', err);
      alert(extractErrorMessage(err, 'Không thể lưu chủ đề lịch sử.'));
    } finally {
      setSaving(false);
    }
  };

  // Hành động gắn một chủ đề con vào chủ đề này
  const handleAttachChild = async () => {
    if (!topicId || !selectedCandidateId) return;
    try {
      setActionLoading(true);
      await TopicApiService.assignChildren(topicId, [selectedCandidateId]);
      if (topicId) await fetchTopicDetail(topicId);
      const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
      setAllTopics(updatedTopics.items || []);
      setSelectedCandidateId('');
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể gắn chủ đề con'));
    } finally {
      setActionLoading(false);
    }
  };

  // Hành động tách chủ đề con
  const handleDetachChild = async (childId: string, childName: string) => {
    if (!topicId) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn tách chủ đề "${childName}" ra khỏi chủ đề này không? Chủ đề này sẽ trở thành Chủ đề gốc độc lập.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await TopicApiService.removeChild(topicId, childId);
      if (topicId) await fetchTopicDetail(topicId);
      const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
      setAllTopics(updatedTopics.items || []);
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể tách chủ đề con'));
    } finally {
      setActionLoading(false);
    }
  };

  const selectedParent = allTopics.find((t) => t.id === parentId);
  const selectedPeriod = periods.find((p) => p.id === periodId);

  if (loadingInitial) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 text-sm flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <span>Đang tải dữ liệu chủ đề...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => router.push('/topics')}
            className="text-xs text-slate-500 hover:text-slate-900 inline-flex items-center gap-1.5 mb-2 transition"
          >
            <span>←</span>
            <span>Quay lại danh sách Chủ đề</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              {isEditMode ? 'Chỉnh sửa Chủ đề lịch sử' : 'Thêm Chủ đề mới'}
            </h1>
            {isEditMode && (
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                ID: {topicId?.slice(0, 8)}...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/topics')}
            className="btn-secondary text-xs px-3.5 py-2"
            disabled={saving}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary text-xs px-4 py-2 font-medium"
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Tạo chủ đề'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Editorial 2-Column Master-Detail Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT TRÁI (Main Content - 2 spans) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Block 1: Thông tin cốt lõi */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>01. Nội dung cốt lõi</span>
              </h2>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700 block mb-1">
                    Tên chủ đề <b className="text-rose-500">*</b>
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Lịch sử Châu Âu: Thời kỳ Khai sáng và Cách mạng"
                    required
                    className="w-full text-base font-medium px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-400 transition"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-700 block mb-1">Mô tả bối cảnh & Mục tiêu học tập</span>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Nhập bối cảnh lịch sử, ý nghĩa và phạm vi kiến thức chính của chủ đề này..."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:border-slate-400 transition leading-relaxed"
                  />
                </label>
              </div>
            </div>

            {/* Block 2: Dòng thời gian & Vị trí thứ tự trực quan */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span>02. Dòng thời gian & Vị trí thứ tự</span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDisplayOrder(1)}
                    className="text-[11px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md transition"
                  >
                    Đầu tiên (#1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayOrder(suggestedNextOrder)}
                    className="text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md transition"
                  >
                    Kế tiếp cuối danh sách (#{suggestedNextOrder})
                  </button>
                </div>
              </div>

              {/* Ngữ cảnh xếp thứ tự */}
              <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-lg p-3 mb-4 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono mb-0.5">Phạm vi xếp thứ tự:</span>
                  <span className="font-semibold text-slate-800">
                    {parentId
                      ? `Nhánh con trong Chủ đề cha "${selectedParent?.name || 'Chủ đề cha'}" (Cấp 2)`
                      : `Chủ đề gốc trong Giai đoạn "${selectedPeriod?.name || 'Phi niên đại (Toàn cục)'}" (Cấp 1)`}
                  </span>
                </div>

                {/* Bộ điều khiển số thứ tự */}
                <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
                  <button
                    type="button"
                    onClick={() => setDisplayOrder((prev) => Math.max(0, Number(prev || 0) - 1))}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-r border-slate-200 transition font-bold text-sm"
                    title="Giảm thứ tự"
                  >
                    –
                  </button>
                  <input
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(Math.max(0, Number(e.target.value)))}
                    min={0}
                    className="w-14 text-center font-mono text-sm font-bold py-1 border-none focus:outline-none bg-transparent text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setDisplayOrder((prev) => Number(prev || 0) + 1)}
                    className="px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-l border-slate-200 transition font-bold text-sm"
                    title="Tăng thứ tự"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Dải xem trước dòng thời gian thực tế */}
              <div>
                <span className="text-[11px] font-medium text-slate-500 block mb-2 uppercase tracking-wide">
                  Xem trước dòng thời gian thực tế ({previewSequence.length} chủ đề cùng cấp):
                </span>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {previewSequence.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition ${
                        item.isCurrent
                          ? 'border-2 border-blue-500 bg-blue-50/70 text-blue-950 font-semibold shadow-xs'
                          : 'border border-slate-200 bg-slate-50/40 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <span
                          className={`font-mono text-xs px-2 py-0.5 rounded shrink-0 ${
                            item.isCurrent
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 font-medium'
                          }`}
                        >
                          #{String(item.displayOrder).padStart(2, '0')}
                        </span>
                        <span className="truncate">{item.name}</span>
                      </div>

                      {item.isCurrent && (
                        <span className="text-[11px] font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                          ➔ Vị trí đang chọn
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Block 3: Quản lý Chủ đề con trực thuộc (Chỉ trong Edit Mode) */}
            {isEditMode && topicId && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <span>03. Chủ đề con trực thuộc</span>
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {childrenTopics.length} chủ đề con
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Các phân mục con trực thuộc chủ đề này trong cấu trúc cây tri thức
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/topics/create?parentId=${topicId}`)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2.5 py-1.5 rounded-md border border-blue-200 transition"
                  >
                    <span>+ Tạo chủ đề con mới</span>
                  </button>
                </div>

                {/* Danh sách chủ đề con hiện tại */}
                {childrenTopics.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {childrenTopics.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <Icon name={IconName.FOLDER} size={15} className="text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-900 truncate">{child.name}</span>
                          {child._count?.lessons !== undefined && (
                            <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">
                              {child._count.lessons} bài học
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/topics/${child.id}`)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-white transition"
                          >
                            Xem / Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDetachChild(child.id, child.name)}
                            disabled={actionLoading}
                            className="text-[11px] text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition"
                            title="Tách chủ đề này ra thành chủ đề gốc độc lập"
                          >
                            Tách ra
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg p-5 text-center mb-4">
                    Chủ đề này chưa có chủ đề con nào trực thuộc.
                  </div>
                )}

                {/* Gắn thêm chủ đề con hiện có */}
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-xs font-medium text-slate-700 block mb-2">
                    Gắn thêm một chủ đề hiện có vào chủ đề này:
                  </span>
                  <div className="flex gap-2">
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      disabled={actionLoading || availableCandidatesToAttach.length === 0}
                      className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 focus:bg-white focus:outline-none"
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
                      className="btn-secondary text-xs px-3.5 py-2 whitespace-nowrap"
                    >
                      {actionLoading ? 'Đang gắn...' : 'Gắn vào làm con'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CỘT PHẢI (Inspector Sidebar - 1 span) */}
          <div className="space-y-6">
            {/* Card: Trạng thái & Xuất bản */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Trạng thái xuất bản
              </h3>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 block mb-1">Trạng thái nội dung</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ContentStatus)}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  >
                    <option value={ContentStatus.DRAFT}>Bản nháp (Draft)</option>
                    <option value={ContentStatus.PENDING_REVIEW}>Chờ duyệt (Pending Review)</option>
                    <option value={ContentStatus.PUBLISHED}>Xuất bản (Published)</option>
                    <option value={ContentStatus.ARCHIVED}>Lưu trữ (Archived)</option>
                  </select>
                </label>

                {isEditMode && createdAt && (
                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 space-y-1">
                    <div>Tạo ngày: {new Date(createdAt).toLocaleDateString('vi-VN')}</div>
                    {updatedAt && <div>Cập nhật: {new Date(updatedAt).toLocaleDateString('vi-VN')}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Card: Phân cấp quan hệ */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Phân cấp quan hệ
              </h3>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 block mb-1">Chủ đề cha (Phân cấp)</span>
                  <select
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Không có (Chủ đề gốc cấp 1) --</option>
                    {availableParents.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Để trống nếu là chủ đề gốc. Chọn chủ đề khác nếu đây là phân mục con.
                  </span>
                </label>

                <label className="block">
                  <span className="text-xs font-medium text-slate-600 block mb-1">Giai đoạn lịch sử</span>
                  <select
                    value={periodId}
                    onChange={(e) => setPeriodId(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Không thuộc giai đoạn (Phi niên đại) --</option>
                    {periods.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Gắn với giai đoạn niên đại hoặc chuyên đề mở rộng.
                  </span>
                </label>
              </div>
            </div>

            {/* Card: Cấu hình tiến trình học */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Cấu hình tiến trình học
              </h3>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 block mb-1">Loại tiến trình</span>
                  <select
                    value={pathType}
                    onChange={(e) => setPathType(e.target.value as LearningPathType)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  >
                    <option value={LearningPathType.CHRONOLOGICAL}>Theo niên đại (Chronological)</option>
                    <option value={LearningPathType.THEMATIC}>Chuyên đề xuyên suốt (Thematic)</option>
                    <option value={LearningPathType.MYTHOLOGICAL}>Huyền sử & Dân gian (Mythological)</option>
                  </select>
                </label>

                <label className="flex items-start gap-2.5 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSequential}
                    onChange={(e) => setIsSequential(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-blue-600"
                  />
                  <div className="text-xs">
                    <span className="font-medium text-slate-800 block">Yêu cầu học tuần tự</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Học sinh phải hoàn thành bài trước để mở khóa bài tiếp theo.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
