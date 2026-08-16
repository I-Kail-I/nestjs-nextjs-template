import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      // Status for unique constraint violation
      // (if the user put a record that already exists)
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: 'The record already exists',
          error: 'Conflict',
        });
        break;
      }
      // Status for record not found
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: 'The record was not found',
          error: 'Not Found',
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
