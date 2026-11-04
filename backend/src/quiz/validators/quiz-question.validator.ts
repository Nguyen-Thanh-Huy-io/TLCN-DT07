import { BadRequestException } from '@nestjs/common';
import { QuizQuestion, QuizQuestionType } from '../types/quiz-question.types';

/**
 * Validate + chuẩn hóa mảng câu hỏi gửi lên từ CMS trước khi lưu vào cột JSONB
 * `Quiz.questions`. Mỗi dạng câu hỏi (`type`) có field riêng khác nhau hoàn toàn nên
 * không dùng class-validator cho union đa hình — validate thủ công tại đây, báo lỗi
 * rõ ràng theo đúng từng câu/field sai để CMS hiển thị được cho người soạn đề.
 */
export function validateAndNormalizeQuestions(input: unknown): QuizQuestion[] {
  if (!Array.isArray(input)) {
    throw new BadRequestException('`questions` phải là một mảng.');
  }

  return input.map((raw, index) => validateOneQuestion(raw, index));
}

function fail(index: number, message: string): never {
  throw new BadRequestException(`Câu hỏi #${index + 1}: ${message}`);
}

interface BaseValidatedQuestion {
  id: string;
  prompt: string;
  explanation?: string;
}

interface IQuestionValidationStrategy {
  validateAndNormalize(
    q: Record<string, unknown>,
    base: BaseValidatedQuestion,
    index: number,
  ): QuizQuestion;
}

/**
 * Template Method Pattern dùng chung cho cả SINGLE_CHOICE và MULTIPLE_CHOICE
 */
abstract class BaseChoiceValidationStrategy implements IQuestionValidationStrategy {
  protected abstract readonly questionType:
    | QuizQuestionType.SINGLE_CHOICE
    | QuizQuestionType.MULTIPLE_CHOICE;

  protected abstract validateCorrectCount(correctCount: number, index: number): void;

  validateAndNormalize(
    q: Record<string, unknown>,
    base: BaseValidatedQuestion,
    index: number,
  ): QuizQuestion {
    const options = q.options;
    if (!Array.isArray(options) || options.length < 2) {
      fail(index, `${this.questionType} cần \`options\` là mảng ít nhất 2 lựa chọn.`);
    }

    const normalized = options.map((opt: any, optIdx: number) => {
      if (typeof opt?.id !== 'string' || typeof opt?.text !== 'string') {
        fail(index, `lựa chọn #${optIdx + 1} thiếu \`id\`/\`text\`.`);
      }
      if (opt.explanation !== undefined && typeof opt.explanation !== 'string') {
        fail(index, `lựa chọn #${optIdx + 1} có \`explanation\` không phải là chuỗi.`);
      }
      return {
        id: opt.id,
        text: opt.text,
        isCorrect: Boolean(opt.isCorrect),
        ...(typeof opt.explanation === 'string' && opt.explanation.trim()
          ? { explanation: opt.explanation.trim() }
          : {}),
      };
    });

    const correctCount = normalized.filter((o) => o.isCorrect).length;
    this.validateCorrectCount(correctCount, index);

    return {
      ...base,
      type: this.questionType,
      options: normalized,
    } as QuizQuestion;
  }
}

class SingleChoiceValidationStrategy extends BaseChoiceValidationStrategy {
  protected readonly questionType = QuizQuestionType.SINGLE_CHOICE;

  protected validateCorrectCount(correctCount: number, index: number): void {
    if (correctCount !== 1) {
      fail(index, 'SINGLE_CHOICE cần chính xác 1 lựa chọn đúng (`isCorrect: true`).');
    }
  }
}

class MultipleChoiceValidationStrategy extends BaseChoiceValidationStrategy {
  protected readonly questionType = QuizQuestionType.MULTIPLE_CHOICE;

  protected validateCorrectCount(correctCount: number, index: number): void {
    if (correctCount < 1) {
      fail(index, 'MULTIPLE_CHOICE cần ít nhất 1 lựa chọn đúng (`isCorrect: true`).');
    }
  }
}

class TrueFalseValidationStrategy implements IQuestionValidationStrategy {
  validateAndNormalize(
    q: Record<string, unknown>,
    base: BaseValidatedQuestion,
    index: number,
  ): QuizQuestion {
    if (typeof q.correctAnswer !== 'boolean') {
      fail(index, 'TRUE_FALSE cần `correctAnswer` là boolean.');
    }
    return {
      ...base,
      type: QuizQuestionType.TRUE_FALSE,
      correctAnswer: q.correctAnswer,
    };
  }
}

class OrderingValidationStrategy implements IQuestionValidationStrategy {
  validateAndNormalize(
    q: Record<string, unknown>,
    base: BaseValidatedQuestion,
    index: number,
  ): QuizQuestion {
    const items = q.items;
    const correctOrder = q.correctOrder;
    if (!Array.isArray(items) || items.length < 2) {
      fail(index, 'ORDERING cần `items` là mảng ít nhất 2 phần tử.');
    }
    const normalizedItems = items.map((it: any, itIdx: number) => {
      if (typeof it?.id !== 'string' || typeof it?.label !== 'string') {
        fail(index, `mốc #${itIdx + 1} thiếu \`id\`/\`label\`.`);
      }
      return { id: it.id, label: it.label };
    });
    if (!Array.isArray(correctOrder) || correctOrder.length !== normalizedItems.length) {
      fail(index, '`correctOrder` phải là mảng id, đủ số lượng bằng `items`.');
    }
    const itemIds = new Set(normalizedItems.map((it) => it.id));
    if (!(correctOrder as unknown[]).every((id) => typeof id === 'string' && itemIds.has(id))) {
      fail(index, '`correctOrder` chứa id không khớp với `items`.');
    }
    return {
      ...base,
      type: QuizQuestionType.ORDERING,
      items: normalizedItems,
      correctOrder: correctOrder as string[],
    };
  }
}

class MatchingValidationStrategy implements IQuestionValidationStrategy {
  validateAndNormalize(
    q: Record<string, unknown>,
    base: BaseValidatedQuestion,
    index: number,
  ): QuizQuestion {
    const leftItems = q.leftItems;
    const rightItems = q.rightItems;
    const correctPairs = q.correctPairs;
    if (
      !Array.isArray(leftItems) ||
      !Array.isArray(rightItems) ||
      leftItems.length === 0 ||
      rightItems.length === 0
    ) {
      fail(index, 'MATCHING cần `leftItems` và `rightItems` là mảng không rỗng.');
    }
    const normalize = (list: any[], label: string) =>
      list.map((it: any, i: number) => {
        if (typeof it?.id !== 'string' || typeof it?.label !== 'string') {
          fail(index, `${label} #${i + 1} thiếu \`id\`/\`label\`.`);
        }
        return { id: it.id, label: it.label };
      });
    const normLeft = normalize(leftItems, 'leftItems');
    const normRight = normalize(rightItems, 'rightItems');
    if (!Array.isArray(correctPairs) || correctPairs.length === 0) {
      fail(index, 'MATCHING cần `correctPairs` là mảng không rỗng.');
    }
    const leftIds = new Set(normLeft.map((i) => i.id));
    const rightIds = new Set(normRight.map((i) => i.id));
    const normPairs = (correctPairs as any[]).map((p, i) => {
      if (!leftIds.has(p?.leftId) || !rightIds.has(p?.rightId)) {
        fail(index, `cặp nối #${i + 1} có leftId/rightId không khớp.`);
      }
      return { leftId: p.leftId, rightId: p.rightId };
    });
    return {
      ...base,
      type: QuizQuestionType.MATCHING,
      leftItems: normLeft,
      rightItems: normRight,
      correctPairs: normPairs,
    };
  }
}

class FillInBlankValidationStrategy implements IQuestionValidationStrategy {
  validateAndNormalize(
    q: Record<string, unknown>,
    base: BaseValidatedQuestion,
    index: number,
  ): QuizQuestion {
    const acceptedAnswers = q.acceptedAnswers;
    if (!Array.isArray(acceptedAnswers) || acceptedAnswers.length === 0) {
      fail(index, 'FILL_IN_BLANK cần `acceptedAnswers` là mảng không rỗng.');
    }
    if (!(acceptedAnswers as unknown[]).every((a) => typeof a === 'string' && a.trim())) {
      fail(index, 'Mỗi phần tử trong `acceptedAnswers` phải là chuỗi không rỗng.');
    }
    return {
      ...base,
      type: QuizQuestionType.FILL_IN_BLANK,
      acceptedAnswers: acceptedAnswers as string[],
      caseSensitive: Boolean(q.caseSensitive),
    };
  }
}

const QUESTION_VALIDATION_STRATEGIES: Record<
  QuizQuestionType,
  IQuestionValidationStrategy
> = {
  [QuizQuestionType.SINGLE_CHOICE]: new SingleChoiceValidationStrategy(),
  [QuizQuestionType.MULTIPLE_CHOICE]: new MultipleChoiceValidationStrategy(),
  [QuizQuestionType.TRUE_FALSE]: new TrueFalseValidationStrategy(),
  [QuizQuestionType.ORDERING]: new OrderingValidationStrategy(),
  [QuizQuestionType.MATCHING]: new MatchingValidationStrategy(),
  [QuizQuestionType.FILL_IN_BLANK]: new FillInBlankValidationStrategy(),
};

function validateOneQuestion(raw: unknown, index: number): QuizQuestion {
  if (typeof raw !== 'object' || raw === null) {
    fail(index, 'phải là một object.');
  }
  const q = raw as Record<string, unknown>;

  if (typeof q.id !== 'string' || !q.id.trim()) {
    fail(index, 'thiếu `id`.');
  }
  if (typeof q.prompt !== 'string' || !q.prompt.trim()) {
    fail(index, 'thiếu `prompt` (câu hỏi/câu dẫn).');
  }
  if (q.explanation !== undefined && typeof q.explanation !== 'string') {
    fail(index, '`explanation` phải là chuỗi.');
  }
  if (!Object.values(QuizQuestionType).includes(q.type as QuizQuestionType)) {
    fail(
      index,
      `\`type\` không hợp lệ. Chỉ nhận: ${Object.values(QuizQuestionType).join(', ')}.`,
    );
  }

  const base: BaseValidatedQuestion = {
    id: q.id as string,
    prompt: q.prompt as string,
    explanation: q.explanation as string | undefined,
  };

  const strategy = QUESTION_VALIDATION_STRATEGIES[q.type as QuizQuestionType];
  if (!strategy) {
    fail(index, 'dạng câu hỏi không được hỗ trợ.');
  }

  return strategy.validateAndNormalize(q, base, index);
}
