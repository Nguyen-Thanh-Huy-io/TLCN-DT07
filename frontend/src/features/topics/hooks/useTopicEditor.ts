'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthSession } from '@/services/auth/use-auth-session';
import { isReviewerRole } from '@/services/auth/public-auth.service';
import { ContentStatus } from '@/constants/enums';
import { APP_ROUTES } from '@/constants/routes';
import type { TopicItem } from '@/types/models';
import { TopicApiService } from '@/services/entities/topic.service';
import { extractErrorMessage } from '@/services/api';
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';
import {
  PublishActionType,
  type TimelinePreviewItem,
} from '../components/TopicEditorParts';

export const LABEL_ROOT_TOPIC = 'Chủ đề gốc';
const LABEL_CHILD_TOPIC = 'Chủ đề trực thuộc';
const TOPIC_OPTIONS_LIMIT = 100;
const CURRENT_TOPIC_PREVIEW_ID = '__CURRENT__';

export interface ParentBreadcrumb {
  levelName: string;
  levelBadgeBg: string;
  pathText: string;
}

const byDisplayOrder = (a: TopicItem, b: TopicItem) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
const clampOrder = (order: number) => Math.max(1, Number(order || 1));

function buildParentBreadcrumb(parentId: string, allTopics: TopicItem[]): ParentBreadcrumb {
  if (!parentId) {
    return {
      levelName: LABEL_ROOT_TOPIC,
      levelBadgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      pathText: 'Chủ đề gốc (Cấp cao nhất)',
    };
  }
  const byId = new Map(allTopics.map((t) => [t.id, t]));
  const path: string[] = [];
  const visited = new Set<string>();
  let current = byId.get(parentId);
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    path.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return {
    levelName: LABEL_CHILD_TOPIC,
    levelBadgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    pathText: path.join(' > '),
  };
}

/** Câu giải thích vị trí của chủ đề giữa các chủ đề cùng cấp (siblings đã sắp xếp). */
function explainOrder(siblings: TopicItem[], displayOrder: number): string {
  if (siblings.length === 0) return 'Là chủ đề đầu tiên trong nhánh này';
  const targetOrder = clampOrder(displayOrder);
  if (targetOrder === 1) return 'Xếp ở đầu lộ trình (ưu tiên học trước)';
  if (targetOrder > siblings.length) {
    return `Đứng sau: "${siblings[siblings.length - 1].name}" (cuối lộ trình)`;
  }
  return `Chèn sau: "${siblings[targetOrder - 2].name}"`;
}

/** Danh sách cùng cấp sau khi chèn chủ đề đang soạn vào vị trí `displayOrder`. */
function buildPreviewTimeline(siblings: TopicItem[], currentName: string, displayOrder: number): TimelinePreviewItem[] {
  const targetOrder = clampOrder(displayOrder);
  const insertAt = Math.min(targetOrder - 1, siblings.length);
  const current: TimelinePreviewItem = { id: CURRENT_TOPIC_PREVIEW_ID, name: currentName, displayOrder: 0, isCurrent: true };
  const ordered = [
    ...siblings.slice(0, insertAt).map((s) => ({ id: s.id, name: s.name, displayOrder: 0, isCurrent: false, isShifted: false })),
    current,
    ...siblings.slice(insertAt).map((s) => ({ id: s.id, name: s.name, displayOrder: 0, isCurrent: false, isShifted: true })),
  ];
  return ordered.map((item, index) => ({ ...item, displayOrder: index + 1 }));
}

/** Toàn bộ state, dữ liệu và thao tác của màn soạn Chủ đề (tạo mới / sửa). */
export function useTopicEditor(topicId?: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParentId = searchParams.get('parentId') || '';
  const isEditMode = Boolean(topicId);
  const user = useAuthSession();
  const isReviewer = Boolean(user && isReviewerRole(user.role));

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [savingAction, setSavingAction] = useState<PublishActionType | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [allTopics, setAllTopics] = useState<TopicItem[]>([]);
  const [childrenTopics, setChildrenTopics] = useState<TopicItem[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  const [name, setName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [parentId, setParentId] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(1);
  const [description, setDescription] = useState('');
  const [isSequential, setIsSequential] = useState(false);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.PUBLISHED);

  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const fetchTopicDetail = useCallback(
    async (id: string) => {
      try {
        const fetched = await TopicApiService.getTopicById(id);
        const { detail, pending } = fetched
          ? await withPendingDraft('TOPIC', id, fetched)
          : { detail: fetched, pending: null };
        setPendingRevision(pending);
        if (!detail) return;
        setName(detail.name || '');
        setCoverImageUrl(detail.coverImageUrl || '');
        setParentId(detail.parentId || '');
        setDisplayOrder(detail.displayOrder ?? 1);
        setDescription(detail.description || '');
        setIsSequential(Boolean(detail.isSequential));
        setStatus(detail.status || ContentStatus.PUBLISHED);
        setCreatedAt(detail.createdAt || '');
        setUpdatedAt(detail.updatedAt || '');
        if (Array.isArray(detail.children)) setChildrenTopics(detail.children);
      } catch (err) {
        alert(extractErrorMessage(err, 'Không thể tải thông tin chi tiết chủ đề.'));
        router.push(APP_ROUTES.CURRICULUM);
      }
    },
    [router],
  );

  const reloadAllTopics = useCallback(async () => {
    const updated = await TopicApiService.getTopics({ limit: TOPIC_OPTIONS_LIMIT });
    setAllTopics(updated.items || []);
  }, []);

  useEffect(() => {
    let active = true;
    TopicApiService.getTopics({ limit: TOPIC_OPTIONS_LIMIT })
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
        alert(extractErrorMessage(err, 'Không thể tải danh sách chủ đề.'));
      })
      .finally(() => {
        if (active) setLoadingInitial(false);
      });
    return () => {
      active = false;
    };
  }, [isEditMode, topicId, queryParentId, fetchTopicDetail, reloadKey]);

  const siblings = useMemo(
    () =>
      allTopics
        .filter((t) => (t.parentId || '') === (parentId || '') && (!isEditMode || t.id !== topicId))
        .sort(byDisplayOrder),
    [allTopics, parentId, isEditMode, topicId],
  );

  const maxSiblingOrder = useMemo(
    () => (siblings.length > 0 ? Math.max(...siblings.map((s) => s.displayOrder ?? 0)) : 0),
    [siblings],
  );

  // Tạo mới / đổi chủ đề cha → mặc định xếp cuối nhánh.
  useEffect(() => {
    if (isEditMode) return;
    queueMicrotask(() => setDisplayOrder(maxSiblingOrder + 1));
  }, [parentId, maxSiblingOrder, isEditMode]);

  const parentBreadcrumb = useMemo(() => buildParentBreadcrumb(parentId, allTopics), [parentId, allTopics]);
  const orderExplanationText = useMemo(() => explainOrder(siblings, displayOrder), [siblings, displayOrder]);
  const previewTimeline = useMemo(() => {
    const currentName = name.trim() || (isEditMode ? 'Chủ đề hiện tại' : 'Chủ đề mới đang nhập');
    return buildPreviewTimeline(siblings, currentName, displayOrder);
  }, [siblings, name, displayOrder, isEditMode]);

  const availableCandidatesToAttach = useMemo(() => {
    if (!isEditMode || !topicId) return [];
    const childIds = new Set(childrenTopics.map((c) => c.id));
    return allTopics.filter((t) => t.id !== topicId && t.parentId !== topicId && !childIds.has(t.id));
  }, [allTopics, isEditMode, topicId, childrenTopics]);

  /** Lưu form với trạng thái đích; trả về true khi đã lưu thẳng (không thành bản sửa chờ duyệt). */
  const saveWithStatus = async (targetStatus: ContentStatus): Promise<boolean> => {
    if (!name.trim()) {
      alert('Vui lòng nhập tên chủ đề.');
      return false;
    }
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      parentId: parentId || null,
      displayOrder: Number(displayOrder || 0),
      isSequential,
      status: targetStatus,
    };
    try {
      if (!isEditMode || !topicId) {
        await TopicApiService.createTopic({ ...payload, parentId: payload.parentId || undefined });
        return true;
      }
      const saved = await TopicApiService.updateTopic(topicId, payload);
      if (!isRevisionPending(saved)) return true;
      setPendingRevision(saved.revision);
      setRevisionNotice(saved.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể lưu chủ đề lịch sử.'));
      return false;
    }
  };

  const handleAction = async (action: PublishActionType) => {
    setSavingAction(action);
    const saved = await saveWithStatus(action === PublishActionType.DRAFT ? ContentStatus.DRAFT : ContentStatus.PUBLISHED);
    setSavingAction(null);
    if (saved) router.push(APP_ROUTES.CURRICULUM);
  };

  /** Lưu trữ / khôi phục về nháp: ở lại trang và nạp lại trạng thái mới. */
  const changeArchiveStatus = async (next: ContentStatus) => {
    setActionLoading(true);
    const saved = await saveWithStatus(next);
    setActionLoading(false);
    if (saved) setReloadKey((k) => k + 1);
  };

  /** Chạy 1 thao tác trên chủ đề con rồi nạp lại chi tiết + danh sách chủ đề. */
  const runChildAction = async (run: (id: string) => Promise<unknown>, errorMessage: string): Promise<boolean> => {
    if (!topicId) return false;
    try {
      setActionLoading(true);
      await run(topicId);
      await fetchTopicDetail(topicId);
      await reloadAllTopics();
      return true;
    } catch (err) {
      alert(extractErrorMessage(err, errorMessage));
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleAttachChild = async () => {
    if (!selectedCandidateId) return;
    const attached = await runChildAction(
      (id) => TopicApiService.assignChildren(id, [selectedCandidateId]),
      'Không thể gắn chủ đề trực thuộc',
    );
    if (attached) setSelectedCandidateId('');
  };

  const handleDetachChild = async (childId: string, childName: string) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn tách chủ đề "${childName}" ra khỏi chủ đề này không? Chủ đề này sẽ trở thành Chủ đề gốc độc lập.`,
    );
    if (!confirmed) return;
    await runChildAction((id) => TopicApiService.removeChild(id, childId), 'Không thể tách chủ đề trực thuộc');
  };

  // Lỗi được ô tạo nhanh tự hiển thị nên không bắt ở đây.
  const handleQuickCreateChild = async (childName: string) => {
    if (!topicId) return;
    await TopicApiService.createTopic({
      name: childName,
      parentId: topicId,
      displayOrder: childrenTopics.length + 1,
      status: ContentStatus.PUBLISHED,
    });
    await fetchTopicDetail(topicId);
    await reloadAllTopics();
  };

  const onRevisionChanged = (message: string) => {
    setRevisionNotice(message);
    setReloadKey((k) => k + 1);
  };

  return {
    isEditMode,
    isReviewer,
    loadingInitial,
    savingAction,
    actionLoading,
    allTopics,
    childrenTopics,
    selectedCandidateId,
    setSelectedCandidateId,
    availableCandidatesToAttach,
    form: { name, description, coverImageUrl, parentId, displayOrder, isSequential, status, createdAt, updatedAt },
    setName,
    setDescription,
    setCoverImageUrl,
    setParentId,
    setDisplayOrder,
    setIsSequential,
    pendingRevision,
    revisionNotice,
    onRevisionChanged,
    parentBreadcrumb,
    orderExplanationText,
    previewTimeline,
    handleAction,
    changeArchiveStatus,
    handleAttachChild,
    handleDetachChild,
    handleQuickCreateChild,
  };
}
