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

  const base = {
    id: q.id as string,
    prompt: q.prompt as string,
    explanation: q.explanation as string | undefined,
  };

  switch (q.type as QuizQuestionType) {
    case QuizQuestionType.MULTIPLE_CHOICE: {
      const options = q.options;
      if (!Array.isArray(options) || options.length < 2) {
        fail(index, 'MULTIPLE_CHOICE cần `options` là mảng ít nhất 2 lựa chọn.');
      }
      const normalized = options.map((opt: any, optIdx: number) => {
        if (typeof opt?.id !== 'string' || typeof opt?.text !== 'string') {
          fail(index, `lựa chọn #${optIdx + 1} thiếu \`id\`/\`text\`.`);
        }
        return { id: opt.id, text: opt.text, isCorrect: Boolean(opt.isCorrect) };
      });
      if (!normalized.some((o) => o.isCorrect)) {
        fail(index, 'MULTIPLE_CHOICE cần ít nhất 1 lựa chọn đúng (`isCorrect: true`).');
      }
      return { ...base, type: QuizQuestionType.MULTIPLE_CHOICE, options: normalized };
    }

    case QuizQuestionType.TRUE_FALSE: {
      if (typeof q.correctAnswer !== 'boolean') {
        fail(index, 'TRUE_FALSE cần `correctAnswer` là boolean.');
      }
      return { ...base, type: QuizQuestionType.TRUE_FALSE, correctAnswer: q.correctAnswer };
    }

    case QuizQuestionType.ORDERING: {
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

    case QuizQuestionType.MATCHING: {
      const leftItems = q.leftItems;
      const rightItems = q.rightItems;
      const correctPairs = q.correctPairs;
      if (!Array.isArray(leftItems) || !Array.isArray(rightItems) || leftItems.length === 0 || rightItems.length === 0) {
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

    case QuizQuestionType.FILL_IN_BLANK: {
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

    default:
      // Không thể xảy ra vì đã kiểm tra Object.values ở trên — giữ để TS exhaustiveness check.
      fail(index, 'dạng câu hỏi không được hỗ trợ.');
  }
}
