import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UserRole, UserStatus } from '@prisma/client';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { AppModule } from '../src/app.module';
import { AuthUtilsService } from '../src/auth/services/auth-utils.service';
import { AllExceptionsFilter } from '../src/common/filters/all-exception.filter';
import { CustomThrottlerGuard } from '../src/common/guards/custom-throttler.guard';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { EmailQueueService } from '../src/common/queues/email/email.queue';
import { PrismaService } from '../src/common/services/prisma.service';

/** Mọi dữ liệu e2e tạo ra đều mang tiền tố này để dọn được, kể cả khi test dừng giữa chừng. */
export const E2E_MARK = 'e2e_test_';

export const emailQueueMock = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
};

/** App dựng giống `main.ts` (filter, interceptor, ValidationPipe); không gửi email thật, tắt giới hạn tần suất. */
export async function createE2eApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EmailQueueService)
    .useValue(emailQueueMock)
    .overrideGuard(CustomThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = moduleRef.createNestApplication();
  const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
  app.useGlobalFilters(new AllExceptionsFilter(winstonLogger));
  app.useGlobalInterceptors(new TransformInterceptor(winstonLogger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

export interface E2eUser {
  id: string;
  /** Giá trị header `Authorization` (token thật, đi qua AuthGuard thật). */
  auth: string;
}

let userCounter = 0;

/** Tạo tài khoản thật trong DB e2e và cấp access token cho nó. */
export async function createE2eUser(
  app: INestApplication,
  role: UserRole,
): Promise<E2eUser> {
  const prisma = app.get(PrismaService);
  const handle = `${E2E_MARK}${role.toLowerCase()}_${Date.now()}_${++userCounter}`;
  const user = await prisma.authUser.create({
    data: {
      email: `${handle}@example.com`,
      username: handle,
      password: '',
      role,
      verified: true,
      status: UserStatus.ACTIVE,
      provider: 'local',
    },
    select: { id: true, role: true, tokenVersion: true },
  });
  const token = app.get(AuthUtilsService).createAccessToken({
    userId: user.id,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  return { id: user.id, auth: `Bearer ${token}` };
}

/** Mảng phần tử của response danh sách — có phân trang (`data.items`) hoặc không (`data`). */
export function itemsOf<T = Record<string, unknown>>(body: {
  data?: unknown;
}): T[] {
  const data = body.data;
  if (Array.isArray(data)) return data as T[];
  const items = (data as { items?: unknown } | undefined)?.items;
  return Array.isArray(items) ? (items as T[]) : [];
}

/** Xoá các tài khoản e2e (dữ liệu nội dung tự xoá theo trong từng test). */
export async function removeE2eUsers(app: INestApplication): Promise<void> {
  await app
    .get(PrismaService)
    .authUser.deleteMany({ where: { username: { startsWith: E2E_MARK } } });
}
