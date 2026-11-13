'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/icons/Icon';
import { IconName, ContentStatus } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import { TopicItem } from '@/types/models';
import { TopicApiService } from '@/services/entities/topic.service';
import { extractErrorMessage } from '@/services/api';
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';
import { EditorRevisionBanner } from '@/features/revisions/RevisionPanels';
import { TopicParentModalPicker } from './TopicParentModalPicker';
import { CurriculumSidePanel } from '@/features/curriculum/components/CurriculumSidePanel';
import {
  TopicEditorHeader,
  PublishActionType,
} from './TopicEditorPanels';
import { TopicChildrenManager } from './TopicEditorPanels';
import {
  TopicInspectorSidebar,
  TimelinePreviewItem,
} from './TopicEditorPanels';

export interface TopicEditorProps {
  topicId?: string;
}

const LABEL_ROOT_TOPIC = 'Chủ đề gốc';
const LABEL_CHILD_TOPIC = 'Chủ đề trực thuộc';

export function TopicEditor({ topicId }: TopicEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParentId = searchParams.get('parentId') || '';

  const isEditMode = Boolean(topicId);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingAction, setSavingAction] = useState<PublishActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Dữ liệu options
  const [allTopics, setAllTopics] = useState<TopicItem[]>([]);
  const [childrenTopics, setChildrenTopics] = useState<TopicItem[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  // Modal Picker state & Trợ lý Sơ đồ Cây
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [isCurriculumPreviewOpen, setIsCurriculumPreviewOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [parentId, setParentId] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [isSequential, setIsSequential] = useState(false);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);

  // Phiên bản hóa
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createdAt, setCreatedAt] = useState<string>('');
  const [updatedAt, setUpdatedAt] = useState<string>('');

  // Tải chi tiết chủ đề nếu đang ở edit mode
  const fetchTopicDetail = useCallback(async (id: string) => {
    try {
      const fetched = await TopicApiService.getTopicById(id);
      const { detail, pending } = fetched
        ? await withPendingDraft('TOPIC', id, fetched)
        : { detail: fetched, pending: null };
      setPendingRevision(pending);
      if (detail) {
        setName(detail.name || '');
        setCoverImageUrl(detail.coverImageUrl || '');
        setParentId(detail.parentId || '');
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
      router.push(APP_ROUTES.CURRICULUM);
    }
  }, [router]);

  useEffect(() => {
    let active = true;
    TopicApiService.getTopics({ limit: 100 })
      .then(async (topRes) => {
        if (!active) return;
        setAllTopics(topRes.items || []);

        if (isEditMode && topicId) {
          await fetchTopicDetail(topicId);
        } else if (queryParentId) {
          setParentId(queryParentId);
        }
      })
      .catch((err) => {
        console.error('Failed to load topics:', err);
      })
      .finally(() => {
        if (active) setLoadingInitial(false);
      });

    return () => {
      active = false;
    };
  }, [isEditMode, topicId, queryParentId, fetchTopicDetail, reloadKey]);

  // Lọc các chủ đề anh/chị/em (siblings) cùng chủ đề cha
  const siblings = useMemo(() => {
    return allTopics
      .filter((t) => {
        const sameParent = (t.parentId || '') === (parentId || '');
        const notSelf = !isEditMode || t.id !== topicId;
        return sameParent && notSelf;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [allTopics, parentId, isEditMode, topicId]);

  // Vị trí lớn nhất hiện có trong danh sách anh/chị/em
  const maxSiblingOrder = useMemo(() => {
    return siblings.length > 0 ? Math.max(...siblings.map((s) => s.displayOrder ?? 0)) : 0;
  }, [siblings]);

  // Tự động gán vị trí kế tiếp khi tạo mới hoặc khi đổi chủ đề cha
  useEffect(() => {
    if (!isEditMode) {
      queueMicrotask(() => {
        setDisplayOrder(maxSiblingOrder + 1);
      });
    }
  }, [parentId, maxSiblingOrder, isEditMode]);

  // Tính toán Breadcrumb & Cấp bậc phân cấp của vị trí đang chọn
  const parentBreadcrumb = useMemo(() => {
    if (!parentId) {
      return {
        levelName: LABEL_ROOT_TOPIC,
        levelBadgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        pathText: 'Chủ đề gốc (Cấp cao nhất)',
      };
    }

    const path: string[] = [];
    let curr = allTopics.find((t) => t.id === parentId);

    while (curr) {
      path.unshift(curr.name);
      if (curr.parentId) {
        curr = allTopics.find((t) => t.id === curr?.parentId);
      } else {
        break;
      }
    }

    return {
      levelName: LABEL_CHILD_TOPIC,
      levelBadgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      pathText: path.join(' > '),
    };
  }, [parentId, allTopics]);

  // Tìm chủ đề anh/chị/em đứng ngay trước vị trí đang chọn
  const precedingSibling = useMemo(() => {
    const sorted = [...siblings].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const targetOrder = Math.max(1, Number(displayOrder || 1));
    const pre = sorted.filter((s, idx) => idx + 1 < targetOrder);
    return pre.length > 0 ? pre[pre.length - 1] : null;
  }, [siblings, displayOrder]);

  // Câu giải thích vị trí tự nhiên
  const orderExplanationText = useMemo(() => {
    if (siblings.length === 0) {
      return 'Là chủ đề đầu tiên trong nhánh này';
    }
    const targetOrder = Math.max(1, Number(displayOrder || 1));
    if (targetOrder === 1) {
      return 'Xếp ở đầu lộ trình (ưu tiên học trước)';
    }
    if (targetOrder > siblings.length) {
      return `Đứng sau: "${siblings[siblings.length - 1].name}" (cuối lộ trình)`;
    }
    if (precedingSibling) {
      return `Chèn sau: "${precedingSibling.name}"`;
    }
    return `Xếp ở vị trí #${String(targetOrder).padStart(2, '0')}`;
  }, [siblings, precedingSibling, displayOrder]);

  // Danh sách dòng thời gian dọc
  const previewTimeline: TimelinePreviewItem[] = useMemo(() => {
    const sortedSiblings = [...siblings].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    const targetOrder = Math.max(1, Number(displayOrder || 1));
    const items: TimelinePreviewItem[] = [];

    let currentInserted = false;
    let rank = 1;

    for (const sib of sortedSiblings) {
      if (!currentInserted && rank >= targetOrder) {
        items.push({
          id: '__CURRENT__',
          name: name.trim() || (isEditMode ? 'Chủ đề hiện tại' : 'Chủ đề mới đang nhập'),
          displayOrder: rank,
          isCurrent: true,
        });
        rank++;
        currentInserted = true;
      }

      items.push({
        id: sib.id,
        name: sib.name,
        displayOrder: rank,
        isCurrent: false,
        isShifted: currentInserted,
      });
      rank++;
    }

    if (!currentInserted) {
      items.push({
        id: '__CURRENT__',
        name: name.trim() || (isEditMode ? 'Chủ đề hiện tại' : 'Chủ đề mới đang nhập'),
        displayOrder: rank,
        isCurrent: true,
      });
    }

    return items;
  }, [siblings, name, displayOrder, isEditMode]);

  // Danh sách chủ đề có thể chọn để gán làm con (trong Edit Mode)
  const availableCandidatesToAttach = useMemo(() => {
    if (!isEditMode || !topicId) return [];
    return allTopics.filter((t) => {
      if (t.id === topicId) return false;
      if (t.parentId === topicId) return false;
      if (childrenTopics.some((c) => c.id === t.id)) return false;
      return true;
    });
  }, [allTopics, isEditMode, topicId, childrenTopics]);

  const handleAction = async (action: PublishActionType) => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên chủ đề.');
      return;
    }

    const targetStatus = action === PublishActionType.DRAFT ? ContentStatus.DRAFT : ContentStatus.PUBLISHED;

    try {
      setSavingAction(action);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        parentId: parentId ? parentId : null,
        displayOrder: Number(displayOrder || 0),
        isSequential,
        status: targetStatus,
      };

      if (isEditMode && topicId) {
        const saved = await TopicApiService.updateTopic(topicId, payload);
        if (isRevisionPending(saved)) {
          setPendingRevision(saved.revision);
          setRevisionNotice(saved.message);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      } else {
        await TopicApiService.createTopic({
          ...payload,
          parentId: payload.parentId || undefined,
        });
      }
      router.push(APP_ROUTES.CURRICULUM);
    } catch (err) {
      console.error('Failed to save topic:', err);
      alert(extractErrorMessage(err, 'Không thể lưu chủ đề lịch sử.'));
    } finally {
      setSavingAction(null);
    }
  };

  const handleAttachChild = async () => {
    if (!topicId || !selectedCandidateId) return;
    try {
      setActionLoading(true);
      await TopicApiService.assignChildren(topicId, [selectedCandidateId]);
      await fetchTopicDetail(topicId);
      const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
      setAllTopics(updatedTopics.items || []);
      setSelectedCandidateId('');
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể gắn chủ đề trực thuộc'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDetachChild = async (childId: string, childName: string) => {
    if (!topicId) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn tách chủ đề "${childName}" ra khỏi chủ đề này không? Chủ đề này sẽ trở thành Chủ đề gốc độc lập.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await TopicApiService.removeChild(topicId, childId);
      await fetchTopicDetail(topicId);
      const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
      setAllTopics(updatedTopics.items || []);
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể tách chủ đề trực thuộc'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickCreateChild = async (childName: string) => {
    if (!topicId) return;
    const nextChildOrder = childrenTopics.length + 1;
    await TopicApiService.createTopic({
      name: childName,
      parentId: topicId,
      displayOrder: nextChildOrder,
      status: ContentStatus.PUBLISHED,
    });

    await fetchTopicDetail(topicId);
    const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
    setAllTopics(updatedTopics.items || []);
  };

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
    <div className="max-w-6xl mx-auto px-4 py-2">
      {isEditMode && (
        <EditorRevisionBanner
          type="TOPIC"
          contentId={topicId}
          status={status}
          pending={pendingRevision}
          notice={revisionNotice}
          onChanged={(message) => {
            setRevisionNotice(message);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      {/* Top Header Bar & Action Controls */}
      <TopicEditorHeader
        isEditMode={isEditMode}
        topicId={topicId}
        status={status}
        savingAction={savingAction}
        isCurriculumPreviewOpen={isCurriculumPreviewOpen}
        onToggleCurriculumPreview={() => setIsCurriculumPreviewOpen((prev) => !prev)}
        onCancel={() => router.push(APP_ROUTES.CURRICULUM)}
        onAction={handleAction}
      />

      <form onSubmit={(e) => { e.preventDefault(); handleAction(PublishActionType.PUBLISH); }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CỘT TRÁI (Main Content - 2 spans) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Block 1: Nội dung cốt lõi */}
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

            {/* Block 2: Phân cấp & Thứ tự học tập */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span>02. Phân cấp & Thứ tự học tập</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác định chủ đề cấp trên và vị trí xuất hiện trên lộ trình học
                </p>
              </div>

              {/* Trực thuộc */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-500 text-xs font-medium shrink-0">Trực thuộc:</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border shrink-0 ${parentBreadcrumb.levelBadgeBg}`}
                  >
                    {parentBreadcrumb.levelName}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate" title={parentBreadcrumb.pathText}>
                    {parentId ? parentBreadcrumb.pathText : LABEL_ROOT_TOPIC}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsParentPickerOpen(true)}
                  className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
                >
                  <Icon name={IconName.FOLDER} size={14} />
                  <span>{parentId ? 'Đổi vị trí phân cấp' : 'Chọn chủ đề cấp trên'}</span>
                </button>
              </div>

              {/* Thứ tự hiển thị */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-medium text-slate-600 shrink-0">Thứ tự hiển thị:</span>
                  <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setDisplayOrder((prev) => Math.max(1, Number(prev || 1) - 1))}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition font-bold text-xs cursor-pointer select-none"
                      title="Giảm thứ tự"
                    >
                      –
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={displayOrder}
                      onChange={(e) => setDisplayOrder(Math.max(1, Number(e.target.value)))}
                      className="w-12 text-center font-mono text-xs font-bold py-1 border-none focus:outline-none bg-transparent text-blue-700"
                    />
                    <button
                      type="button"
                      onClick={() => setDisplayOrder((prev) => Number(prev || 0) + 1)}
                      className="px-2.5 py-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition font-bold text-xs cursor-pointer select-none"
                      title="Tăng thứ tự"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-xs text-slate-600 font-medium">
                    {orderExplanationText}
                  </span>
                </div>
              </div>
            </div>

            {/* Block 3: Quản lý Chủ đề trực thuộc (Chỉ trong Edit Mode) */}
            {isEditMode && topicId && (
              <TopicChildrenManager
                topicId={topicId}
                childrenTopics={childrenTopics}
                availableCandidatesToAttach={availableCandidatesToAttach}
                selectedCandidateId={selectedCandidateId}
                onSelectCandidateId={setSelectedCandidateId}
                actionLoading={actionLoading}
                onAttachChild={handleAttachChild}
                onDetachChild={handleDetachChild}
                onQuickCreateChild={handleQuickCreateChild}
                onNavigateToCreate={() => router.push(`/topics/create?parentId=${topicId}`)}
                onNavigateToEditChild={(childId) => router.push(`/topics/${childId}`)}
              />
            )}
          </div>

          {/* CỘT PHẢI (Inspector Sidebar - 1 span) */}
          <TopicInspectorSidebar
            isEditMode={isEditMode}
            status={status}
            createdAt={createdAt}
            updatedAt={updatedAt}
            displayOrder={displayOrder}
            onSelectDisplayOrder={setDisplayOrder}
            parentBreadcrumbPath={parentBreadcrumb.pathText}
            previewTimeline={previewTimeline}
            isSequential={isSequential}
            onSequentialChange={setIsSequential}
            coverImageUrl={coverImageUrl}
            onCoverImageChange={setCoverImageUrl}
            actionLoading={actionLoading}
            topicName={name}
            description={description}
            onOpenCurriculumPreview={() => setIsCurriculumPreviewOpen(true)}
          />
        </div>
      </form>

      {/* Modal Chọn Phân cấp Chủ đề cha (Tree Picker) */}
      <TopicParentModalPicker
        isOpen={isParentPickerOpen}
        onClose={() => setIsParentPickerOpen(false)}
        onSelect={(newParentId) => {
          setParentId(newParentId || '');
        }}
        topics={allTopics}
        selectedParentId={parentId || null}
        currentTopicId={topicId}
      />

      {/* Trợ lý Sơ đồ Cây tri thức Cố định Mép phải */}
      <CurriculumSidePanel
        isOpen={isCurriculumPreviewOpen}
        onClose={() => setIsCurriculumPreviewOpen(false)}
        currentTopicTitle={name}
        currentDisplayOrder={displayOrder}
        highlightTopicId={topicId || parentId || undefined}
      />
    </div>
  );
}
