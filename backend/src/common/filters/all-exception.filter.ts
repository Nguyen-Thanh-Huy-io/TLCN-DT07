import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

const INTERNAL_ERROR_MESSAGE = 'Internal Server Error';

/** Lỗi Prisma do dữ liệu đầu vào (không phải lỗi máy chủ) → mã HTTP và câu báo cho client. */
const PRISMA_CLIENT_ERRORS: Record<
  string,
  { statusCode: HttpStatus; message: string }
> = {
  P2002: {
    statusCode: HttpStatus.CONFLICT,
    message: 'Dữ liệu bị trùng với bản ghi đã có.',
  },
  P2003: {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Dữ liệu tham chiếu (ID liên kết) không tồn tại.',
  },
  P2025: {
    statusCode: HttpStatus.NOT_FOUND,
    message: 'Không tìm thấy bản ghi cần thao tác.',
  },
};

interface ExceptionDetails {
  statusCode: number;
  message: string;
  error: string;
  /** Mã lỗi nghiệp vụ (vd. NOT_ENROLLED) để frontend rẽ nhánh — không dựa vào câu chữ của message. */
  code?: string;
}

function httpExceptionDetails(exception: HttpException): ExceptionDetails {
  const statusCode = exception.getStatus();
  const error = exception.name;
  const res: unknown = exception.getResponse();
  if (typeof res === 'string') return { statusCode, message: res, error };
  if (typeof res !== 'object' || res === null) {
    return { statusCode, message: INTERNAL_ERROR_MESSAGE, error };
  }

  const body: Record<string, unknown> = { ...res };
  const rawMessage = body.message;
  const message = Array.isArray(rawMessage)
    ? rawMessage.join(', ')
    : 'message' in body
      ? String(rawMessage)
      : INTERNAL_ERROR_MESSAGE;
  const code = typeof body.code === 'string' ? body.code : undefined;
  return { statusCode, message, error, ...(code ? { code } : {}) };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  private isIgnoredProbe(url: string): boolean {
    return (
      url === '/favicon.ico' ||
      url.startsWith('/json/version') ||
      url.startsWith('/json')
    );
  }

  private parseExceptionDetails(exception: unknown): ExceptionDetails {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const known = PRISMA_CLIENT_ERRORS[exception.code];
      if (known) return { ...known, error: exception.code };
    }

    if (exception instanceof HttpException) {
      return httpExceptionDetails(exception);
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof exception.status === 'number'
    ) {
      statusCode = exception.status;
    }
    return exception instanceof Error
      ? { statusCode, message: exception.message, error: exception.name }
      : { statusCode, message: INTERNAL_ERROR_MESSAGE, error: 'Error' };
  }

  private logException(
    request: Request,
    statusCode: number,
    message: string,
    exception: unknown,
  ) {
    if (statusCode >= 500) {
      this.logger.error('Unhandled exception caught', {
        context: 'AllExceptionsFilter',
        statusCode,
        path: request.url,
        method: request.method,
        exception:
          exception instanceof Error ? exception.message : String(exception),
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    } else {
      this.logger.warn(
        `Handled client exception: ${statusCode} ${request.method} ${request.url}`,
        {
          context: 'AllExceptionsFilter',
          statusCode,
          path: request.url,
          method: request.method,
          message,
        },
      );
    }
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Ignore favicon and browser/DevTools inspection probes
    if (this.isIgnoredProbe(request.url)) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Cannot ${request.method} ${request.url}`,
        error: 'Not Found',
      });
      return;
    }

    const { statusCode, message, error, code } =
      this.parseExceptionDetails(exception);
    this.logException(request, statusCode, message, exception);

    const isDevelopment = process.env.NODE_ENV === 'development';
    const isUnhandledServerError =
      statusCode >= 500 && !(exception instanceof HttpException);

    response.status(statusCode).json({
      success: false,
      statusCode,
      // Lỗi chưa xử lý (Prisma, TypeError...) có thể chứa đường dẫn file, câu SQL — chỉ ghi log.
      message:
        isUnhandledServerError && !isDevelopment
          ? INTERNAL_ERROR_MESSAGE
          : message,
      error,
      ...(code ? { code } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      stack:
        isDevelopment && exception instanceof Error ? exception.stack : null,
    });
  }
}
