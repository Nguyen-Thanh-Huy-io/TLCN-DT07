import { Injectable } from '@nestjs/common';
import {
  IQuestionEvaluator,
  QuestionEvaluationInput,
  QuestionEvaluationResult,
} from './question-evaluator.interface';

@Injectable()
export class MultipleSelectEvaluator implements IQuestionEvaluator {
  evaluate(input: QuestionEvaluationInput): QuestionEvaluationResult {
    const { questionId, userSelectedOptionIds, correctOptionIds, points } =
      input;

    if (!userSelectedOptionIds || userSelectedOptionIds.length === 0) {
      return {
        questionId,
        isCorrect: false,
        earnedPoints: 0,
        maxPoints: points,
      };
    }

    const selectedSet = new Set(userSelectedOptionIds);
    const correctSet = new Set(correctOptionIds);

    // Người dùng phải chọn đủ tất cả các đáp án đúng và không chọn bất kỳ đáp án sai nào
    const hasAllCorrect = correctOptionIds.every((id) => selectedSet.has(id));
    const hasNoWrong = userSelectedOptionIds.every((id) => correctSet.has(id));

    const isCorrect = hasAllCorrect && hasNoWrong;

    return {
      questionId,
      isCorrect,
      earnedPoints: isCorrect ? points : 0,
      maxPoints: points,
    };
  }
}
