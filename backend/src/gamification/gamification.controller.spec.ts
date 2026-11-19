import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GoalPresetKey, GoalStatus } from '@prisma/client';
import request from 'supertest';
import { AuthGuard } from '../common/guards/auth.guard';
import { GamificationController } from './gamification.controller';
import { AchievementService } from './services/achievement.service';
import { GamificationFacadeService } from './services/gamification-facade.service';
import { GoalService } from './services/goal.service';

describe('GamificationController (HTTP Integration)', () => {
  let app: INestApplication;
  const facadeMock = {
    getOverview: jest.fn(),
    markArticleReadComplete: jest.fn(),
    isArticleReadCompleted: jest.fn(),
  };
  const goalMock = {
    listGoals: jest.fn(),
    createGoal: jest.fn(),
    updateGoalStatus: jest.fn(),
    deleteGoal: jest.fn(),
  };
  const achievementMock = {
    ensureDefaultSeeded: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GamificationController],
      providers: [
        { provide: GamificationFacadeService, useValue: facadeMock },
        { provide: GoalService, useValue: goalMock },
        { provide: AchievementService, useValue: achievementMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: 'user-test-1' };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('GET /gamification/overview seed huy hiệu và trả dữ liệu overview', async () => {
    facadeMock.getOverview.mockResolvedValue({
      streak: { currentDayStreak: 3, currentWeekStreak: 1, studiedToday: true },
      stats: { totalXp: 80 },
      primaryGoal: null,
      secondaryGoals: [],
      achievements: [],
    });

    const res = await request(app.getHttpServer())
      .get('/gamification/overview')
      .expect(200);

    expect(achievementMock.ensureDefaultSeeded).toHaveBeenCalledTimes(1);
    expect(facadeMock.getOverview).toHaveBeenCalledWith('user-test-1');
    expect(res.body.streak.currentDayStreak).toBe(3);
  });

  it('POST /gamification/goals tạo cam kết mục tiêu 3x hợp lệ', async () => {
    goalMock.createGoal.mockResolvedValue({
      id: 'g-1',
      presetKey: GoalPresetKey.PRESET_3X,
      targetValue: 3,
      currentValue: 1,
      status: GoalStatus.ACTIVE,
    });

    const res = await request(app.getHttpServer())
      .post('/gamification/goals')
      .send({ presetKey: GoalPresetKey.PRESET_3X })
      .expect(201);

    expect(goalMock.createGoal).toHaveBeenCalledWith(
      'user-test-1',
      expect.objectContaining({ presetKey: GoalPresetKey.PRESET_3X }),
    );
    expect(res.body.targetValue).toBe(3);
  });

  it('POST /gamification/goals từ chối payload presetKey sai enum (400)', async () => {
    await request(app.getHttpServer())
      .post('/gamification/goals')
      .send({ presetKey: 'INVALID_TIER', targetValue: 0 })
      .expect(400);
  });

  it('POST /gamification/articles/:articleId/read-complete yêu cầu UUID hợp lệ và gọi Facade', async () => {
    const validUuid = '11111111-1111-4111-8111-111111111111';
    facadeMock.markArticleReadComplete.mockResolvedValue({
      alreadyCompleted: false,
      xpEarned: 20,
      overview: { streak: { currentDayStreak: 1 } },
    });

    await request(app.getHttpServer())
      .post('/gamification/articles/not-a-uuid/read-complete')
      .expect(400);

    const res = await request(app.getHttpServer())
      .post(`/gamification/articles/${validUuid}/read-complete`)
      .expect(200);

    expect(facadeMock.markArticleReadComplete).toHaveBeenCalledWith(
      'user-test-1',
      validUuid,
    );
    expect(res.body.xpEarned).toBe(20);
  });
});
