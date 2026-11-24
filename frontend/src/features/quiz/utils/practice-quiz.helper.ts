/**
 * Lọc / tìm kiếm đề luyện tập (đề thi thuộc Chủ đề — một đề có thể bao nhiều chủ đề).
 */
import type { PracticeQuizItem } from '@/services/entities/quiz.service';
import { QuizQuestionType, type QuizQuestion } from '@/features/lessons/types/editor.types';
import type { UserQuizAnswer } from '@/features/public-curriculum/strategies/public-curriculum.strategies';

export const ALL_TOPICS_ID = 'ALL';
/** Tham số URL chọn sẵn chủ đề, vd. `/luyen-tap?topic=<id>` từ trang đọc bài học. */
export const PRACTICE_TOPIC_PARAM = 'topic';

/** Một dòng trong ô chọn chủ đề: theo thứ tự cây (cha trước con), `count` = số đề cả nhánh. */
export interface QuizTopicOption {
  id: string;
  name: string;
  depth: number;
  count: number;
}

export interface QuizFilterCriteria {
  query: string;
  /** Chủ đề đã chọn cùng mọi chủ đề con cháu; null = tất cả. */
  topicIds: ReadonlySet<string> | null;
}

interface TopicNodeRef {
  id: string;
  name: string;
  parentId: string | null;
}

function childrenByParent(topics: TopicNodeRef[]): Map<string | null, TopicNodeRef[]> {
  const ids = new Set(topics.map((t) => t.id));
  const map = new Map<string | null, TopicNodeRef[]>();
  topics.forEach((topic) => {
    // Cha chưa xuất bản thì coi như gốc, để nhánh con vẫn hiện.
    const parentKey = topic.parentId && ids.has(topic.parentId) ? topic.parentId : null;
    map.set(parentKey, [...(map.get(parentKey) ?? []), topic]);
  });
  return map;
}

/**
 * Cây chủ đề cho ô lọc, chỉ giữ nhánh có đề; duyệt đệ quy nên không giới hạn số cấp.
 * Chủ đề gắn ở đề mà không có trong cây (vd. tải cây lỗi) được thêm ở cấp gốc.
 */
export function buildTopicFilterOptions(
  topics: TopicNodeRef[],
  quizzes: PracticeQuizItem[],
): QuizTopicOption[] {
  const quizIdsByTopic = new Map<string, Set<string>>();
  quizzes.forEach((quiz) =>
    quiz.topics.forEach((topic) => {
      quizIdsByTopic.set(topic.id, (quizIdsByTopic.get(topic.id) ?? new Set()).add(quiz.id));
    }),
  );
  const children = childrenByParent(topics);
  const visited = new Set<string>();

  const walk = (node: TopicNodeRef, depth: number): { options: QuizTopicOption[]; quizIds: Set<string> } => {
    visited.add(node.id);
    const quizIds = new Set(quizIdsByTopic.get(node.id));
    const childOptions = (children.get(node.id) ?? [])
      .filter((child) => !visited.has(child.id))
      .flatMap((child) => {
        const sub = walk(child, depth + 1);
        sub.quizIds.forEach((id) => quizIds.add(id));
        return sub.options;
      });
    if (quizIds.size === 0) return { options: [], quizIds };
    return { options: [{ id: node.id, name: node.name, depth, count: quizIds.size }, ...childOptions], quizIds };
  };

  const options = (children.get(null) ?? []).flatMap((root) => walk(root, 0).options);
  const orphanTopics = new Map(
    quizzes.flatMap((quiz) => quiz.topics).filter((t) => !visited.has(t.id)).map((t) => [t.id, t]),
  );
  orphanTopics.forEach((topic) =>
    options.push({ id: topic.id, name: topic.name, depth: 0, count: quizIdsByTopic.get(topic.id)?.size ?? 0 }),
  );
  return options;
}

/** Chủ đề `topicId` và mọi chủ đề con cháu của nó. */
export function topicWithDescendants(topics: TopicNodeRef[], topicId: string): Set<string> {
  const children = childrenByParent(topics);
  const result = new Set<string>();
  const collect = (id: string) => {
    if (result.has(id)) return;
    result.add(id);
    (children.get(id) ?? []).forEach((child) => collect(child.id));
  };
  collect(topicId);
  return result;
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

/** Lọc đề theo chủ đề (gồm cả chủ đề con) và từ khoá (tên đề, mô tả, tên chủ đề). */
export function filterPracticeQuizzes(
  quizzes: PracticeQuizItem[],
  criteria: QuizFilterCriteria,
): PracticeQuizItem[] {
  const normalizedQuery = normalizeSearchText(criteria.query || '');
  const { topicIds } = criteria;
  return quizzes.filter(
    (quiz) =>
      (!topicIds || quiz.topics.some((t) => topicIds.has(t.id))) &&
      matchesQuery(quiz, normalizedQuery),
  );
}

/** Tên chủ đề hiển thị trên thẻ đề. */
export const topicLabelOf = (quiz: PracticeQuizItem): string =>
  quiz.topics.map((t) => t.name).join(' · ') || 'Chủ đề Lịch sử';

/**
 * Ghép đáp án + lời giải server trả sau khi nộp vào các câu đang hiển thị. Giữ thứ tự lựa chọn và cột phải
 * đã trộn trong phiên làm bài để bài làm không bị đảo chỗ khi hiện kết quả.
 */
export function revealAnswers(shown: QuizQuestion[], answered: QuizQuestion[]): QuizQuestion[] {
  const answeredById = new Map(answered.map((q) => [q.id, q]));
  return shown.map((question) => {
    const full = answeredById.get(question.id);
    if (!full) return question;
    if (
      (full.type === QuizQuestionType.SINGLE_CHOICE || full.type === QuizQuestionType.MULTIPLE_CHOICE) &&
      'options' in question
    ) {
      const fullOptions = new Map(full.options.map((o) => [o.id, o]));
      return { ...full, options: question.options.map((o) => fullOptions.get(o.id) ?? o) };
    }
    if (full.type === QuizQuestionType.MATCHING && 'rightItems' in question) {
      return { ...full, rightItems: question.rightItems };
    }
    return full;
  });
}

/**
 * Câu người học đã thực sự trả lời: phải từng thao tác (câu sắp xếp có sẵn thứ tự xáo trộn
 * từ đầu, không tính) và câu trả lời không rỗng (bỏ chọn hết / xoá chữ thì coi như chưa làm).
 */
export function isQuestionAnswered(
  questionId: string,
  touchedIds: ReadonlySet<string>,
  answers: Record<string, UserQuizAnswer>,
): boolean {
  if (!touchedIds.has(questionId)) return false;
  const answer = answers[questionId];
  if (typeof answer === 'string') return answer.trim() !== '';
  if (Array.isArray(answer)) return answer.length > 0;
  if (answer && typeof answer === 'object') return Object.keys(answer).length > 0;
  return typeof answer === 'boolean';
}

/** Chỉ gửi câu đã trả lời; câu bỏ qua được server chấm là sai và thống kê ghi là bỏ trống. */
export function pickAnsweredAnswers(
  answers: Record<string, UserQuizAnswer>,
  touchedIds: ReadonlySet<string>,
): Record<string, UserQuizAnswer> {
  return Object.fromEntries(
    Object.entries(answers).filter(([id]) => isQuestionAnswered(id, touchedIds, answers)),
  );
}

/** Giây còn lại → "mm:ss" cho đồng hồ phòng thi. */
export function formatExamTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export enum QuestionTopicMode {
  BANK = 'BANK',
  INHERITED = 'INHERITED',
}

export interface TopicRef {
  id: string;
  name?: string;
}

export interface QuestionWithOptionalTopics {
  topics?: TopicRef[];
}

export interface TopicPresentationStrategy {
  collapsedByDefault: boolean;
  label: string;
  placeholder: string;
  helperText: string;
  customizeActionLabel: string;
  inheritedPrefix: string;
  emptyInheritedText: string;
}

export const QUESTION_TOPIC_STRATEGIES: Record<
  QuestionTopicMode,
  TopicPresentationStrategy
> = {
  [QuestionTopicMode.BANK]: {
    collapsedByDefault: false,
    label: 'Chủ đề kiến thức',
    placeholder: 'Chung · Chọn chủ đề để lọc kho',
    helperText: 'Tuỳ chọn — giúp tìm kiếm nhanh trong ngân hàng và bài học',
    customizeActionLabel: 'Chọn chủ đề',
    inheritedPrefix: 'Chủ đề kiến thức',
    emptyInheritedText: 'Chung',
  },
  [QuestionTopicMode.INHERITED]: {
    collapsedByDefault: true,
    label: 'Chủ đề áp dụng',
    placeholder: 'Chung · Tự động gắn theo ngữ cảnh',
    helperText: 'Tự động đồng bộ từ đề thi hoặc bài học đang soạn',
    customizeActionLabel: 'Tuỳ chỉnh',
    inheritedPrefix: 'Tự gắn theo ngữ cảnh',
    emptyInheritedText: 'Chung · Theo đề đang soạn',
  },
};

export function resolveQuestionTopicStrategy(
  mode: QuestionTopicMode,
): TopicPresentationStrategy {
  return QUESTION_TOPIC_STRATEGIES[mode];
}

export function resolveTopicNames(
  topicIds: string[],
  topicsList: Array<{ id: string; name: string }>,
): string[] {
  const nameById = new Map(topicsList.map((topic) => [topic.id, topic.name]));
  return topicIds
    .map((id) => nameById.get(id))
    .filter((name): name is string => Boolean(name));
}

export function collectSuggestedTopicIds(
  questions: QuestionWithOptionalTopics[],
): string[] {
  const seen = new Set<string>();
  const collected: string[] = [];

  for (const question of questions) {
    for (const topic of question.topics ?? []) {
      if (topic.id && !seen.has(topic.id)) {
        seen.add(topic.id);
        collected.push(topic.id);
      }
    }
  }

  return collected;
}

export function mergeInheritedTopics(
  currentTopicIds: string[],
  pickedQuestions: QuestionWithOptionalTopics[],
): { nextTopicIds: string[]; autoApplied: boolean } {
  if (currentTopicIds.length > 0) {
    return { nextTopicIds: currentTopicIds, autoApplied: false };
  }

  const suggested = collectSuggestedTopicIds(pickedQuestions);
  return {
    nextTopicIds: suggested,
    autoApplied: suggested.length > 0,
  };
}
