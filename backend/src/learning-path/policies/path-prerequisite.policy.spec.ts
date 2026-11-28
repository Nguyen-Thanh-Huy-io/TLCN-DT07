import { BadRequestException } from '@nestjs/common';
import { PathPrerequisitePolicy } from './path-prerequisite.policy';
import { PrismaService } from '../../common/services/prisma.service';

describe('PathPrerequisitePolicy', () => {
  let policy: PathPrerequisitePolicy;
  const prismaMock = {
    learningPath: {
      findUnique: jest.fn(),
    },
    lessonProgress: {
      findMany: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    policy = new PathPrerequisitePolicy(prismaMock as unknown as PrismaService);
  });

  describe('assertNoCircularDependency', () => {
    it('không có prerequisite thì bỏ qua hợp lệ', async () => {
      await expect(
        policy.assertNoCircularDependency('path-1', null),
      ).resolves.toBeUndefined();
    });

    it('tự trỏ vào chính mình thì throw BadRequestException', async () => {
      await expect(
        policy.assertNoCircularDependency('path-1', 'path-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('vòng lặp gián tiếp A -> B -> A thì throw BadRequestException', async () => {
      // path-2 có prerequisite là path-1
      prismaMock.learningPath.findUnique.mockResolvedValueOnce({
        prerequisitePathId: 'path-1',
      });

      await expect(
        policy.assertNoCircularDependency('path-1', 'path-2'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateEnrollmentEligibility', () => {
    it('lộ trình không yêu cầu prerequisite thì eligible = true', async () => {
      prismaMock.learningPath.findUnique.mockResolvedValue({
        id: 'path-1',
        title: 'Khóa cơ bản',
        prerequisitePathId: null,
      });

      const result = await policy.validateEnrollmentEligibility(
        'user-1',
        'path-1',
      );
      expect(result.isEligible).toBe(true);
    });

    it('chưa hoàn thành đủ bài của lộ trình tiên quyết thì eligible = false', async () => {
      prismaMock.learningPath.findUnique.mockResolvedValue({
        id: 'path-2',
        title: 'Khóa nâng cao',
        prerequisitePathId: 'path-1',
        prerequisitePath: {
          id: 'path-1',
          title: 'Khóa cơ bản',
          chapters: [
            {
              chapterLessons: [
                { lessonId: 'lesson-1' },
                { lessonId: 'lesson-2' },
              ],
            },
          ],
        },
      });

      // User mới học xong lesson-1
      prismaMock.lessonProgress.findMany.mockResolvedValue([
        { lessonId: 'lesson-1' },
      ]);

      const result = await policy.validateEnrollmentEligibility(
        'user-1',
        'path-2',
      );
      expect(result.isEligible).toBe(false);
      expect(result.completedLessons).toBe(1);
      expect(result.totalLessons).toBe(2);
      expect(result.reason).toContain('Khóa cơ bản');
    });

    it('đã hoàn thành đủ 100% bài của lộ trình tiên quyết thì eligible = true', async () => {
      prismaMock.learningPath.findUnique.mockResolvedValue({
        id: 'path-2',
        title: 'Khóa nâng cao',
        prerequisitePathId: 'path-1',
        prerequisitePath: {
          id: 'path-1',
          title: 'Khóa cơ bản',
          chapters: [
            {
              chapterLessons: [
                { lessonId: 'lesson-1' },
                { lessonId: 'lesson-2' },
              ],
            },
          ],
        },
      });

      // User đã học xong cả 2 bài
      prismaMock.lessonProgress.findMany.mockResolvedValue([
        { lessonId: 'lesson-1' },
        { lessonId: 'lesson-2' },
      ]);

      const result = await policy.validateEnrollmentEligibility(
        'user-1',
        'path-2',
      );
      expect(result.isEligible).toBe(true);
      expect(result.completedLessons).toBe(2);
      expect(result.totalLessons).toBe(2);
    });
  });
});
