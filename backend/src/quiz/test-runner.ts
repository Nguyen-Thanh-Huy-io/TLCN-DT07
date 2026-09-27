import { QuestionType } from '@prisma/client';
import { MultipleChoiceEvaluator } from './evaluators/multiple-choice.evaluator';
import { MultipleSelectEvaluator } from './evaluators/multiple-select.evaluator';
import { TrueFalseEvaluator } from './evaluators/true-false.evaluator';
import { QuestionEvaluatorFactory } from './evaluators/question-evaluator.factory';
import { StandardScoringStrategy } from './strategies/scoring/standard-scoring.strategy';
import { WeightedScoringStrategy } from './strategies/scoring/weighted-scoring.strategy';
import {
  ScoringStrategyContext,
  ScoringMode,
} from './strategies/scoring/scoring-strategy.context';
import { QUIZ_ERROR_MESSAGES, QUIZ_CONSTANTS } from './constants/quiz.constant';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failedTests++;
  }
}

function runAllQuizTests() {
  console.log('====================================================');
  console.log('🧪 BẮT ĐẦU CHẠY TOÀN BỘ BỘ TEST CHO MODULE QUIZ');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // SUITE 1: Question Evaluators & Factory (Factory Pattern)
  // ----------------------------------------------------
  console.log('👉 [SUITE 1] Factory Pattern & Question Evaluators:');
  const mc = new MultipleChoiceEvaluator();
  const ms = new MultipleSelectEvaluator();
  const tf = new TrueFalseEvaluator();
  const factory = new QuestionEvaluatorFactory(mc, ms, tf);

  // Multiple Choice Tests
  const mcCorrect = mc.evaluate({
    questionId: 'q-mc-1',
    userSelectedOptionIds: ['opt-1'],
    correctOptionIds: ['opt-1'],
    points: 2,
  });
  assert(
    mcCorrect.isCorrect === true && mcCorrect.earnedPoints === 2,
    'MultipleChoice: Chấm đúng khi chọn đúng 1 đáp án',
  );

  const mcWrong = mc.evaluate({
    questionId: 'q-mc-1',
    userSelectedOptionIds: ['opt-2'],
    correctOptionIds: ['opt-1'],
    points: 2,
  });
  assert(
    mcWrong.isCorrect === false && mcWrong.earnedPoints === 0,
    'MultipleChoice: Chấm sai khi chọn sai đáp án',
  );

  const mcMultiSelected = mc.evaluate({
    questionId: 'q-mc-1',
    userSelectedOptionIds: ['opt-1', 'opt-2'],
    correctOptionIds: ['opt-1'],
    points: 2,
  });
  assert(
    mcMultiSelected.isCorrect === false && mcMultiSelected.earnedPoints === 0,
    'MultipleChoice: Chấm sai khi chọn nhiều hơn 1 đáp án',
  );

  // Multiple Select Tests
  const msAllCorrect = ms.evaluate({
    questionId: 'q-ms-1',
    userSelectedOptionIds: ['opt-1', 'opt-2'],
    correctOptionIds: ['opt-1', 'opt-2'],
    points: 5,
  });
  assert(
    msAllCorrect.isCorrect === true && msAllCorrect.earnedPoints === 5,
    'MultipleSelect: Chấm đúng khi chọn đủ tất cả đáp án đúng',
  );

  const msMissing = ms.evaluate({
    questionId: 'q-ms-1',
    userSelectedOptionIds: ['opt-1'],
    correctOptionIds: ['opt-1', 'opt-2'],
    points: 5,
  });
  assert(
    msMissing.isCorrect === false && msMissing.earnedPoints === 0,
    'MultipleSelect: Chấm sai khi chọn thiếu đáp án đúng',
  );

  const msExtraWrong = ms.evaluate({
    questionId: 'q-ms-1',
    userSelectedOptionIds: ['opt-1', 'opt-2', 'opt-3'],
    correctOptionIds: ['opt-1', 'opt-2'],
    points: 5,
  });
  assert(
    msExtraWrong.isCorrect === false && msExtraWrong.earnedPoints === 0,
    'MultipleSelect: Chấm sai khi chọn dư đáp án sai',
  );

  // True/False Tests
  const tfCorrect = tf.evaluate({
    questionId: 'q-tf-1',
    userSelectedOptionIds: ['opt-true'],
    correctOptionIds: ['opt-true'],
    points: 1,
  });
  assert(
    tfCorrect.isCorrect === true && tfCorrect.earnedPoints === 1,
    'TrueFalse: Chấm đúng khi chọn đúng đáp án boolean',
  );

  // Factory Tests
  assert(
    factory.getEvaluator(QuestionType.MULTIPLE_CHOICE) instanceof
      MultipleChoiceEvaluator,
    'Factory: Trả về MultipleChoiceEvaluator cho MULTIPLE_CHOICE',
  );
  assert(
    factory.getEvaluator(QuestionType.MULTIPLE_SELECT) instanceof
      MultipleSelectEvaluator,
    'Factory: Trả về MultipleSelectEvaluator cho MULTIPLE_SELECT',
  );
  assert(
    factory.getEvaluator(QuestionType.TRUE_FALSE) instanceof TrueFalseEvaluator,
    'Factory: Trả về TrueFalseEvaluator cho TRUE_FALSE',
  );

  // ----------------------------------------------------
  // SUITE 2: Scoring Strategies (Strategy Pattern)
  // ----------------------------------------------------
  console.log('\n👉 [SUITE 2] Strategy Pattern & Scoring Strategies:');
  const standardStrategy = new StandardScoringStrategy();
  const weightedStrategy = new WeightedScoringStrategy();
  const context = new ScoringStrategyContext(
    standardStrategy,
    weightedStrategy,
  );

  const mockEvalResults = [
    { questionId: 'q1', isCorrect: true, earnedPoints: 10, maxPoints: 10 },
    { questionId: 'q2', isCorrect: true, earnedPoints: 20, maxPoints: 20 },
    { questionId: 'q3', isCorrect: false, earnedPoints: 0, maxPoints: 70 },
  ];

  // Standard Strategy (tỉ lệ câu đúng: 2/3 = 67%)
  const stdRes = standardStrategy.calculateScore({
    results: mockEvalResults,
    passingScorePercentage: 60,
    xpReward: 100,
  });
  assert(
    stdRes.scorePercentage === 67,
    'StandardScoring: Tính điểm theo % số câu đúng (2/3 = 67%)',
  );
  assert(
    stdRes.passed === true,
    'StandardScoring: Đánh giá Passed khi 67% >= 60%',
  );
  assert(stdRes.earnedXp === 100, 'StandardScoring: Nhận đủ XP khi Passed');

  // Weighted Strategy (trọng số điểm: (10+20)/100 = 30%)
  const weightedRes = weightedStrategy.calculateScore({
    results: mockEvalResults,
    passingScorePercentage: 50,
    xpReward: 100,
  });
  assert(
    weightedRes.scorePercentage === 30,
    'WeightedScoring: Tính điểm theo trọng số điểm (30/100 = 30%)',
  );
  assert(
    weightedRes.passed === false,
    'WeightedScoring: Đánh giá Failed khi 30% < 50%',
  );
  assert(weightedRes.earnedXp === 0, 'WeightedScoring: 0 XP khi Failed');

  // Context Switch Test
  context.setStrategy(ScoringMode.STANDARD);
  const ctxStd = context.executeStrategy({
    results: mockEvalResults,
    passingScorePercentage: 60,
    xpReward: 50,
  });
  assert(
    ctxStd.scorePercentage === 67,
    'ScoringStrategyContext: Thực thi Standard Strategy chính xác',
  );

  context.setStrategy(ScoringMode.WEIGHTED);
  const ctxWeighted = context.executeStrategy({
    results: mockEvalResults,
    passingScorePercentage: 60,
    xpReward: 50,
  });
  assert(
    ctxWeighted.scorePercentage === 30,
    'ScoringStrategyContext: Thực thi Weighted Strategy chính xác',
  );

  // ----------------------------------------------------
  // SUITE 3: Constants & Data Integrity
  // ----------------------------------------------------
  console.log('\n👉 [SUITE 3] Constants & Validation Rules:');
  assert(
    QUIZ_CONSTANTS.DEFAULT_PASSING_SCORE === 70,
    'Constant: Default passing score là 70%',
  );
  assert(
    QUIZ_CONSTANTS.DEFAULT_XP_REWARD === 50,
    'Constant: Default XP reward là 50 XP',
  );
  assert(
    typeof QUIZ_ERROR_MESSAGES.NO_CORRECT_OPTION === 'string',
    'Constant: Có thông điệp NO_CORRECT_OPTION rõ ràng',
  );
  assert(
    typeof QUIZ_ERROR_MESSAGES.MAX_ATTEMPTS_REACHED === 'string',
    'Constant: Có thông điệp MAX_ATTEMPTS_REACHED',
  );

  console.log('\n====================================================');
  console.log(`📊 TỔNG KẾT: ${passedTests} PASSED / ${failedTests} FAILED`);
  console.log('====================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

try {
  runAllQuizTests();
} catch (err) {
  console.error(err);
  process.exit(1);
}
