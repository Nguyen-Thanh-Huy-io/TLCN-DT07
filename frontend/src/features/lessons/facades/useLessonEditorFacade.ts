'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { DifficultyLevel, LessonStatus, MediaType } from '@/constants/enums';
import { LessonApiService } from '@/services/entities/lesson.service';
import { TopicApiService } from '@/services/entities/topic.service';
import { TagApiService } from '@/services/entities/tag.service';
import { LearningPathApiService } from '@/services/entities/learning-path.service';
import { extractErrorMessage } from '@/services/api';
import { UseLessonEditorFacadeReturn, LessonMediaItem, AutoSaveState } from '../types/editor.types';
import { LessonItem } from '@/types/models';
import { TagItem } from '@/types/models';
import { TopicItem } from '@/types/models';
import {
  isRevisionPending,
  withPendingDraft,
  type ContentRevisionItem,
} from '@/services/entities/content-revision.service';

const AUTO_SAVE_DEBOUNCE_MS = 1500;

interface LessonDraftPayload {
  title?: string;
  thumbnailUrl?: string;
  difficulty?: DifficultyLevel;
  sourceReferenceNote?: string;
  displayOrder?: number;
  selectedTopicId?: string;
  selectedTags?: TagItem[];
  savedAt?: string;
  contentRichText?: string;
}

interface ExtendedLessonDetail extends Omit<LessonItem, 'topic' | 'status' | 'lessonTags'> {
  topic?: { id?: string; name?: string; slug?: string; parentId?: string | null } | null;
  status?: LessonStatus;
  sourceReferenceNote?: string;
  tags?: TagItem[];
  lessonTags?: Array<{ tagId?: string; tag?: TagItem }>;
  media?: Array<{
    id?: string;
    type?: MediaType;
    url?: string;
    caption?: string;
    displayOrder?: number;
  }>;
}

function applyDraftData(
  draft: LessonDraftPayload,
  setTitle: (val: string) => void,
  setThumbnailUrl: (val: string) => void,
  setDifficulty: (val: DifficultyLevel) => void,
  setSourceReferenceNote: (val: string) => void,
  setDisplayOrder: (val: number) => void,
  setSelectedTopicId: (val: string) => void,
  setSelectedTags: (val: TagItem[]) => void,
) {
  if (draft.title !== undefined) setTitle(draft.title);
  if (draft.thumbnailUrl !== undefined) setThumbnailUrl(draft.thumbnailUrl);
  if (draft.difficulty !== undefined) setDifficulty(draft.difficulty);
  if (draft.sourceReferenceNote !== undefined) setSourceReferenceNote(draft.sourceReferenceNote);
  if (draft.displayOrder !== undefined) setDisplayOrder(draft.displayOrder);
  if (draft.selectedTopicId) setSelectedTopicId(draft.selectedTopicId);
  if (Array.isArray(draft.selectedTags)) setSelectedTags(draft.selectedTags);
}

function extractTagsFromLesson(lesson: ExtendedLessonDetail): TagItem[] {
  if (Array.isArray(lesson.tags) && lesson.tags.length > 0) {
    return lesson.tags;
  }
  if (Array.isArray(lesson.lessonTags)) {
    return lesson.lessonTags
      .map((lt) => lt.tag)
      .filter((t): t is TagItem => Boolean(t));
  }
  return [];
}

function extractMediaFromLesson(lesson: ExtendedLessonDetail): LessonMediaItem[] {
  if (Array.isArray(lesson.media) && lesson.media.length > 0) {
    return lesson.media.map((m, idx) => ({
      id: m.id || `media-${idx}`,
      type: m.type || MediaType.IMAGE,
      url: m.url || '',
      caption: m.caption,
      displayOrder: m.displayOrder ?? idx + 1,
    }));
  }
  return [];
}

const DEFAULT_NEW_LESSON_TITLE = 'Chiến dịch Điện Biên Phủ năm 1954';
const DEFAULT_NEW_LESSON_CONTENT = `
  <h2>1. Bối cảnh lịch sử</h2>
  <p>Cuối năm 1953, cuộc kháng chiến chống thực dân Pháp của nhân dân Việt Nam bước sang năm thứ tám.</p>
`;
const DEFAULT_NEW_LESSON_NOTE = 'Viện Sử học (2017), Lịch sử Việt Nam, tập 10, NXB Khoa học Xã hội.';

function buildLessonPayload(params: {
  title: string;
  slug: string;
  description: string;
  contentRichText: string;
  overrideContent?: unknown;
  thumbnailUrl?: string;
  difficulty: DifficultyLevel;
  status: LessonStatus;
  displayOrder: number;
  topicId: string;
}) {
  const resolvedContent =
    params.overrideContent !== undefined ? params.overrideContent : params.contentRichText.trim() || undefined;
  return {
    title: params.title.trim(),
    slug: params.slug.trim() || undefined,
    description: params.description.trim() || undefined,
    summary: params.description.trim() || undefined,
    content: resolvedContent,
    contentRichText: typeof resolvedContent === 'string' ? resolvedContent : JSON.stringify(resolvedContent),
    thumbnailUrl: params.thumbnailUrl?.trim() || undefined,
    difficulty: params.difficulty,
    status: params.status,
    displayOrder: Number(params.displayOrder) || 0,
    topicId: params.topicId,
  };
}

async function attachLessonRelations(savedId: string, tags: TagItem[], targetChapterId: string | null, isNew: boolean) {
  if (tags.length > 0) {
    try {
      await TagApiService.attachTagsToLesson(
        savedId,
        tags.map((t) => t.id),
      );
    } catch (tagErr) {
      console.warn('Could not attach tags to lesson:', tagErr);
    }
  }

  if (isNew && targetChapterId) {
    try {
      await LearningPathApiService.addLessonsToChapter(targetChapterId, [savedId]);
    } catch (chapterErr) {
      alert(
        extractErrorMessage(
          chapterErr,
          'Đã lưu bài học nhưng chưa gắn được vào chương — hãy thêm từ thư viện trong Studio.',
        ),
      );
    }
  }
}

function clearDraftSafely(storageKey: string) {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Ignore
  }
}

export function useLessonEditorFacade(explicitLessonId?: string): UseLessonEditorFacadeReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = explicitLessonId || searchParams.get('id');
  const queryTopicId = searchParams.get('topicId') || '';
  const targetChapterId = searchParams.get('chapterId');

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicLessons] = useState<LessonItem[]>([]);
  const [loadingTopicLessons] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);

  const [selectedTopicId, setSelectedTopicId] = useState(queryTopicId);
  const [status, setStatus] = useState<LessonStatus>(LessonStatus.DRAFT);
  const [pendingRevision, setPendingRevision] = useState<ContentRevisionItem | null>(null);
  const [revisionNotice, setRevisionNotice] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [title, setTitle] = useState(() => (!lessonId ? DEFAULT_NEW_LESSON_TITLE : ''));
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [contentRichText, setContentRichText] = useState(() => (!lessonId ? DEFAULT_NEW_LESSON_CONTENT : ''));
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [sourceReferenceNote, setSourceReferenceNote] = useState(() => (!lessonId ? DEFAULT_NEW_LESSON_NOTE : ''));
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(() => (!lessonId ? 1 : 0));
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);

  const draftStorageKey = useMemo(
    () => (lessonId ? `hisgo_draft_lesson_${lessonId}` : 'hisgo_draft_lesson_create'),
    [lessonId],
  );
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>(AutoSaveState.IDLE);

  const [mediaList, setMediaList] = useState<LessonMediaItem[]>([]);
  const [initialBlockContent, setInitialBlockContent] = useState<unknown>(undefined);

  const addMediaItem = useCallback((item: LessonMediaItem) => {
    setMediaList((prev) => [...prev, item]);
  }, []);

  const removeMediaItem = useCallback((index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const loadTopics = useCallback(async () => {
    try {
      const res = await TopicApiService.getTopics({ limit: 100 });
      const items = res?.items || [];
      setTopics(items);
    } catch {
      setTopics([]);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(() => {
      if (active) void loadTopics();
    });
    return () => {
      active = false;
    };
  }, [loadTopics]);

  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(draftStorageKey);
      if (savedRaw) {
        const parsed: LessonDraftPayload = JSON.parse(savedRaw);
        if (parsed.title || parsed.contentRichText) {
          void Promise.resolve().then(() => {
            setHasLocalDraft(true);
            setLastSavedTime(parsed.savedAt || null);
          });
        }
      }
    } catch {
      // Ignore
    }
  }, [draftStorageKey]);

  const restoreDraft = useCallback(() => {
    try {
      const savedRaw = localStorage.getItem(draftStorageKey);
      if (savedRaw) {
        const draft: LessonDraftPayload = JSON.parse(savedRaw);
        applyDraftData(
          draft,
          setTitle,
          setThumbnailUrl,
          setDifficulty,
          setSourceReferenceNote,
          setDisplayOrder,
          setSelectedTopicId,
          setSelectedTags,
        );
        setHasLocalDraft(false);
      }
    } catch {
      // Ignore
    }
  }, [draftStorageKey]);

  const dismissDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore
    }
    setHasLocalDraft(false);
  }, [draftStorageKey]);

  useEffect(() => {
    if (hasLocalDraft) return;
    if (!title && !contentRichText) return;

    const timer = setTimeout(() => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const draftData: LessonDraftPayload = {
          title,
          contentRichText,
          thumbnailUrl,
          difficulty,
          sourceReferenceNote,
          displayOrder,
          selectedTopicId,
          selectedTags,
          savedAt: timeStr,
        };
        localStorage.setItem(draftStorageKey, JSON.stringify(draftData));
        setLastSavedTime(timeStr);
        setLastSavedAt(now);
        setAutoSaveState(AutoSaveState.SAVED);
      } catch {
        setAutoSaveState(AutoSaveState.ERROR);
      }
    }, AUTO_SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [title, contentRichText, thumbnailUrl, difficulty, sourceReferenceNote, displayOrder, selectedTopicId, selectedTags, draftStorageKey, hasLocalDraft]);

  const handleLessonDetailLoaded = useCallback(
    (lesson: ExtendedLessonDetail | null, pending: ContentRevisionItem | null) => {
      setPendingRevision(pending);
      if (!lesson) return;

      setTitle(lesson.title || '');
      setSlug(lesson.slug || '');
      setDescription(lesson.description || lesson.summary || '');
      setSelectedTopicId(lesson.topicId || lesson.topic?.id || '');
      setContentRichText(
        lesson.contentRichText || (typeof lesson.content === 'string' ? lesson.content : '') || '',
      );
      setInitialBlockContent(lesson.content ?? lesson.contentRichText ?? null);
      setDifficulty(lesson.difficulty || DifficultyLevel.MEDIUM);
      setSourceReferenceNote(lesson.sourceReferenceNote || '');
      setThumbnailUrl(lesson.thumbnailUrl || '');
      setDisplayOrder(lesson.displayOrder ?? 0);
      setStatus(lesson.status || LessonStatus.DRAFT);
      setSelectedTags(extractTagsFromLesson(lesson));
      setMediaList(extractMediaFromLesson(lesson));
    },
    [],
  );

  useEffect(() => {
    if (lessonId) {
      let active = true;
      void Promise.resolve().then(() => {
        if (active) setLoadingLesson(true);
      });
      LessonApiService.getLessonById(lessonId)
        .then((fetched) => withPendingDraft('LESSON', lessonId, fetched))
        .then(({ detail: lesson, pending }) => {
          if (active) {
            handleLessonDetailLoaded(lesson as ExtendedLessonDetail, pending);
          }
        })
        .catch(() => {
          alert('Không thể tải bài học cần sửa.');
        })
        .finally(() => {
          if (active) setLoadingLesson(false);
        });
      return () => {
        active = false;
      };
    }
  }, [handleLessonDetailLoaded, lessonId, reloadKey]);

  const wordCount = useMemo(() => {
    if (!contentRichText) return 0;
    return contentRichText
      .replace(/<[^>]*>/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [contentRichText]);

  const estimatedReadMinutes = useMemo(() => Math.max(1, Math.ceil(wordCount / 200)), [wordCount]);

  const submitLesson = useCallback(
    async (nextStatus: LessonStatus, overrideContent?: unknown) => {
      if (!title.trim()) {
        alert('Vui lòng nhập tên bài học.');
        return;
      }
      if (!selectedTopicId) {
        alert('Vui lòng chọn chủ đề cho bài học.');
        return;
      }

      try {
        setSaving(true);
        const payload = buildLessonPayload({
          title,
          slug,
          description,
          contentRichText,
          overrideContent,
          thumbnailUrl,
          difficulty,
          status: nextStatus,
          displayOrder,
          topicId: selectedTopicId,
        });

        setAutoSaveState(AutoSaveState.SYNCING);
        const saved = lessonId
          ? await LessonApiService.updateLesson(lessonId, payload)
          : await LessonApiService.createLesson(payload);

        if (isRevisionPending(saved)) {
          setPendingRevision(saved.revision);
          setRevisionNotice(saved.message);
          setAutoSaveState(AutoSaveState.SAVED);
          clearDraftSafely(draftStorageKey);
          return;
        }

        const savedId = lessonId || saved?.id;
        if (savedId) {
          await attachLessonRelations(savedId, selectedTags, targetChapterId, !lessonId);
        }

        clearDraftSafely(draftStorageKey);
        setStatus(nextStatus);
        setAutoSaveState(AutoSaveState.SAVED);

        if (!lessonId && savedId) {
          router.replace(APP_ROUTES.LESSONS.DETAIL(savedId));
        }
      } catch (err: unknown) {
        setAutoSaveState(AutoSaveState.ERROR);
        alert(extractErrorMessage(err, 'Không thể lưu bài học. Vui lòng kiểm tra lại dữ liệu.'));
      } finally {
        setSaving(false);
      }
    },
    [
      slug,
      description,
      title,
      contentRichText,
      thumbnailUrl,
      difficulty,
      displayOrder,
      selectedTopicId,
      selectedTags,
      lessonId,
      draftStorageKey,
      router,
      targetChapterId,
    ],
  );

  return {
    title,
    setTitle,
    slug,
    setSlug,
    description,
    setDescription,
    selectedTopicId,
    setSelectedTopicId,
    contentRichText,
    setContentRichText,
    difficulty,
    setDifficulty,
    sourceReferenceNote,
    setSourceReferenceNote,
    thumbnailUrl,
    setThumbnailUrl,
    displayOrder,
    setDisplayOrder,
    status,
    mediaList,
    addMediaItem,
    removeMediaItem,
    initialBlockContent,
    topics,
    topicLessons,
    loadingTopicLessons,
    loadingLesson,
    saving,
    wordCount,
    estimatedReadMinutes,
    lessonId,
    hasLocalDraft,
    lastSavedTime,
    lastSavedAt,
    autoSaveState,
    restoreDraft,
    dismissDraft,
    selectedTags,
    setSelectedTags,
    submitLesson,
    pendingRevision,
    revisionNotice,
    onRevisionChanged: (message: string) => {
      setRevisionNotice(message);
      setReloadKey((k) => k + 1);
    },
  };
}
