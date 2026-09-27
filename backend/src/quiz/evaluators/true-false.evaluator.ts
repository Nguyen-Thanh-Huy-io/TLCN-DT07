import { Injectable } from '@nestjs/common';
import {
  IQuestionEvaluator,
  QuestionEvaluationInput,
  QuestionEvaluationResult,
} from './question-evaluator.interface';

@Injectable()
export class TrueFalseEvaluator implements IQuestionEvaluator {
  evaluate(input: QuestionEvaluationInput): QuestionEvaluationResult {
    const { questionId, userSelectedOptionIds, correctOptionIds, points } =
      input;

    const isCorrect =
      userSelectedOptionIds.length === 1 &&
      correctOptionIds.length === 1 &&
      correctOptionIds[0] === userSelectedOptionIds[0];

    return {
      questionId,
      isCorrect,
      earnedPoints: isCorrect ? points : 0,
      maxPoints: points,
    };
  }
}
