import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Ignore favicon and browser/DevTools inspection probes
    if (
      request.url === '/favicon.ico' ||
      request.url.startsWith('/json/version') ||
      request.url.startsWith('/json')
    ) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: `Cannot ${request.method} ${request.url}`,
        error: 'Not Found',
      });
      return;
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let error = 'Error';

    // Check if exception has a status property
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof exception.status === 'number'
    ) {
      statusCode = exception.status;
    }

    // Handle NestJS HttpException
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') message = res;
      else if (typeof res === 'object' && res['message']) {
        const resMessage = res['message'] as string | string[];
        message = Array.isArray(resMessage)
          ? resMessage.join(', ')
          : String(resMessage);
      }
      error = exception.name;
    }
    // Generic JS Error
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    // Phân loại log: 4xx chỉ log warn/debug, 5xx mới log error
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
      this.logger.warn(`Handled client exception: ${statusCode} ${request.method} ${request.url}`, {
        context: 'AllExceptionsFilter',
        statusCode,
        path: request.url,
        method: request.method,
        message,
      });
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      stack:
        process.env.NODE_ENV === 'development' && exception instanceof Error
          ? exception.stack
          : null,
    });
  }
}
