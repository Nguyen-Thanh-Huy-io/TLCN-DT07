import {
  BadRequestException,
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { AchievementMetricType, UserRole } from '@prisma/client';
import request from 'supertest';
import { RolesGuard } from '../common/access/roles.guard';
import { AuthGuard } from '../common/guards/auth.guard';
import { GamificationAdminController } from './gamification-admin.controller';
import { GamificationAdminService } from './services/gamification-admin.service';

describe('GamificationAdminController (HTTP + RolesGuard)', () => {
  let app: INestApplication;
  let currentRole: UserRole = UserRole.ADMIN;

  const adminServiceMock = {
    getAdminOverview: jest.fn(),
    listLearners: jest.fn(),
    createAchievement: jest.fn(),
    updateAchievement: jest.fn(),
    deleteAchievement: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [GamificationAdminController],
      providers: [
        Reflector,
        RolesGuard,
        { provide: GamificationAdminService, useValue: adminServiceMock },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (ctx: ExecutionContext) => {
          const req = ctx.switchToHttp().getRequest();
          req.user = { userId: 'admin-1', role: currentRole };
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
    currentRole = UserRole.ADMIN;
  });

  it('chặn MODERATOR và USER (403 Forbidden), cho ADMIN/SUPERADMIN truy cập overview', async () => {
    currentRole = UserRole.MODERATOR;
    await request(app.getHttpServer())
      .get('/gamification/admin/overview')
      .expect(403);

    currentRole = UserRole.USER;
    await request(app.getHttpServer())
      .get('/gamification/admin/overview')
      .expect(403);

    currentRole = UserRole.ADMIN;
    adminServiceMock.getAdminOverview.mockResolvedValue({
      summary: { activeStreakTodayCount: 3 },
      achievements: [],
    });
    const res = await request(app.getHttpServer())
      .get('/gamification/admin/overview')
      .expect(200);
    expect(res.body.summary.activeStreakTodayCount).toBe(3);
  });

  it('tạo mới huy hiệu và kiểm tra validation mã code không hợp lệ (400)', async () => {
    await request(app.getHttpServer())
      .post('/gamification/admin/achievements')
      .send({
        code: 'bad code!',
        title: 'Test',
        description: 'Mô tả hợp lệ',
        iconKey: 'Award',
        metricType: AchievementMetricType.TOTAL_ACTIVITIES,
        threshold: 5,
      })
      .expect(400);

    adminServiceMock.createAchievement.mockResolvedValue({
      id: 'ach-99',
      code: 'GOOD_CODE',
    });
    const res = await request(app.getHttpServer())
      .post('/gamification/admin/achievements')
      .send({
        code: 'GOOD_CODE',
        title: 'Nhà Sử Học Trẻ',
        description: 'Hoàn thành 10 hoạt động học sử',
        iconKey: 'Award',
        metricType: AchievementMetricType.TOTAL_ACTIVITIES,
        threshold: 10,
      })
      .expect(201);
    expect(res.body.code).toBe('GOOD_CODE');
  });

  it('tạo huy hiệu không cần gửi code hay sortOrder (tự sinh phía backend)', async () => {
    adminServiceMock.createAchievement.mockResolvedValue({
      id: 'ach-auto',
      code: 'CHIEN_THAN_SU_HOC',
    });

    const res = await request(app.getHttpServer())
      .post('/gamification/admin/achievements')
      .send({
        title: 'Chiến thần Sử học',
        description: 'Hoàn thành 15 hoạt động học sử',
        imageUrl: '/uploads/badge-hero.png',
        metricType: AchievementMetricType.TOTAL_ACTIVITIES,
        threshold: 15,
      })
      .expect(201);

    expect(res.body.code).toBe('CHIEN_THAN_SU_HOC');
  });

  it('trả 400 nếu xoá huy hiệu đã có người đạt', async () => {
    const id = '11111111-1111-4111-8111-111111111111';
    adminServiceMock.deleteAchievement.mockRejectedValue(
      new BadRequestException('Đã có người đạt'),
    );
    await request(app.getHttpServer())
      .delete(`/gamification/admin/achievements/${id}`)
      .expect(400);
  });
});
