import { SequentialProgressionStrategy } from './sequential-progression.strategy';
import { FreePacedProgressionStrategy } from './free-paced-progression.strategy';
import { ProgressionStrategyFactory } from './progression-strategy.factory';
import { LessonProgressionState } from './progression-strategy.interface';

describe('ProgressionStrategies & Factory', () => {
  let sequentialStrategy: SequentialProgressionStrategy;
  let freePacedStrategy: FreePacedProgressionStrategy;
  let factory: ProgressionStrategyFactory;

  beforeEach(() => {
    sequentialStrategy = new SequentialProgressionStrategy();
    freePacedStrategy = new FreePacedProgressionStrategy();
    factory = new ProgressionStrategyFactory(
      sequentialStrategy,
      freePacedStrategy,
    );
  });

  describe('SequentialProgressionStrategy', () => {
    const lessons = ['lesson-1', 'lesson-2', 'lesson-3', 'lesson-4'];

    it('bài đầu tiên luôn mở khi chưa học bài nào, các bài sau bị khóa', () => {
      const completedSet = new Set<string>();
      const result = sequentialStrategy.calculateProgression(
        lessons,
        completedSet,
      );

      expect(result.get('lesson-1')?.state).toBe(
        LessonProgressionState.CURRENT_UNLOCKED,
      );
      expect(result.get('lesson-2')?.state).toBe(
        LessonProgressionState.LOCKED_PREREQUISITE,
      );
      expect(result.get('lesson-2')?.prerequisiteLessonId).toBe('lesson-1');
      expect(result.get('lesson-3')?.state).toBe(
        LessonProgressionState.LOCKED_PREREQUISITE,
      );
      expect(result.get('lesson-4')?.state).toBe(
        LessonProgressionState.LOCKED_PREREQUISITE,
      );
    });

    it('hoàn thành bài 1 thì bài 1 là COMPLETED, bài 2 mở CURRENT_UNLOCKED, bài 3 4 bị khóa', () => {
      const completedSet = new Set<string>(['lesson-1']);
      const result = sequentialStrategy.calculateProgression(
        lessons,
        completedSet,
      );

      expect(result.get('lesson-1')?.state).toBe(
        LessonProgressionState.COMPLETED,
      );
      expect(result.get('lesson-2')?.state).toBe(
        LessonProgressionState.CURRENT_UNLOCKED,
      );
      expect(result.get('lesson-3')?.state).toBe(
        LessonProgressionState.LOCKED_PREREQUISITE,
      );
      expect(result.get('lesson-3')?.prerequisiteLessonId).toBe('lesson-2');
    });

    it('isAccessible cho phép bài đầu tiên hoặc bài đã học, chặn bài chưa mở', () => {
      const completedSet = new Set<string>(['lesson-1']);

      expect(
        sequentialStrategy.isAccessible('lesson-1', lessons, completedSet)
          .allowed,
      ).toBe(true);
      expect(
        sequentialStrategy.isAccessible('lesson-2', lessons, completedSet)
          .allowed,
      ).toBe(true);
      const check3 = sequentialStrategy.isAccessible(
        'lesson-3',
        lessons,
        completedSet,
      );
      expect(check3.allowed).toBe(false);
      expect(check3.prerequisiteLessonId).toBe('lesson-2');
    });
  });

  describe('FreePacedProgressionStrategy', () => {
    it('mọi bài chưa học đều là CURRENT_UNLOCKED, bài đã học là COMPLETED', () => {
      const lessons = ['lesson-1', 'lesson-2', 'lesson-3'];
      const completedSet = new Set<string>(['lesson-2']);
      const result = freePacedStrategy.calculateProgression(
        lessons,
        completedSet,
      );

      expect(result.get('lesson-1')?.state).toBe(
        LessonProgressionState.CURRENT_UNLOCKED,
      );
      expect(result.get('lesson-2')?.state).toBe(
        LessonProgressionState.COMPLETED,
      );
      expect(result.get('lesson-3')?.state).toBe(
        LessonProgressionState.CURRENT_UNLOCKED,
      );
      expect(freePacedStrategy.isAccessible().allowed).toBe(true);
    });
  });

  describe('ProgressionStrategyFactory', () => {
    it('trả về đúng Strategy dựa vào tham số isSequential', () => {
      expect(factory.getStrategy(true)).toBe(sequentialStrategy);
      expect(factory.getStrategy(false)).toBe(freePacedStrategy);
    });
  });
});
