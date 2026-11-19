import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QuestionTopicMode,
  resolveQuestionTopicStrategy,
  resolveTopicNames,
  collectSuggestedTopicIds,
  mergeInheritedTopics,
} from '../src/features/quiz/utils/question-topic.strategy.ts';

test('resolveQuestionTopicStrategy trả về cấu hình gọn cho từng ngữ cảnh và không chứa ngoặc đơn', () => {
  const bank = resolveQuestionTopicStrategy(QuestionTopicMode.BANK);
  const inherited = resolveQuestionTopicStrategy(QuestionTopicMode.INHERITED);

  assert.equal(bank.collapsedByDefault, false);
  assert.equal(inherited.collapsedByDefault, true);
  assert.doesNotMatch(bank.label + bank.placeholder + bank.helperText, /[()]/);
  assert.doesNotMatch(
    inherited.label + inherited.inheritedPrefix + inherited.emptyInheritedText,
    /[()]/,
  );
});

test('resolveTopicNames ánh xạ ID sang tên chủ đề giữ nguyên thứ tự và bỏ qua ID không khớp', () => {
  const names = resolveTopicNames(
    ['t2', 'missing', 't1'],
    [
      { id: 't1', name: 'Nhà Lý' },
      { id: 't2', name: 'Nhà Trần' },
    ],
  );
  assert.deepEqual(names, ['Nhà Trần', 'Nhà Lý']);
});

test('collectSuggestedTopicIds gom topic duy nhất từ nhiều câu hỏi đã chọn', () => {
  const ids = collectSuggestedTopicIds([
    { topics: [{ id: 't1', name: 'Nhà Lý' }, { id: 't2', name: 'Nhà Trần' }] },
    { topics: [{ id: 't2', name: 'Nhà Trần' }, { id: 't3', name: 'Nhà Lê' }] },
    {},
  ]);
  assert.deepEqual(ids, ['t1', 't2', 't3']);
});

test('mergeInheritedTopics chỉ tự động gắn khi đề thi chưa có chủ đề riêng', () => {
  const emptyQuizMerge = mergeInheritedTopics([], [
    { topics: [{ id: 't1', name: 'Nhà Lý' }] },
    { topics: [{ id: 't1' }, { id: 't2' }] },
  ]);
  assert.equal(emptyQuizMerge.autoApplied, true);
  assert.deepEqual(emptyQuizMerge.nextTopicIds, ['t1', 't2']);

  const existingQuizMerge = mergeInheritedTopics(['t-existing'], [
    { topics: [{ id: 't1' }] },
  ]);
  assert.equal(existingQuizMerge.autoApplied, false);
  assert.deepEqual(existingQuizMerge.nextTopicIds, ['t-existing']);
});
