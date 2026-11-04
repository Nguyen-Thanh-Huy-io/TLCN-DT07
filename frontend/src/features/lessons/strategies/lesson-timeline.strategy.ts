import { LessonItem } from '@/types/models/lesson.type';

export interface LessonTimelineItem {
  id: string;
  title: string;
  displayOrder: number;
  isCurrent: boolean;
  isShifted?: boolean;
}

export interface LessonTimelineResult {
  previewTimeline: LessonTimelineItem[];
  orderExplanationText: string;
  maxNextOrder: number;
  otherLessonsCount: number;
}

export const LESSON_ORDER_CONSTANTS = {
  FIELD_LABEL: 'Thứ tự bài học',
  FIRST_IN_TOPIC: 'Là bài học đầu tiên trong chủ đề',
  HEAD_OF_TOPIC: 'Xếp ở đầu chủ đề (ưu tiên học trước)',
  TAIL_SUFFIX: '(cuối chủ đề)',
  INSERT_AFTER_PREFIX: 'Chèn sau: ',
  POSITION_PREFIX: 'Xếp ở vị trí #',
  CURRENT_FALLBACK_EDIT: 'Bài học hiện tại',
  CURRENT_FALLBACK_NEW: 'Bài mới đang nhập',
  BADGE_EDIT: 'Đang sửa',
  BADGE_NEW: 'Vị trí bài này',
  ACTION_PLACE_HERE: 'Đặt vào đây',
  BTN_FIRST: 'Về đầu',
  BTN_LAST: 'Về cuối',
  TOGGLE_EXPAND: '▼ Xem vị trí các bài cùng chủ đề',
  TOGGLE_COLLAPSE: '▲ Thu gọn danh sách',
} as const;

export class LessonTimelineStrategy {
  /**
   * Tính toán danh sách timeline ảo và câu diễn giải vị trí cho bài học
   */
  public static calculateTimeline(
    topicLessons: LessonItem[],
    displayOrder: number,
    currentLessonId?: string | null,
    currentTitle?: string
  ): LessonTimelineResult {
    // 1. Lọc bỏ bài học hiện tại khỏi danh sách để tránh trùng lặp
    const otherLessons = topicLessons.filter((l) => l.id !== currentLessonId);
    const sortedSiblings = [...otherLessons].sort(
      (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)
    );

    const targetOrder = Math.max(1, Number(displayOrder || 1));
    const maxNextOrder = sortedSiblings.length + 1;

    // 2. Xác định bài học đứng trước và đứng sau vị trí target
    const precedingLesson = sortedSiblings.filter((_, idx) => idx + 1 < targetOrder).pop() || null;

    // 3. Tạo câu diễn giải vị trí tự nhiên
    let orderExplanationText = '';
    if (sortedSiblings.length === 0) {
      orderExplanationText = LESSON_ORDER_CONSTANTS.FIRST_IN_TOPIC;
    } else if (targetOrder === 1) {
      orderExplanationText = LESSON_ORDER_CONSTANTS.HEAD_OF_TOPIC;
    } else if (targetOrder > sortedSiblings.length) {
      const lastLesson = sortedSiblings[sortedSiblings.length - 1];
      orderExplanationText = `Đứng sau: "${lastLesson.title}" ${LESSON_ORDER_CONSTANTS.TAIL_SUFFIX}`;
    } else if (precedingLesson) {
      orderExplanationText = `${LESSON_ORDER_CONSTANTS.INSERT_AFTER_PREFIX}"${precedingLesson.title}"`;
    } else {
      orderExplanationText = `${LESSON_ORDER_CONSTANTS.POSITION_PREFIX}${String(targetOrder).padStart(2, '0')}`;
    }

    // 4. Ghép dòng thời gian ảo (Auto-shift on insert)
    const previewTimeline: LessonTimelineItem[] = [];
    let currentInserted = false;
    let rank = 1;

    const currentName =
      currentTitle?.trim() ||
      (currentLessonId
        ? LESSON_ORDER_CONSTANTS.CURRENT_FALLBACK_EDIT
        : LESSON_ORDER_CONSTANTS.CURRENT_FALLBACK_NEW);

    for (const sib of sortedSiblings) {
      if (!currentInserted && rank >= targetOrder) {
        previewTimeline.push({
          id: '__CURRENT_LESSON__',
          title: currentName,
          displayOrder: rank,
          isCurrent: true,
        });
        rank++;
        currentInserted = true;
      }

      previewTimeline.push({
        id: sib.id,
        title: sib.title,
        displayOrder: rank,
        isCurrent: false,
        isShifted: currentInserted,
      });
      rank++;
    }

    if (!currentInserted) {
      previewTimeline.push({
        id: '__CURRENT_LESSON__',
        title: currentName,
        displayOrder: rank,
        isCurrent: true,
      });
    }

    return {
      previewTimeline,
      orderExplanationText,
      maxNextOrder,
      otherLessonsCount: otherLessons.length,
    };
  }
}
