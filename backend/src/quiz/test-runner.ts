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
import {
  QUIZ_ERROR_MESSAGES,
  QUIZ_CONSTANTS,
  QUIZ_SUCCESS_MESSAGES,
} from './constants/quiz.constant';

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
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ MỞ RỘNG (COMPREHENSIVE TEST SUITE)');
  console.log('====================================================\n');

  // ====================================================
  // SUITE 1: Question Evaluators & Factory (Edge Cases)
  // ====================================================
  console.log(
    '👉 [SUITE 1] Factory Pattern & Question Evaluators (Edge Cases):',
  );
  const mc = new MultipleChoiceEvaluator();
  const ms = new MultipleSelectEvaluator();
  const tf = new TrueFalseEvaluator();
  const factory = new QuestionEvaluatorFactory(mc, ms, tf);

  // 1.1 Multiple Choice Evaluator
  assert(
    mc.evaluate({
      questionId: 'q-mc-1',
      userSelectedOptionIds: ['opt-1'],
      correctOptionIds: ['opt-1'],
      points: 2,
    }).isCorrect === true,
    'MC-1: Chấm đúng khi chọn chính xác đáp án duy nhất',
  );

  assert(
    mc.evaluate({
      questionId: 'q-mc-1',
      userSelectedOptionIds: ['opt-2'],
      correctOptionIds: ['opt-1'],
      points: 2,
    }).isCorrect === false,
    'MC-2: Chấm sai khi chọn sai đáp án',
  );

  assert(
    mc.evaluate({
      questionId: 'q-mc-1',
      userSelectedOptionIds: ['opt-1', 'opt-2'],
      correctOptionIds: ['opt-1'],
      points: 2,
    }).isCorrect === false,
    'MC-3: Chấm sai khi chọn nhiều hơn 1 đáp án cho câu hỏi đơn',
  );

  assert(
    mc.evaluate({
      questionId: 'q-mc-1',
      userSelectedOptionIds: [],
      correctOptionIds: ['opt-1'],
      points: 2,
    }).isCorrect === false &&
      mc.evaluate({
        questionId: 'q-mc-1',
        userSelectedOptionIds: [],
        correctOptionIds: ['opt-1'],
        points: 2,
      }).earnedPoints === 0,
    'MC-4: Chấm sai và 0 điểm khi người học bỏ trống không chọn',
  );

  assert(
    mc.evaluate({
      questionId: 'q-mc-1',
      userSelectedOptionIds: ['unknown-opt-id'],
      correctOptionIds: ['opt-1'],
      points: 5,
    }).earnedPoints === 0,
    'MC-5: Chấm 0 điểm khi chọn ID đáp án không tồn tại',
  );

  // 1.2 Multiple Select Evaluator
  assert(
    ms.evaluate({
      questionId: 'q-ms-1',
      userSelectedOptionIds: ['opt-1', 'opt-2', 'opt-3'],
      correctOptionIds: ['opt-1', 'opt-2', 'opt-3'],
      points: 10,
    }).isCorrect === true,
    'MS-1: Chấm đúng khi chọn đủ tất cả 3 đáp án đúng',
  );

  assert(
    ms.evaluate({
      questionId: 'q-ms-1',
      userSelectedOptionIds: ['opt-1', 'opt-2'],
      correctOptionIds: ['opt-1', 'opt-2', 'opt-3'],
      points: 10,
    }).isCorrect === false,
    'MS-2: Chấm sai khi chọn thiếu 1 trong các đáp án đúng',
  );

  assert(
    ms.evaluate({
      questionId: 'q-ms-1',
      userSelectedOptionIds: ['opt-1', 'opt-2', 'opt-3', 'opt-wrong'],
      correctOptionIds: ['opt-1', 'opt-2', 'opt-3'],
      points: 10,
    }).isCorrect === false,
    'MS-3: Chấm sai khi chọn đủ đáp án đúng nhưng chọn kèm thêm đáp án sai',
  );

  assert(
    ms.evaluate({
      questionId: 'q-ms-1',
      userSelectedOptionIds: [],
      correctOptionIds: ['opt-1', 'opt-2'],
      points: 10,
    }).isCorrect === false &&
      ms.evaluate({
        questionId: 'q-ms-1',
        userSelectedOptionIds: [],
        correctOptionIds: ['opt-1', 'opt-2'],
        points: 10,
      }).earnedPoints === 0,
    'MS-4: Chấm sai khi bỏ trống câu hỏi trắc nghiệm nhiều đáp án',
  );

  assert(
    ms.evaluate({
      questionId: 'q-ms-1',
      userSelectedOptionIds: ['opt-2', 'opt-1'],
      correctOptionIds: ['opt-1', 'opt-2'],
      points: 4,
    }).isCorrect === true,
    'MS-5: Chấm đúng bất kể thứ tự chọn đáp án (đảo thứ tự)',
  );

  // 1.3 True/False Evaluator
  assert(
    tf.evaluate({
      questionId: 'q-tf-1',
      userSelectedOptionIds: ['opt-true'],
      correctOptionIds: ['opt-true'],
      points: 1,
    }).isCorrect === true,
    'TF-1: Chấm đúng khi chọn đúng đáp án TRUE',
  );

  assert(
    tf.evaluate({
      questionId: 'q-tf-1',
      userSelectedOptionIds: ['opt-false'],
      correctOptionIds: ['opt-true'],
      points: 1,
    }).isCorrect === false,
    'TF-2: Chấm sai khi chọn đáp án FALSE thay vì TRUE',
  );

  assert(
    tf.evaluate({
      questionId: 'q-tf-1',
      userSelectedOptionIds: ['opt-true', 'opt-false'],
      correctOptionIds: ['opt-true'],
      points: 1,
    }).isCorrect === false,
    'TF-3: Chấm sai khi chọn đồng thời cả Đúng và Sai',
  );

  // 1.4 Factory Pattern
  assert(
    factory.getEvaluator(QuestionType.MULTIPLE_CHOICE) instanceof
      MultipleChoiceEvaluator,
    'FAC-1: Trả về MultipleChoiceEvaluator cho MULTIPLE_CHOICE',
  );
  assert(
    factory.getEvaluator(QuestionType.MULTIPLE_SELECT) instanceof
      MultipleSelectEvaluator,
    'FAC-2: Trả về MultipleSelectEvaluator cho MULTIPLE_SELECT',
  );
  assert(
    factory.getEvaluator(QuestionType.TRUE_FALSE) instanceof TrueFalseEvaluator,
    'FAC-3: Trả về TrueFalseEvaluator cho TRUE_FALSE',
  );

  // ====================================================
  // SUITE 2: Scoring Strategies (Boundary & Edge Cases)
  // ====================================================
  console.log('\n👉 [SUITE 2] Scoring Strategies & Boundary Tests:');
  const standardStrategy = new StandardScoringStrategy();
  const weightedStrategy = new WeightedScoringStrategy();
  const context = new ScoringStrategyContext(
    standardStrategy,
    weightedStrategy,
  );

  // 2.1 Mảng câu hỏi rỗng
  const emptyRes = standardStrategy.calculateScore({
    results: [],
    passingScorePercentage: 70,
    xpReward: 50,
  });
  assert(
    emptyRes.scorePercentage === 0 &&
      emptyRes.totalPoints === 0 &&
      emptyRes.passed === false,
    'SCORE-1: Xử lý an toàn khi danh sách câu hỏi rỗng (0 điểm, không crash)',
  );

  // 2.2 Đúng 100% tất cả câu hỏi
  const perfectResults = [
    { questionId: 'q1', isCorrect: true, earnedPoints: 5, maxPoints: 5 },
    { questionId: 'q2', isCorrect: true, earnedPoints: 5, maxPoints: 5 },
    { questionId: 'q3', isCorrect: true, earnedPoints: 5, maxPoints: 5 },
    { questionId: 'q4', isCorrect: true, earnedPoints: 5, maxPoints: 5 },
  ];
  const perfectRes = standardStrategy.calculateScore({
    results: perfectResults,
    passingScorePercentage: 80,
    xpReward: 100,
  });
  assert(
    perfectRes.scorePercentage === 100 &&
      perfectRes.correctAnswersCount === 4 &&
      perfectRes.passed === true &&
      perfectRes.earnedXp === 100,
    'SCORE-2: Chấm điểm 100% khi trả lời đúng toàn bộ câu hỏi',
  );

  // 2.3 Sai 100% tất cả câu hỏi
  const zeroResults = [
    { questionId: 'q1', isCorrect: false, earnedPoints: 0, maxPoints: 5 },
    { questionId: 'q2', isCorrect: false, earnedPoints: 0, maxPoints: 5 },
  ];
  const zeroRes = standardStrategy.calculateScore({
    results: zeroResults,
    passingScorePercentage: 50,
    xpReward: 100,
  });
  assert(
    zeroRes.scorePercentage === 0 &&
      zeroRes.correctAnswersCount === 0 &&
      zeroRes.passed === false &&
      zeroRes.earnedXp === 0,
    'SCORE-3: Chấm điểm 0% và 0 XP khi làm sai toàn bộ',
  );

  // 2.4 Điểm vừa đúng ngưỡng chuẩn (Boundary Condition: Score == PassingScore)
  const exactPassResults = [
    { questionId: 'q1', isCorrect: true, earnedPoints: 1, maxPoints: 1 },
    { questionId: 'q2', isCorrect: true, earnedPoints: 1, maxPoints: 1 },
    { questionId: 'q3', isCorrect: true, earnedPoints: 1, maxPoints: 1 },
    { questionId: 'q4', isCorrect: false, earnedPoints: 0, maxPoints: 1 },
  ]; // 3/4 = 75%
  const exactPassRes = standardStrategy.calculateScore({
    results: exactPassResults,
    passingScorePercentage: 75,
    xpReward: 50,
  });
  assert(
    exactPassRes.scorePercentage === 75 && exactPassRes.passed === true,
    'SCORE-4: Điểm chạm đúng ngưỡng đậu (75% == 75% -> Passed)',
  );

  // 2.5 Điểm dưới ngưỡng chuẩn 1% (Boundary Condition: Score < PassingScore)
  const justFailRes = standardStrategy.calculateScore({
    results: exactPassResults,
    passingScorePercentage: 76,
    xpReward: 50,
  });
  assert(
    justFailRes.scorePercentage === 75 && justFailRes.passed === false,
    'SCORE-5: Điểm dưới ngưỡng đậu (75% < 76% -> Failed)',
  );

  // 2.6 Weighted Scoring với các trọng số điểm khác nhau
  const mixedWeightedResults = [
    { questionId: 'q1', isCorrect: true, earnedPoints: 10, maxPoints: 10 }, // 10 điểm
    { questionId: 'q2', isCorrect: false, earnedPoints: 0, maxPoints: 20 }, // 20 điểm
    { questionId: 'q3', isCorrect: true, earnedPoints: 70, maxPoints: 70 }, // 70 điểm
  ]; // Tổng điểm tối đa: 100, Đạt được: 80 -> 80%
  const weightedMixedRes = weightedStrategy.calculateScore({
    results: mixedWeightedResults,
    passingScorePercentage: 70,
    xpReward: 200,
  });
  assert(
    weightedMixedRes.earnedPoints === 80 &&
      weightedMixedRes.totalPoints === 100 &&
      weightedMixedRes.scorePercentage === 80 &&
      weightedMixedRes.passed === true &&
      weightedMixedRes.earnedXp === 200,
    'SCORE-6: Weighted Scoring tính đúng trọng số câu hỏi lớn (80/100 -> Passed)',
  );

  // 2.7 Strategy Context Switch
  context.setStrategy(ScoringMode.STANDARD);
  const ctxStdRes = context.executeStrategy({
    results: mixedWeightedResults,
    passingScorePercentage: 60,
    xpReward: 50,
  });
  // 2/3 câu đúng = 67%
  assert(
    ctxStdRes.scorePercentage === 67,
    'CTX-1: Context chuyển sang STANDARD strategy chính xác (67%)',
  );

  context.setStrategy(ScoringMode.WEIGHTED);
  const ctxWeightedRes = context.executeStrategy({
    results: mixedWeightedResults,
    passingScorePercentage: 60,
    xpReward: 50,
  });
  // 80/100 điểm = 80%
  assert(
    ctxWeightedRes.scorePercentage === 80,
    'CTX-2: Context chuyển sang WEIGHTED strategy chính xác (80%)',
  );

  // ====================================================
  // SUITE 3: Constants & Enums & Statuses
  // ====================================================
  console.log('\n👉 [SUITE 3] Constants, Enums & Status Validation:');
  assert(
    QUIZ_CONSTANTS.DEFAULT_PASSING_SCORE === 70,
    'CONST-1: Default passing score là 70%',
  );
  assert(
    QUIZ_CONSTANTS.DEFAULT_XP_REWARD === 50,
    'CONST-2: Default XP reward là 50 XP',
  );
  assert(
    QUIZ_CONSTANTS.MAX_QUESTIONS_PER_QUIZ === 100,
    'CONST-3: Max câu hỏi mỗi quiz là 100',
  );
  assert(
    QUIZ_CONSTANTS.MIN_OPTIONS_PER_QUESTION === 2,
    'CONST-4: Min số đáp án mỗi câu hỏi là 2',
  );
  assert(
    typeof QUIZ_ERROR_MESSAGES.QUIZ_NOT_FOUND === 'string',
    'CONST-5: Thông điệp QUIZ_NOT_FOUND hợp lệ',
  );
  assert(
    typeof QUIZ_ERROR_MESSAGES.ATTEMPT_ALREADY_COMPLETED === 'string',
    'CONST-6: Thông điệp ATTEMPT_ALREADY_COMPLETED hợp lệ',
  );
  assert(
    typeof QUIZ_ERROR_MESSAGES.MAX_ATTEMPTS_REACHED === 'string',
    'CONST-7: Thông điệp MAX_ATTEMPTS_REACHED hợp lệ',
  );
  assert(
    typeof QUIZ_SUCCESS_MESSAGES.ATTEMPT_SUBMITTED === 'string',
    'CONST-8: Thông điệp ATTEMPT_SUBMITTED hợp lệ',
  );

  console.log('\n====================================================');
  console.log(
    `📊 TỔNG KẾT: ${passedTests} TEST CASES PASSED / ${failedTests} FAILED`,
  );
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
