'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';
import { ContentStatus, DifficultyLevel, MediaType } from '@/constants/enums';
import { LessonApiService } from '@/services/entities/lesson.service';
import { TopicApiService } from '@/services/entities/topic.service';
import { TagApiService } from '@/services/entities/tag.service';
import { LearningPathApiService } from '@/services/entities/learning-path.service';
import { extractErrorMessage } from '@/services/api';
import { UseLessonEditorFacadeReturn, LessonMediaItem, AutoSaveState } from '../types/editor.types';
import { LessonItem } from '@/types/models/lesson.type';
import { TagItem } from '@/types/models/tag.type';
import { TopicItem } from '@/types/models/topic.type';

/** Độ trễ debounce cho auto-save (ms) */
const AUTO_SAVE_DEBOUNCE_MS = 1500;

export function useLessonEditorFacade(explicitLessonId?: string): UseLessonEditorFacadeReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lessonId = explicitLessonId || searchParams.get('id');
  const queryTopicId = searchParams.get('topicId') || '';
  // Mở từ nút "Soạn bài mới" trong một chương của Studio: lưu lần đầu thì gắn luôn vào chương đó.
  const targetChapterId = searchParams.get('chapterId');

  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [topicLessons, setTopicLessons] = useState<LessonItem[]>([]);
  const [loadingTopicLessons, setLoadingTopicLessons] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingLesson, setLoadingLesson] = useState(false);

  const [selectedTopicId, setSelectedTopicId] = useState(queryTopicId);
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [contentRichText, setContentRichText] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevel.MEDIUM);
  const [sourceReferenceNote, setSourceReferenceNote] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<TagItem[]>([]);

  // Local Draft Storage
  const draftStorageKey = useMemo(
    () => (lessonId ? `hisgo_draft_lesson_${lessonId}` : 'hisgo_draft_lesson_create'),
    [lessonId]
  );
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [autoSaveState, setAutoSaveState] = useState<AutoSaveState>(AutoSaveState.IDLE);

  // Media attachments list
  const [mediaList, setMediaList] = useState<LessonMediaItem[]>([]);

  // Nội dung khối (block JSON) thật của bài học, chỉ có giá trị SAU khi API trả dữ liệu
  // (ở chế độ sửa bài). Dùng để nạp vào Block Builder đúng 1 lần — không dùng trực tiếp
  // `contentRichText` làm giá trị khởi tạo Block Builder vì nó rỗng ở lần render đầu tiên
  // (trước khi fetch xong), nên không thể dùng `useMemo([])` một lần như trước đây.
  const [initialBlockContent, setInitialBlockContent] = useState<any>(undefined);

  const addMediaItem = useCallback((item: LessonMediaItem) => {
    setMediaList((prev) => [...prev, item]);
  }, []);

  const removeMediaItem = useCallback((index: number) => {
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // 1. Tải danh sách Chủ đề (Topics) - Khởi tạo 1 lần duy nhất khi mount
  const loadTopics = useCallback(async () => {
    try {
      const res = await TopicApiService.getTopics({ limit: 100 });
      const items = res?.items || [];
      setTopics(items);
      setSelectedTopicId((prev) => (!prev && items.length > 0 ? items[0].id : prev));
    } catch (err) {
      console.error('Failed to load topics for lesson editor:', err);
      setTopics([]);
    }
  }, []);

  useEffect(() => {
    loadTopics();
  }, [loadTopics]);

  // Kiểm tra Local Draft tồn tại khi mount
  useEffect(() => {
    try {
      const savedRaw = localStorage.getItem(draftStorageKey);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw);
        if (parsed.title || parsed.contentRichText) {
          setHasLocalDraft(true);
          setLastSavedTime(parsed.savedAt || null);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [draftStorageKey]);

  // Khôi phục bản nháp
  const restoreDraft = useCallback(() => {
    try {
      const savedRaw = localStorage.getItem(draftStorageKey);
      if (savedRaw) {
        const draft = JSON.parse(savedRaw);
        if (draft.title !== undefined) setTitle(draft.title);
        // KHÔNG khôi phục `contentRichText` từ draft: đây là giá trị DẪN XUẤT từ danh sách
        // Khối (Block Builder) qua `compileToHtml()`, không phải dữ liệu độc lập — nháp cũ
        // (nhất là lưu từ thời điểm có lỗi JSON.stringify trước khi fix) có thể chứa chuỗi
        // JSON thô không khớp với Khối thật, khiến tab Xem trước hiển thị sai hẳn vĩnh viễn.
        if (draft.thumbnailUrl !== undefined) setThumbnailUrl(draft.thumbnailUrl);
        if (draft.difficulty !== undefined) setDifficulty(draft.difficulty);
        if (draft.sourceReferenceNote !== undefined) setSourceReferenceNote(draft.sourceReferenceNote);
        if (draft.displayOrder !== undefined) setDisplayOrder(draft.displayOrder);
        if (draft.selectedTopicId) setSelectedTopicId(draft.selectedTopicId);
        if (Array.isArray(draft.selectedTags)) setSelectedTags(draft.selectedTags);
        setHasLocalDraft(false);
      }
    } catch (err) {
      console.error('Failed to restore draft:', err);
    }
  }, [draftStorageKey]);

  // Bỏ qua bản nháp
  const dismissDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftStorageKey);
    } catch {
      // Ignore
    }
    setHasLocalDraft(false);
  }, [draftStorageKey]);

  // Tự động lưu nháp (Auto-save debounce)
  // Không ghi đè khi người dùng chưa quyết định khôi phục / bỏ qua bản nháp cũ
  useEffect(() => {
    if (hasLocalDraft) return;
    if (!title && !contentRichText) return;

    setAutoSaveState(AutoSaveState.PENDING);
    const timer = setTimeout(() => {
      try {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const draftData = {
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

  // 2. Tải dữ liệu bài học khi đang ở chế độ chỉnh sửa (có ID)
  useEffect(() => {
    if (lessonId) {
      setLoadingLesson(true);
      LessonApiService.getLessonById(lessonId)
        .then((lesson: any) => {
          if (lesson) {
            setTitle(lesson.title || '');
            setSlug(lesson.slug || '');
            setDescription(lesson.description || lesson.summary || '');
            setSelectedTopicId((lesson as any)?.topic?.id || '');
            // CHỈ gán `contentRichText` khi nội dung là HTML thuần (bài học cũ/chưa có Block
            // Builder) — khi `content` là mảng JSON khối, KHÔNG được `JSON.stringify` nó vào
            // đây, nếu không tab Xem trước sẽ hiển thị thẳng chuỗi JSON thô (lỗi đã gặp).
            // Để trống và để effect đồng bộ Khối -> HTML trong LessonEditor tự biên dịch lại
            // HTML thật ngay khi `initialBlockContent` được nạp vào Block Builder.
            setContentRichText(
              lesson.contentRichText || (typeof lesson.content === 'string' ? lesson.content : '') || ''
            );
            // Ưu tiên `content` (JSON mảng khối) nếu có — giữ đúng cấu trúc Block Builder;
            // nếu không có thì dùng `contentRichText` (HTML thuần, sẽ nạp thành 1 khối văn bản).
            setInitialBlockContent(lesson.content ?? lesson.contentRichText ?? null);
            setDifficulty(lesson.difficulty || DifficultyLevel.MEDIUM);
            setSourceReferenceNote(lesson.sourceReferenceNote || '');
            setThumbnailUrl(lesson.thumbnailUrl || '');
            setDisplayOrder(lesson.displayOrder ?? 0);
            setStatus(lesson.status || (ContentStatus.DRAFT as any));
            if (Array.isArray(lesson.tags) && lesson.tags.length > 0) {
              setSelectedTags(lesson.tags);
            } else if (Array.isArray(lesson.lessonTags)) {
              setSelectedTags(
                lesson.lessonTags
                  .map((lt: { tag?: TagItem }) => lt.tag)
                  .filter((t: TagItem | undefined): t is TagItem => Boolean(t)),
              );
            }
            if (Array.isArray(lesson.media) && lesson.media.length > 0) {
              setMediaList(
                lesson.media.map((m: any, idx: number) => ({
                  id: m.id,
                  type: m.type || MediaType.IMAGE,
                  url: m.url,
                  caption: m.caption,
                  displayOrder: m.displayOrder ?? idx + 1,
                })),
              );
            }
          }
        })
        .catch((err) => {
          console.error('Failed to load lesson detail:', err);
          alert('Không thể tải bài học cần sửa.');
        })
        .finally(() => setLoadingLesson(false));
    } else {
      // Dữ liệu mẫu khởi tạo chuẩn cho bài học lịch sử
      setTitle('Chiến dịch Điện Biên Phủ năm 1954');
      setContentRichText(`
        <h2>1. Bối cảnh lịch sử</h2>
        <p>Cuối năm 1953, cuộc kháng chiến chống thực dân Pháp của nhân dân Việt Nam bước sang năm thứ tám. Dưới sự chỉ huy của tướng Henri Navarre, thực dân Pháp cùng đế quốc Mỹ xây dựng Điện Biên Phủ thành một tập đoàn cứ điểm quân sự mạnh nhất Đông Dương.</p>
        <blockquote>"Điện Biên Phủ là một pháo đài bất khả xâm phạm, chiếc cối xay thịt đối với Việt Minh." - Tướng Navarre</blockquote>
        <h2>2. Diễn biến ba đợt tiến công</h2>
        <p>Chiến dịch diễn ra trong 56 ngày đêm với 3 đợt tiến công ác liệt dưới sự chỉ huy trực tiếp của Đại tướng Võ Nguyên Giáp, bắt đầu từ ngày 13/03/1954 đến ngày 07/05/1954 toàn thắng.</p>
      `);
      setSourceReferenceNote('Viện Sử học (2017), Lịch sử Việt Nam, tập 10, NXB Khoa học Xã hội.');
      setDisplayOrder(1);
    }
  }, [lessonId]);

  // 3. Tính số lượng từ vựng (Word count) & thời gian đọc ước tính (~200 từ / phút)
  const wordCount = useMemo(() => {
    if (!contentRichText) return 0;
    return contentRichText
      .replace(/<[^>]*>/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
  }, [contentRichText]);

  const estimatedReadMinutes = useMemo(() => {
    return Math.max(1, Math.ceil(wordCount / 200));
  }, [wordCount]);

  // 4. Lưu nháp hoặc Gửi duyệt bài học
  const submitLesson = useCallback(
    async (nextStatus: ContentStatus | any, overrideContent?: any) => {
      if (!title.trim()) {
        alert('Vui lòng nhập tên bài học.');
        return;
      }

      try {
        setSaving(true);
        const resolvedContent = overrideContent !== undefined ? overrideContent : (contentRichText.trim() || undefined);
        const payload = {
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim() || undefined,
          summary: description.trim() || undefined,
          content: resolvedContent,
          contentRichText: typeof resolvedContent === 'string' ? resolvedContent : JSON.stringify(resolvedContent),
          thumbnailUrl: thumbnailUrl?.trim() || undefined,
          difficulty,
          status: nextStatus,
          displayOrder: Number(displayOrder) || 0,
        };

        setAutoSaveState(AutoSaveState.SYNCING);
        const saved = lessonId
          ? await LessonApiService.updateLesson(lessonId, payload)
          : await LessonApiService.createLesson(payload);

        // Gắn nhãn phân loại (Tags) cho bài học nếu có chọn thẻ
        const savedId = lessonId || saved?.id;
        if (savedId && selectedTags.length > 0) {
          try {
            await TagApiService.attachTagsToLesson(
              savedId,
              selectedTags.map((t) => t.id),
            );
          } catch (tagErr) {
            console.warn('Could not attach tags to lesson:', tagErr);
          }
        }

        // Xóa bản nháp lưu trữ cục bộ khi lưu thành công
        try {
          localStorage.removeItem(draftStorageKey);
        } catch {
          // Ignore
        }

        setStatus(nextStatus);
        setAutoSaveState(AutoSaveState.SAVED);

        if (!lessonId && savedId && targetChapterId) {
          try {
            await LearningPathApiService.addLessonsToChapter(targetChapterId, [savedId]);
          } catch (chapterErr) {
            alert(extractErrorMessage(chapterErr, 'Đã lưu bài học nhưng chưa gắn được vào chương — hãy thêm từ thư viện trong Studio.'));
          }
        }

        if (!lessonId && savedId) {
          // Bài học MỚI vừa được tạo: chuyển URL sang trang sửa của chính bài học này
          // (router.replace — không đẩy thêm lịch sử) để KHÔNG rời khỏi Editor, cho phép
          // tiếp tục thao tác ngay (ví dụ sang tab "Đề ôn tập" — tab này cần lessonId thật
          // mới gọi API được). Trước đây luôn `router.push` về danh sách, buộc phải lưu →
          // bị đẩy ra → mở lại bài mới dùng được Đề ôn tập, rất bất tiện.
          router.replace(APP_ROUTES.LESSONS.DETAIL(savedId));
        }
        // Bài học đã có sẵn (đang sửa): không điều hướng đi đâu cả, ở lại Editor.
      } catch (err: unknown) {
        console.error('Failed to save lesson:', err);
        setAutoSaveState(AutoSaveState.ERROR);
        alert(
          extractErrorMessage(
            err,
            'Không thể lưu bài học. Vui lòng kiểm tra lại dữ liệu.'
          )
        );
      } finally {
        setSaving(false);
      }
    },
    [slug, description, title, contentRichText, thumbnailUrl, difficulty, displayOrder, selectedTags, lessonId, draftStorageKey, router, targetChapterId]
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
  };
}
