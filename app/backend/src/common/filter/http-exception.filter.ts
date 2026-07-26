import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { isProduction } from '@/utils/check-env';

interface ExceptionResponse {
  message: string | string[];
  error?: string;
  statusCode?: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext('ExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string = 'Internal server error';
    const errors: Array<{ field: string; message: string }> = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as string | ExceptionResponse;

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else {
        const respMessage = exceptionResponse.message;

        if (Array.isArray(respMessage)) {
          for (const msg of respMessage) {
            errors.push({
              field: msg.split(' ')[0],
              message: msg,
            });
          }
          message = 'Validation failed';
        } else if (typeof respMessage === 'string') {
          message = respMessage;
        }
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      this.logger.error({ err: exception }, 'Unhandled exception');
    }

    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors.length > 0) {
      errorResponse.errors = errors;
    }

    if (!isProduction && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
