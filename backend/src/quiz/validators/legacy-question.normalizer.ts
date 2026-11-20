import { QuizQuestionType } from '../types/quiz-question.types';

/**
 * Chuyển câu hỏi ở các định dạng cũ (seed / bản nháp trước khi có bộ kiểm tra) về đúng định dạng
 * `validateAndNormalizeQuestions` nhận. Câu đã đúng định dạng đi qua không đổi.
 *
 * Định dạng cũ từng gặp:
 *  - lựa chọn là chuỗi trần, đáp án ghi bằng chữ (`correctAnswer` / `correctAnswers`) hoặc bằng id;
 *  - TRUE_FALSE đáp án "Đúng" / "Sai";
 *  - ORDERING / MATCHING phần tử là chuỗi hoặc `{ id, text }`, thứ tự / cặp nối theo chỉ số;
 *  - MATCHING dạng `pairs: [{ left, right }]`;
 *  - dạng riêng: TIMELINE (= ORDERING), SOURCE_ANALYSIS / RECOGNITION (= chọn 1 đáp án).
 * MAP (chỉ có vùng mô tả bằng chữ, không chấm tự động được) → `null`.
 */

type Raw = Record<string, unknown>;
type Labeled = { id: string; label: string };

const LEGACY_TYPE_ALIASES: Record<string, QuizQuestionType> = {
  TIMELINE: QuizQuestionType.ORDERING,
  SOURCE_ANALYSIS: QuizQuestionType.SINGLE_CHOICE,
  RECOGNITION: QuizQuestionType.SINGLE_CHOICE,
};
const UNSUPPORTED_LEGACY_TYPES = new Set(['MAP']);
const TRUE_WORDS = new Set(['đúng', 'true', 'dung']);
const FALSE_WORDS = new Set(['sai', 'false']);
const OPTION_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

const isRecord = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];
const textOf = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value;
  if (!isRecord(value)) return undefined;
  if (typeof value.label === 'string') return value.label;
  return typeof value.text === 'string' ? value.text : undefined;
};

/** Phần tử là chuỗi hoặc `{ id, text|label }` → `{ id, label }` (id tự đặt nếu thiếu). */
function toLabeledItems(list: unknown[], idPrefix: string): Labeled[] {
  return list.map((item, index) => ({
    id:
      isRecord(item) && typeof item.id === 'string'
        ? item.id
        : `${idPrefix}${index + 1}`,
    label: textOf(item) ?? '',
  }));
}

/** Tham chiếu tới phần tử theo chỉ số, id hoặc nhãn → id. */
function resolveItemId(ref: unknown, items: Labeled[]): unknown {
  if (typeof ref === 'number') return items[ref]?.id ?? ref;
  if (typeof ref !== 'string') return ref;
  return (
    items.find((item) => item.id === ref)?.id ??
    items.find((item) => item.label === ref)?.id ??
    ref
  );
}

function correctRefsOf(q: Raw): unknown[] {
  if (Array.isArray(q.correctAnswers)) return q.correctAnswers;
  return q.correctAnswer === undefined ? [] : [q.correctAnswer];
}

function normalizeChoice(q: Raw, type: QuizQuestionType): Raw {
  const refs = correctRefsOf(q);
  const options = asArray(q.options).map((opt, index) => {
    const id =
      isRecord(opt) && typeof opt.id === 'string'
        ? opt.id
        : OPTION_LETTERS[index];
    const text = textOf(opt) ?? '';
    const explicit = isRecord(opt) ? opt.isCorrect : undefined;
    const isCorrect =
      typeof explicit === 'boolean'
        ? explicit
        : refs.includes(id) || refs.includes(text);
    const explanation =
      isRecord(opt) && typeof opt.explanation === 'string'
        ? { explanation: opt.explanation }
        : {};
    return { id, text, isCorrect, ...explanation };
  });
  // Câu ghi "nhiều lựa chọn" nhưng chỉ có 1 đáp án dạng `correctAnswer` thực chất là chọn 1.
  const singleAnswer =
    type === QuizQuestionType.MULTIPLE_CHOICE &&
    !Array.isArray(q.correctAnswers) &&
    q.correctAnswer !== undefined &&
    options.filter((o) => o.isCorrect).length === 1;
  return {
    type: singleAnswer ? QuizQuestionType.SINGLE_CHOICE : type,
    options,
  };
}

function normalizeTrueFalse(q: Raw): Raw {
  if (typeof q.correctAnswer === 'boolean') {
    return { correctAnswer: q.correctAnswer };
  }
  const word = String(q.correctAnswer ?? '')
    .trim()
    .toLowerCase();
  if (TRUE_WORDS.has(word)) return { correctAnswer: true };
  if (FALSE_WORDS.has(word)) return { correctAnswer: false };
  return { correctAnswer: q.correctAnswer };
}

function normalizeOrdering(q: Raw): Raw {
  const items = toLabeledItems(asArray(q.items), 'i');
  return {
    items,
    correctOrder: asArray(q.correctOrder).map((ref) =>
      resolveItemId(ref, items),
    ),
  };
}

function normalizeMatching(q: Raw): Raw {
  if (Array.isArray(q.pairs)) {
    const pairs = q.pairs.filter(isRecord);
    const leftItems = toLabeledItems(
      pairs.map((p) => p.left),
      'l',
    );
    const rightItems = toLabeledItems(
      pairs.map((p) => p.right),
      'r',
    );
    return {
      leftItems,
      rightItems,
      correctPairs: leftItems.map((left, i) => ({
        leftId: left.id,
        rightId: rightItems[i].id,
      })),
    };
  }
  const leftItems = toLabeledItems(asArray(q.leftItems), 'l');
  const rightItems = toLabeledItems(asArray(q.rightItems), 'r');
  const correctPairs = asArray(q.correctPairs)
    .filter(isRecord)
    .map((pair) => ({
      leftId: resolveItemId(pair.leftId ?? pair.left, leftItems),
      rightId: resolveItemId(pair.rightId ?? pair.right, rightItems),
    }));
  return { leftItems, rightItems, correctPairs };
}

function normalizeFillInBlank(q: Raw): Raw {
  const accepted = Array.isArray(q.acceptedAnswers)
    ? q.acceptedAnswers
    : typeof q.correctAnswer === 'string'
      ? [q.correctAnswer]
      : [];
  return {
    acceptedAnswers: accepted,
    ...(q.caseSensitive !== undefined
      ? { caseSensitive: q.caseSensitive }
      : {}),
  };
}

function normalizeBody(q: Raw, type: QuizQuestionType): Raw {
  switch (type) {
    case QuizQuestionType.SINGLE_CHOICE:
    case QuizQuestionType.MULTIPLE_CHOICE:
      return normalizeChoice(q, type);
    case QuizQuestionType.TRUE_FALSE:
      return normalizeTrueFalse(q);
    case QuizQuestionType.ORDERING:
      return normalizeOrdering(q);
    case QuizQuestionType.MATCHING:
      return normalizeMatching(q);
    case QuizQuestionType.FILL_IN_BLANK:
      return normalizeFillInBlank(q);
  }
}

/** `null` nếu là dạng cũ không chấm tự động được (MAP). Dạng lạ khác giữ nguyên để bộ kiểm tra báo lỗi. */
export function normalizeLegacyQuestion(raw: Raw): Raw | null {
  const rawType = String(raw.type ?? '');
  if (UNSUPPORTED_LEGACY_TYPES.has(rawType)) return null;
  const type =
    LEGACY_TYPE_ALIASES[rawType] ??
    (Object.values(QuizQuestionType).find((t) => t === rawType) || undefined);
  if (!type) return raw;

  const explanation =
    typeof raw.explanation === 'string' ? { explanation: raw.explanation } : {};
  return {
    id: raw.id,
    type,
    prompt: raw.prompt,
    ...explanation,
    ...normalizeBody(raw, type),
  };
}
