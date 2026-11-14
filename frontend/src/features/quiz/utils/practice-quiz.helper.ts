/**
 * Lọc / tìm kiếm đề luyện tập (đề thi thuộc Chủ đề — một đề có thể bao nhiều chủ đề).
 */
import type { PracticeQuizItem } from '@/services/entities/quiz.service';

export const ALL_TOPICS_ID = 'ALL';
/** Tham số URL chọn sẵn chủ đề, vd. `/luyen-tap?topic=<id>` từ trang đọc bài học. */
export const PRACTICE_TOPIC_PARAM = 'topic';

export interface QuizTopicOption {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface QuizFilterCriteria {
  query: string;
  topicId: string;
}

/** Các chủ đề có đề, kèm số đề của mỗi chủ đề. */
export function extractAvailableTopics(quizzes: PracticeQuizItem[]): QuizTopicOption[] {
  const map = new Map<string, QuizTopicOption>();
  quizzes.forEach((quiz) => {
    quiz.topics.forEach((topic) => {
      const existing = map.get(topic.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(topic.id, { ...topic, count: 1 });
      }
    });
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/** Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt dấu và chữ hoa/thường */
function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function matchesQuery(quiz: PracticeQuizItem, normalizedQuery: string): boolean {
  if (!normalizedQuery) return true;
  return [quiz.title, quiz.description ?? '', ...quiz.topics.map((t) => t.name)].some((text) =>
    normalizeSearchText(text).includes(normalizedQuery),
  );
}

/** Lọc đề theo chủ đề và từ khoá (tên đề, mô tả, tên chủ đề). */
export function filterPracticeQuizzes(
  quizzes: PracticeQuizItem[],
  criteria: QuizFilterCriteria,
): PracticeQuizItem[] {
  const normalizedQuery = normalizeSearchText(criteria.query || '');
  const byTopic = criteria.topicId && criteria.topicId !== ALL_TOPICS_ID;
  return quizzes.filter(
    (quiz) =>
      (!byTopic || quiz.topics.some((t) => t.id === criteria.topicId)) &&
      matchesQuery(quiz, normalizedQuery),
  );
}

/** Tên chủ đề hiển thị trên thẻ đề. */
export const topicLabelOf = (quiz: PracticeQuizItem): string =>
  quiz.topics.map((t) => t.name).join(' · ') || 'Chủ đề Lịch sử';
