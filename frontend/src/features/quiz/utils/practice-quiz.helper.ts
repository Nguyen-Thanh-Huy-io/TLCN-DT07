// --- quiz-filter.strategy.ts ---
/**
 * Quiz Filter Strategy - HISGO Digital Museum & Interactive Learning
 * Áp dụng Strategy Pattern và nguyên tắc SOLID (SRP, OCP) để xử lý logic lọc và tìm kiếm bộ đề luyện tập.
 */

export const ALL_TOPICS_ID = 'ALL';

export interface QuizTopicOption {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export interface QuizFilterCriteria {
  query: string;
  topicId: string;
  timeLimit?: number | null;
}

export interface QuizFilterableItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  topic: { id: string; name: string; slug: string } | null;
  quiz: {
    id: string;
    title: string;
    questions: unknown[];
    timeLimitMinutes: number;
  } | null;
}

/**
 * Trích xuất danh sách các chủ đề (Topics) duy nhất kèm số lượng đề thi từ danh sách bài học
 */
export function extractAvailableTopics<T extends QuizFilterableItem>(items: T[]): QuizTopicOption[] {
  const map = new Map<string, QuizTopicOption>();

  items.forEach((item) => {
    if (item.topic) {
      const existing = map.get(item.topic.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(item.topic.id, {
          id: item.topic.id,
          name: item.topic.name,
          slug: item.topic.slug,
          count: 1,
        });
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

/**
 * Chuẩn hóa chuỗi tiếng Việt để tìm kiếm không phân biệt dấu và chữ hoa/thường
 */
function normalizeSearchText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Strategy Pattern: Lọc danh sách bài học theo tiêu chí tìm kiếm và chủ đề (OCP)
 */
export function filterQuizLessons<T extends QuizFilterableItem>(
  items: T[],
  criteria: QuizFilterCriteria,
): T[] {
  const normalizedQuery = normalizeSearchText(criteria.query || '');

  return items.filter((item) => {
    // 1. Lọc theo chủ đề
    if (criteria.topicId && criteria.topicId !== ALL_TOPICS_ID) {
      if (!item.topic || item.topic.id !== criteria.topicId) {
        return false;
      }
    }

    // 2. Lọc theo từ khóa tìm kiếm (tiêu đề bài học, tiêu đề quiz, mô tả, tên chủ đề)
    if (normalizedQuery) {
      const title = normalizeSearchText(item.title || '');
      const quizTitle = normalizeSearchText(item.quiz?.title || '');
      const desc = normalizeSearchText(item.description || '');
      const topicName = normalizeSearchText(item.topic?.name || '');

      const matches =
        title.includes(normalizedQuery) ||
        quizTitle.includes(normalizedQuery) ||
        desc.includes(normalizedQuery) ||
        topicName.includes(normalizedQuery);

      if (!matches) {
        return false;
      }
    }

    return true;
  });
}
