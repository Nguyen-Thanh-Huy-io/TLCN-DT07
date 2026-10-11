'use client';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/icons/Icon';
import { IconName } from '@/constants/icons';
import { ContentStatus, LearningPathType, DifficultyLevel } from '@/constants/enums';
import { TopicItem } from '@/types/models/topic.type';
import { LessonItem } from '@/types/models/lesson.type';
import { TopicApiService } from '@/services/entities/topic.service';
import { LessonApiService } from '@/services/entities/lesson.service';
import { extractErrorMessage } from '@/services/api';
import { TopicParentModalPicker } from './TopicParentModalPicker';
import { TopicCoverImagePicker } from './TopicCoverImagePicker';

export interface TopicEditorProps {
  topicId?: string;
}

/**
 * Cấu hình hành động lưu & trạng thái xuất bản (Action Strategy Mapping)
 * Đảm bảo OCP: Khi thêm trạng thái mới chỉ cần bổ sung cấu hình ở đây, không sửa logic form
 */
export type PublishActionType = 'DRAFT' | 'PUBLISH';

export interface PublishActionMeta {
  targetStatus: ContentStatus;
  labelCreate: string;
  labelEdit: string;
  loadingLabel: string;
}

export const PUBLISH_ACTION_CONFIG: Record<PublishActionType, PublishActionMeta> = {
  DRAFT: {
    targetStatus: ContentStatus.DRAFT,
    labelCreate: 'Lưu bản nháp',
    labelEdit: 'Chuyển về bản nháp',
    loadingLabel: 'Đang lưu nháp...',
  },
  PUBLISH: {
    targetStatus: ContentStatus.PUBLISHED,
    labelCreate: 'Xuất bản chủ đề',
    labelEdit: 'Lưu & Xuất bản',
    loadingLabel: 'Đang xuất bản...',
  },
};

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
  const [topicLessons, setTopicLessons] = useState<LessonItem[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  // Modal Picker state & Hiển thị danh sách lộ trình cùng cấp
  const [isParentPickerOpen, setIsParentPickerOpen] = useState(false);
  const [showSiblingList, setShowSiblingList] = useState(false);

  // In-line Quick Create state (Tạo nhanh tại chỗ không chuyển trang)
  const [isQuickChildOpen, setIsQuickChildOpen] = useState(false);
  const [quickChildName, setQuickChildName] = useState('');

  const [isQuickLessonOpen, setIsQuickLessonOpen] = useState(false);
  const [quickLessonTitle, setQuickLessonTitle] = useState('');
  const [quickLessonDiff, setQuickLessonDiff] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [quickCreating, setQuickCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
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
        setCoverImageUrl(detail.coverImageUrl || '');
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
        if (Array.isArray(detail.lessons)) {
          setTopicLessons(detail.lessons);
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
    TopicApiService.getTopics({ limit: 100 })
      .then(async (topRes) => {
        setAllTopics(topRes.items || []);

        if (isEditMode && topicId) {
          await fetchTopicDetail(topicId);
        } else {
          // Create Mode: Nhận parentId từ query param nếu có
          if (queryParentId) {
            setParentId(queryParentId);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load topics:', err);
      })
      .finally(() => setLoadingInitial(false));
  }, [isEditMode, topicId, queryParentId, fetchTopicDetail]);

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
      setDisplayOrder(maxSiblingOrder + 1);
    }
  }, [parentId, maxSiblingOrder, isEditMode]);

  // Tính toán Breadcrumb & Cấp bậc phân cấp của vị trí đang chọn
  const parentBreadcrumb = useMemo(() => {
    if (!parentId) {
      return {
        levelName: 'Cấp 1 (Gốc)',
        levelBadgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        title: 'Chủ đề gốc độc lập',
        pathText: 'Chủ đề gốc cấp 1 (Không có cha)',
        targetTierText: 'Cấp 1 (Chủ đề gốc cao nhất)',
        depth: 0,
      };
    }

    const path: string[] = [];
    let curr = allTopics.find((t) => t.id === parentId);
    let depthCount = 1;

    while (curr) {
      path.unshift(curr.name);
      if (curr.parentId) {
        curr = allTopics.find((t) => t.id === curr?.parentId);
        depthCount++;
      } else {
        break;
      }
    }

    const levelName = depthCount === 1 ? 'Cấp 2 (Giai đoạn)' : 'Cấp 3 (Chuyên đề)';
    const levelBadgeBg =
      depthCount === 1 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-purple-50 text-purple-700 border-purple-200';

    return {
      levelName,
      levelBadgeBg,
      title: path[path.length - 1],
      pathText: path.join(' > '),
      targetTierText: `${levelName} trực thuộc`,
      depth: depthCount,
    };
  }, [parentId, allTopics]);

  // Tìm chủ đề anh/chị/em đứng ngay trước và ngay sau vị trí đang chọn
  const { precedingSibling, followingSibling } = useMemo(() => {
    const sorted = [...siblings].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const targetOrder = Math.max(1, Number(displayOrder || 1));
    const pre = sorted.filter((s, idx) => idx + 1 < targetOrder);
    const fol = sorted.filter((s, idx) => idx + 1 >= targetOrder);
    return {
      precedingSibling: pre.length > 0 ? pre[pre.length - 1] : null,
      followingSibling: fol.length > 0 ? fol[0] : null,
    };
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

  // Danh sách dòng thời gian dọc với cơ chế tự động dịch số thứ tự (Auto-shift on insert)
  const previewTimeline = useMemo(() => {
    const sortedSiblings = [...siblings].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    const targetOrder = Math.max(1, Number(displayOrder || 1));
    const items: Array<{
      id: string;
      name: string;
      displayOrder: number;
      isCurrent: boolean;
      isShifted?: boolean;
    }> = [];

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

    const actionConfig = PUBLISH_ACTION_CONFIG[action];
    const targetStatus = actionConfig.targetStatus;

    try {
      setSavingAction(action);
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        coverImageUrl: coverImageUrl.trim() || undefined,
        periodId: null,
        parentId: parentId ? parentId : null,
        pathType,
        displayOrder: Number(displayOrder || 0),
        isSequential,
        status: targetStatus,
      };

      if (isEditMode && topicId) {
        await TopicApiService.updateTopic(topicId, payload);
      } else {
        await TopicApiService.createTopic({
          ...payload,
          periodId: undefined,
          parentId: payload.parentId || undefined,
        });
      }
      router.push('/topics');
    } catch (err) {
      console.error('Failed to save topic:', err);
      alert(extractErrorMessage(err, 'Không thể lưu chủ đề lịch sử.'));
    } finally {
      setSavingAction(null);
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

  // Hành động xóa bài học trực thuộc chủ đề này
  const handleDeleteLessonInTopic = async (lId: string, lTitle: string) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa bài học "${lTitle}" khỏi hệ thống? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      await LessonApiService.deleteLesson(lId);
      if (topicId) await fetchTopicDetail(topicId);
    } catch (err) {
      alert(extractErrorMessage(err, 'Không thể xóa bài học'));
    } finally {
      setActionLoading(false);
    }
  };

  // Tạo nhanh Chủ đề con trực thuộc tại chỗ (In-line Quick Create)
  const handleQuickCreateChild = async () => {
    if (!topicId || !quickChildName.trim()) {
      alert('Vui lòng nhập tên chủ đề con');
      return;
    }

    try {
      setQuickCreating(true);
      const nextChildOrder = childrenTopics.length + 1;
      await TopicApiService.createTopic({
        name: quickChildName.trim(),
        parentId: topicId,
        displayOrder: nextChildOrder,
        pathType: LearningPathType.CHRONOLOGICAL,
        status: ContentStatus.PUBLISHED,
      });

      setQuickChildName('');
      setIsQuickChildOpen(false);
      await fetchTopicDetail(topicId);
      const updatedTopics = await TopicApiService.getTopics({ limit: 100 });
      setAllTopics(updatedTopics.items || []);
    } catch (err) {
      console.error('Failed to quick create child topic:', err);
      alert(extractErrorMessage(err, 'Không thể tạo chủ đề con'));
    } finally {
      setQuickCreating(false);
    }
  };

  // Tạo nhanh Bài học trực thuộc tại chỗ (In-line Quick Create)
  const handleQuickCreateLesson = async () => {
    if (!topicId || !quickLessonTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bài học');
      return;
    }

    try {
      setQuickCreating(true);
      const nextLessonOrder = topicLessons.length + 1;

      await LessonApiService.createLesson({
        topicId,
        title: quickLessonTitle.trim(),
        contentRichText: undefined,
        difficulty: quickLessonDiff,
        displayOrder: nextLessonOrder,
        status: ContentStatus.DRAFT,
      });

      setQuickLessonTitle('');
      setIsQuickLessonOpen(false);
      await fetchTopicDetail(topicId);
    } catch (err) {
      console.error('Failed to quick create lesson:', err);
      alert(extractErrorMessage(err, 'Không thể tạo bài học'));
    } finally {
      setQuickCreating(false);
    }
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
      {/* Top Header Bar & Action Controls */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200">
        <div>
          {/* Breadcrumb nhỏ gọn */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Link href="/topics" className="hover:text-blue-600 transition">
              Chủ đề học tập
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">
              {isEditMode ? 'Chỉnh sửa' : 'Tạo mới'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {isEditMode ? 'Chỉnh sửa Chủ đề lịch sử' : 'Thêm Chủ đề mới'}
            </h1>
            {isEditMode && (
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                ID: {topicId?.slice(0, 8)}...
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/topics')}
            className="btn-secondary text-xs px-3.5 py-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={Boolean(savingAction)}
          >
            Hủy bỏ
          </button>

          {/* Nút 1: Lưu bản nháp (Action: DRAFT) */}
          <button
            type="button"
            onClick={() => handleAction('DRAFT')}
            className="text-xs px-3.5 py-2 font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
            disabled={Boolean(savingAction)}
          >
            {savingAction === 'DRAFT' && (
              <span className="w-3 h-3 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
            )}
            <span>
              {savingAction === 'DRAFT'
                ? PUBLISH_ACTION_CONFIG.DRAFT.loadingLabel
                : isEditMode
                ? PUBLISH_ACTION_CONFIG.DRAFT.labelEdit
                : PUBLISH_ACTION_CONFIG.DRAFT.labelCreate}
            </span>
          </button>

          {/* Nút 2: Xuất bản / Lưu thay đổi (Action: PUBLISH) */}
          <button
            type="button"
            onClick={() => handleAction('PUBLISH')}
            className="btn-primary text-xs px-4 py-2 font-medium inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-2xs"
            disabled={Boolean(savingAction)}
          >
            {savingAction === 'PUBLISH' && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>
              {savingAction === 'PUBLISH'
                ? PUBLISH_ACTION_CONFIG.PUBLISH.loadingLabel
                : isEditMode
                ? status === ContentStatus.PUBLISHED
                  ? 'Lưu thay đổi'
                  : PUBLISH_ACTION_CONFIG.PUBLISH.labelEdit
                : PUBLISH_ACTION_CONFIG.PUBLISH.labelCreate}
            </span>
          </button>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleAction('PUBLISH'); }}>
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

            {/* Block 2: Phân cấp & Thứ tự học tập */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span>02. Phân cấp & Thứ tự học tập</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Xác định chủ đề cha trực thuộc và vị trí xuất hiện trên lộ trình học
                </p>
              </div>

              {/* Hàng 1: Trực thuộc (Chủ đề cha) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-slate-500 text-xs font-medium shrink-0">Trực thuộc:</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold border shrink-0 ${parentBreadcrumb.levelBadgeBg}`}
                  >
                    {parentBreadcrumb.levelName}
                  </span>
                  <span className="text-xs font-bold text-slate-900 truncate" title={parentBreadcrumb.pathText}>
                    {parentId ? parentBreadcrumb.pathText : 'Chủ đề gốc (Cấp 1)'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsParentPickerOpen(true)}
                  className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
                >
                  <Icon name={IconName.FOLDER} size={14} />
                  <span>{parentId ? 'Đổi vị trí phân cấp' : 'Chọn chủ đề cha'}</span>
                </button>
              </div>

              {/* Hàng 2: Thứ tự hiển thị & Câu diễn giải tự nhiên */}
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

                {siblings.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowSiblingList((prev) => !prev)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto hover:underline"
                  >
                    <span>{showSiblingList ? 'Thu gọn lộ trình' : `Xem lộ trình (${siblings.length + 1} chủ đề)`}</span>
                    <span className="text-[10px]">{showSiblingList ? '▲' : '▼'}</span>
                  </button>
                )}
              </div>

              {/* Timeline dọc thanh lịch (Minimalist Vertical Timeline) */}
              {showSiblingList && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-medium text-slate-500 mb-3">
                    Lộ trình các chủ đề trong cùng nhánh:
                  </div>

                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {previewTimeline.map((item) => (
                      <div key={item.id} className="relative flex items-center justify-between group">
                        <span
                          className={`absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full border-2 transition ${
                            item.isCurrent
                              ? 'border-blue-600 bg-blue-600 ring-4 ring-blue-100'
                              : 'border-slate-300 bg-white'
                          }`}
                        />
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span
                            className={`font-mono text-xs font-bold shrink-0 ${
                              item.isCurrent ? 'text-blue-600' : 'text-slate-400'
                            }`}
                          >
                            #{String(item.displayOrder).padStart(2, '0')}
                          </span>
                          <span
                            className={`text-xs truncate ${
                              item.isCurrent ? 'font-semibold text-blue-950' : 'text-slate-700'
                            }`}
                            title={item.name}
                          >
                            {item.name}
                          </span>
                          {item.isCurrent ? (
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded font-medium border border-blue-200 shrink-0">
                              Chủ đề này
                            </span>
                          ) : item.isShifted ? (
                            <span className="text-[10px] text-slate-400 italic bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100 shrink-0">
                              Tự động lùi sau
                            </span>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickChildOpen((prev) => !prev)}
                      className={`text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition cursor-pointer ${
                        isQuickChildOpen
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                      }`}
                    >
                      <span>{isQuickChildOpen ? '✕ Đóng' : '+ Tạo nhanh chủ đề con'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/topics/create?parentId=${topicId}`)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md border border-slate-200 transition cursor-pointer"
                      title="Mở toàn màn hình để tùy biến sâu"
                    >
                      <span>Chi tiết ↗</span>
                    </button>
                  </div>
                </div>

                {/* Thanh Tạo Nhanh Chủ Đề Con Tại Chỗ (In-line Quick Creator) */}
                {isQuickChildOpen && (
                  <div className="mb-4 p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <span>⚡ Tạo nhanh chủ đề con trực thuộc:</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={quickChildName}
                        onChange={(e) => setQuickChildName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickCreateChild()}
                        placeholder="Nhập tên chủ đề con (Ví dụ: Chiến dịch Bình Giã 1964)..."
                        autoFocus
                        disabled={quickCreating}
                        className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-emerald-600 shadow-2xs"
                      />
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickChildOpen(false);
                            setQuickChildName('');
                          }}
                          disabled={quickCreating}
                          className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickCreateChild}
                          disabled={quickCreating || !quickChildName.trim()}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-2xs transition cursor-pointer"
                        >
                          {quickCreating ? 'Đang tạo...' : 'Tạo ngay'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

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

            {/* Block 4: Quản lý Bài học trực thuộc & Tạo bài học nhanh (Chỉ trong Edit Mode) */}
            {isEditMode && topicId && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                      <span>04. Bài học trực thuộc chủ đề</span>
                      <span className="text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        {topicLessons.length} bài học
                      </span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Nội dung bài học lịch sử chi tiết cho học sinh học trong chủ đề này
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsQuickLessonOpen((prev) => !prev)}
                      className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-2xs transition cursor-pointer ${
                        isQuickLessonOpen
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      <span>{isQuickLessonOpen ? '✕ Đóng' : '+ Tạo bài học nhanh'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/lessons/create?topicId=${topicId}`)}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md border border-slate-200 transition cursor-pointer"
                      title="Mở toàn màn hình soạn thảo văn bản phong phú (TipTap)"
                    >
                      <span>Soạn chi tiết ↗</span>
                    </button>
                  </div>
                </div>

                {/* Thanh Tạo Nhanh Bài Học Tại Chỗ (In-line Quick Creator) */}
                {isQuickLessonOpen && (
                  <div className="mb-4 p-3 bg-blue-50/60 border border-blue-200 rounded-lg animate-in fade-in duration-150">
                    <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <span>Tạo nhanh bài học trực thuộc chủ đề này:</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={quickLessonTitle}
                        onChange={(e) => setQuickLessonTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickCreateLesson()}
                        placeholder="Nhập tiêu đề bài học (Ví dụ: Trận Ấp Bắc 1963)..."
                        autoFocus
                        disabled={quickCreating}
                        className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 shadow-2xs font-medium"
                      />

                      <select
                        value={quickLessonDiff}
                        onChange={(e) => setQuickLessonDiff(e.target.value as DifficultyLevel)}
                        disabled={quickCreating}
                        className="text-xs px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 shrink-0"
                      >
                        <option value={DifficultyLevel.EASY}>Độ khó: Dễ</option>
                        <option value={DifficultyLevel.MEDIUM}>Độ khó: Trung bình</option>
                        <option value={DifficultyLevel.HARD}>Độ khó: Nâng cao</option>
                      </select>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setIsQuickLessonOpen(false);
                            setQuickLessonTitle('');
                          }}
                          disabled={quickCreating}
                          className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg transition cursor-pointer"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickCreateLesson}
                          disabled={quickCreating || !quickLessonTitle.trim()}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-2xs transition cursor-pointer"
                        >
                          {quickCreating ? 'Đang tạo...' : 'Tạo ngay'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Danh sách bài học hiện có */}
                {topicLessons.length > 0 ? (
                  <div className="space-y-2">
                    {topicLessons.map((l, index) => (
                      <div
                        key={l.id}
                        className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-lg text-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="font-mono text-[11px] font-bold text-blue-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded shrink-0">
                            #{String(l.displayOrder ?? index + 1).padStart(2, '0')}
                          </span>
                          <Icon name={IconName.BOOK} size={15} className="text-slate-400 shrink-0" />
                          <span className="font-medium text-slate-900 truncate" title={l.title}>
                            {l.title}
                          </span>
                          {l.status && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold shrink-0 ${
                                l.status === ContentStatus.PUBLISHED
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {l.status === ContentStatus.PUBLISHED ? 'Đã xuất bản' : 'Bản nháp'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => router.push(`/lessons/create?id=${l.id}&topicId=${topicId}`)}
                            className="text-[11px] text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-white font-medium transition cursor-pointer"
                          >
                            Soạn thảo / Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLessonInTopic(l.id, l.title)}
                            disabled={actionLoading}
                            className="text-[11px] text-rose-600 hover:text-rose-800 px-2 py-1 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa bài học này"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 bg-slate-50/50 border border-dashed border-slate-200 rounded-lg p-5 text-center">
                    <p className="mb-2">Chủ đề này chưa có bài học nào.</p>
                    <button
                      type="button"
                      onClick={() => router.push(`/lessons/create?topicId=${topicId}`)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      Bấm vào đây để tạo bài học đầu tiên cho chủ đề này
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* CỘT PHẢI (Inspector Sidebar - 1 span) */}
          <div className="space-y-6">
            {/* Card: Thông tin trạng thái nội dung (Chỉ hiển thị khi xem / chỉnh sửa) */}
            {isEditMode && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5">
                  Trạng thái nội dung
                </h3>

                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      status === ContentStatus.PUBLISHED
                        ? 'bg-emerald-500'
                        : status === ContentStatus.DRAFT
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span className="text-xs font-bold text-slate-800">
                    {status === ContentStatus.PUBLISHED
                      ? 'Đang xuất bản'
                      : status === ContentStatus.DRAFT
                      ? 'Bản nháp riêng tư'
                      : status === ContentStatus.PENDING_REVIEW
                      ? 'Đang chờ duyệt'
                      : 'Đã lưu trữ'}
                  </span>
                </div>

                {createdAt && (
                  <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-400 space-y-0.5">
                    <div>Tạo ngày: {new Date(createdAt).toLocaleDateString('vi-VN')}</div>
                    {updatedAt && <div>Cập nhật: {new Date(updatedAt).toLocaleDateString('vi-VN')}</div>}
                  </div>
                )}
              </div>
            )}



            {/* Card: Cấu hình tiến trình học */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
                Cấu hình tiến trình học
              </h3>

              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600 block mb-1">
                    Loại tiến trình <span className="text-slate-400 font-normal">(Tùy chọn, mặc định: Theo niên đại)</span>
                  </span>
                  <select
                    value={pathType}
                    onChange={(e) => setPathType(e.target.value as LearningPathType)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none"
                  >
                    <option value={LearningPathType.CHRONOLOGICAL}>Theo niên đại</option>
                    <option value={LearningPathType.THEMATIC}>Chuyên đề xuyên suốt</option>
                    <option value={LearningPathType.MYTHOLOGICAL}>Huyền sử & Dân gian</option>
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

            {/* Card: Ảnh bìa chủ đề (Media Cover với Segmented Tabs) */}
            <TopicCoverImagePicker
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              disabled={actionLoading}
            />

            {/* Card: Tiêu chuẩn biên tập & Sẵn sàng phát hành (Editorial Checklist) */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 shadow-xs">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Icon name={IconName.SPARK} size={15} className="text-blue-600" />
                <span>Tiêu chuẩn biên tập</span>
              </h3>
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                Các tiêu chí giúp chủ đề học tập đạt chất lượng cao trên ứng dụng người dùng:
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    name.trim().length >= 5
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {name.trim().length >= 5 ? '✓' : '•'}
                  </span>
                  <span className={name.trim().length >= 5 ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                    Tên chủ đề rõ ràng (≥ 5 ký tự)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    description.trim().length >= 20
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {description.trim().length >= 20 ? '✓' : '•'}
                  </span>
                  <span className={description.trim().length >= 20 ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                    Có mô tả bối cảnh & mục tiêu học
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    coverImageUrl.trim().length > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {coverImageUrl.trim().length > 0 ? '✓' : '•'}
                  </span>
                  <span className={coverImageUrl.trim().length > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                    Có ảnh bìa minh họa trực quan
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    displayOrder > 0
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {displayOrder > 0 ? '✓' : '•'}
                  </span>
                  <span className={displayOrder > 0 ? 'text-slate-700 font-medium' : 'text-slate-500'}>
                    Đã định vị trên cây tri thức (#{displayOrder})
                  </span>
                </div>
              </div>
            </div>
          </div>
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
    </div>
  );
}
