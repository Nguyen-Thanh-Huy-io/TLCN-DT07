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

  private isIgnoredProbe(url: string): boolean {
    return (
      url === '/favicon.ico' ||
      url.startsWith('/json/version') ||
      url.startsWith('/json')
    );
  }

  private parseExceptionDetails(exception: unknown) {
    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let error = 'Error';

    if (
      typeof exception === 'object' &&
      exception !== null &&
      'status' in exception &&
      typeof exception.status === 'number'
    ) {
      statusCode = exception.status;
    }

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res && 'message' in res) {
        const resMessage = (res as Record<string, unknown>).message;
        message = Array.isArray(resMessage)
          ? resMessage.join(', ')
          : String(resMessage);
      }
      error = exception.name;
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
    }

    return { statusCode, message, error };
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

    const { statusCode, message, error } =
      this.parseExceptionDetails(exception);
    this.logException(request, statusCode, message, exception);

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
