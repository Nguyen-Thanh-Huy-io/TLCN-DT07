import {
  ArgumentsHost,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { LEARNER_ERROR_CODES } from '../../learner/learner.constant';
import { Prisma } from '@prisma/client';
import { Logger } from 'winston';
import { AllExceptionsFilter } from './all-exception.filter';

function runFilter(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url: '/lessons', method: 'POST' }),
    }),
  } as ArgumentsHost;
  const logger = { error: jest.fn(), warn: jest.fn() } as unknown as Logger;
  new AllExceptionsFilter(logger).catch(exception, host);
  return { statusCode: status.mock.calls[0][0], body: json.mock.calls[0][0] };
}

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(
    'Invalid `this.prisma.lesson.create()` invocation in D:\\src\\lesson.service.ts',
    { code, clientVersion: 'test' },
  );

describe('AllExceptionsFilter', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('lỗi khoá ngoại Prisma (P2003) → 400, không lộ chi tiết nội bộ', () => {
    const { statusCode, body } = runFilter(prismaError('P2003'));

    expect(statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(body.message).not.toContain('lesson.service.ts');
  });

  it('trùng unique (P2002) → 409, không tìm thấy (P2025) → 404', () => {
    expect(runFilter(prismaError('P2002')).statusCode).toBe(
      HttpStatus.CONFLICT,
    );
    expect(runFilter(prismaError('P2025')).statusCode).toBe(
      HttpStatus.NOT_FOUND,
    );
  });

  it('lỗi chưa xử lý ở production chỉ trả câu chung, không có stack', () => {
    process.env.NODE_ENV = 'production';

    const { statusCode, body } = runFilter(
      new TypeError('Cannot read properties of undefined (reading secretKey)'),
    );

    expect(statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body.message).toBe('Internal Server Error');
    expect(body.stack).toBeNull();
  });

  it('lỗi HTTP chuẩn giữ nguyên thông báo cho client', () => {
    const { statusCode, body } = runFilter(
      new NotFoundException('Bài học không tồn tại'),
    );

    expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(body.message).toBe('Bài học không tồn tại');
  });

  it('giữ mã lỗi nghiệp vụ (code) để frontend rẽ nhánh', () => {
    const { statusCode, body } = runFilter(
      new ForbiddenException({
        code: LEARNER_ERROR_CODES.NOT_ENROLLED,
        message: 'Cần đăng ký lộ trình',
      }),
    );

    expect(statusCode).toBe(HttpStatus.FORBIDDEN);
    expect(body).toMatchObject({
      code: LEARNER_ERROR_CODES.NOT_ENROLLED,
      message: 'Cần đăng ký lộ trình',
    });
  });

  it('lỗi không có mã thì không thêm trường code', () => {
    expect(runFilter(new NotFoundException('x')).body).not.toHaveProperty(
      'code',
    );
  });
});
