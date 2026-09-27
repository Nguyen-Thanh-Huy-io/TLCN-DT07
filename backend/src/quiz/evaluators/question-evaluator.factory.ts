import { Injectable, BadRequestException } from '@nestjs/common';
import { QuestionType } from '@prisma/client';
import { IQuestionEvaluator } from './question-evaluator.interface';
import { MultipleChoiceEvaluator } from './multiple-choice.evaluator';
import { MultipleSelectEvaluator } from './multiple-select.evaluator';
import { TrueFalseEvaluator } from './true-false.evaluator';
import { QUIZ_ERROR_MESSAGES } from '../constants/quiz.constant';

@Injectable()
export class QuestionEvaluatorFactory {
  constructor(
    private readonly multipleChoiceEvaluator: MultipleChoiceEvaluator,
    private readonly multipleSelectEvaluator: MultipleSelectEvaluator,
    private readonly trueFalseEvaluator: TrueFalseEvaluator,
  ) {}

  getEvaluator(type: QuestionType): IQuestionEvaluator {
    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        return this.multipleChoiceEvaluator;
      case QuestionType.MULTIPLE_SELECT:
        return this.multipleSelectEvaluator;
      case QuestionType.TRUE_FALSE:
        return this.trueFalseEvaluator;
      default:
        throw new BadRequestException(
          `${QUIZ_ERROR_MESSAGES.INVALID_QUESTION_TYPE}: ${String(type)}`,
        );
    }
  }
}
