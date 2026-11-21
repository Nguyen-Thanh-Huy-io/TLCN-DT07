import { describe, expect, it } from 'vitest';
import {
  QuestionTopicMode,
  collectSuggestedTopicIds,
  mergeInheritedTopics,
  resolveQuestionTopicStrategy,
  resolveTopicNames,
} from '@/features/quiz/utils/question-topic.strategy';

describe('question-topic.strategy', () => {
  it('trả về cấu hình gọn cho từng ngữ cảnh và không chứa ngoặc đơn', () => {
    const bank = resolveQuestionTopicStrategy(QuestionTopicMode.BANK);
    const inherited = resolveQuestionTopicStrategy(QuestionTopicMode.INHERITED);

    expect(bank.collapsedByDefault).toBe(false);
    expect(inherited.collapsedByDefault).toBe(true);
    expect(bank.label + bank.placeholder + bank.helperText).not.toMatch(/[()]/);
    expect(inherited.label + inherited.inheritedPrefix + inherited.emptyInheritedText).not.toMatch(
      /[()]/,
    );
  });

  it('resolveTopicNames ánh xạ ID sang tên chủ đề giữ đúng thứ tự và bỏ qua ID không khớp', () => {
    const names = resolveTopicNames(
      ['t2', 'missing', 't1'],
      [
        { id: 't1', name: 'Nhà Lý' },
        { id: 't2', name: 'Nhà Trần' },
      ],
    );
    expect(names).toEqual(['Nhà Trần', 'Nhà Lý']);
  });

  it('collectSuggestedTopicIds gom topic duy nhất từ nhiều câu hỏi đã chọn', () => {
    const ids = collectSuggestedTopicIds([
      { topics: [{ id: 't1', name: 'Nhà Lý' }, { id: 't2', name: 'Nhà Trần' }] },
      { topics: [{ id: 't2', name: 'Nhà Trần' }, { id: 't3', name: 'Nhà Lê' }] },
      {},
    ]);
    expect(ids).toEqual(['t1', 't2', 't3']);
  });

  it('mergeInheritedTopics chỉ tự động gắn khi đề thi chưa có chủ đề riêng', () => {
    const emptyQuizMerge = mergeInheritedTopics([], [
      { topics: [{ id: 't1', name: 'Nhà Lý' }] },
      { topics: [{ id: 't1' }, { id: 't2' }] },
    ]);
    expect(emptyQuizMerge).toEqual({ nextTopicIds: ['t1', 't2'], autoApplied: true });

    const existingQuizMerge = mergeInheritedTopics(['t-existing'], [{ topics: [{ id: 't1' }] }]);
    expect(existingQuizMerge).toEqual({ nextTopicIds: ['t-existing'], autoApplied: false });
  });
});
