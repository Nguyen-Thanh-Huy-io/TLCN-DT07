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

/** Thu thập danh sách topicId duy nhất từ các câu hỏi đã chọn trong ngân hàng. */
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

/**
 * Tự đồng bộ chủ đề cho Đề thi khi đề chưa có chủ đề riêng
 * nhưng câu hỏi được nhặt từ Ngân hàng đã mang chủ đề kiến thức.
 */
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
