import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ') || 'field';
        response.status(status).json({
          statusCode: status,
          message: `A record with this ${target} already exists.`,
          error: 'Conflict',
        });
        break;
      }
      default:
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Internal server error',
        });
        break;
    }
  }
}
