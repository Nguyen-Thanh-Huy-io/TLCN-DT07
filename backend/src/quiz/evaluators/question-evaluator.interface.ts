export interface QuestionEvaluationInput {
  questionId: string;
  userSelectedOptionIds: string[];
  correctOptionIds: string[];
  points: number;
}

export interface QuestionEvaluationResult {
  questionId: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
}

export interface IQuestionEvaluator {
  evaluate(input: QuestionEvaluationInput): QuestionEvaluationResult;
}
