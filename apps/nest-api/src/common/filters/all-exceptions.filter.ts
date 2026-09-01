import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '../../generated/prisma/client';
import { ErrorResponse } from '../interfaces/error-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, error, message } = this.resolve(exception);

    const body: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
    };

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${statusCode}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} -> ${statusCode}: ${JSON.stringify(message)}`,
      );
    }

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    error: string;
    message: string | string[];
  } {
    // Standard Nest HTTP exceptions (includes ValidationPipe failures)
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();

      if (typeof payload === 'string') {
        return { statusCode: status, error: exception.name, message: payload };
      }

      const payloadObj = payload as {
        message?: string | string[];
        error?: string;
      };
      return {
        statusCode: status,
        error: payloadObj.error ?? exception.name,
        message: payloadObj.message ?? exception.message,
      };
    }

    // Prisma errors we can give a meaningful HTTP status to
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return {
            statusCode: HttpStatus.CONFLICT,
            error: 'Conflict',
            message: `A record with this ${(exception.meta?.target as string[])?.join(', ') ?? 'value'} already exists.`,
          };
        case 'P2025':
          return {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Not Found',
            message: 'The requested record was not found.',
          };
        default:
          return {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Database Error',
            message:
              'The request could not be processed due to a database constraint.',
          };
      }
    }

    // Anything unhandled — never leak internals to the client
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred.',
    };
  }
}
