import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { NextFunction, Request, Response } from 'express';

import { randomUUID } from 'node:crypto';

export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const MAX_CORRELATION_ID_LENGTH = 128;

/**
 * Allows one to 128 ASCII letters, numbers, dots, underscores, or hyphens.
 * The restriction prevents an untrusted request header from becoming an
 * unbounded response header or log field.
 */
export const CORRELATION_ID_PATTERN = new RegExp(
  `^[a-zA-Z0-9._-]{1,${MAX_CORRELATION_ID_LENGTH}}$`,
);

export function assignCorrelationId(
  request: Request,
  response: Response,
): string {
  const correlationId =
    request.correlationId ??
    createCorrelationId(request.get(CORRELATION_ID_HEADER));

  request.correlationId = correlationId;
  response.setHeader(CORRELATION_ID_HEADER, correlationId);

  return correlationId;
}

export function correlationIdMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  assignCorrelationId(request, response);
  next();
}

function createCorrelationId(value: string | undefined): string {
  return isValidCorrelationId(value) ? value : randomUUID();
}

function isValidCorrelationId(value: string | undefined): value is string {
  return typeof value === 'string' && CORRELATION_ID_PATTERN.test(value);
}

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationIdInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();

    const request = httpContext.getRequest<Request>();

    const response = httpContext.getResponse<Response>();

    const correlationId = assignCorrelationId(request, response);

    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logRequest(
            request,
            correlationId,
            response.statusCode,
            startedAt,
          );
        },
        error: (exception: unknown) => {
          this.logRequest(
            request,
            correlationId,
            this.getExceptionStatusCode(exception),
            startedAt,
          );
        },
      }),
    );
  }

  private logRequest(
    request: Request,
    correlationId: string,
    statusCode: number,
    startedAt: bigint,
  ): void {
    const durationMs = this.getDurationMs(startedAt);

    this.logger.log({
      correlationId,
      method: request.method,
      path: request.originalUrl,
      statusCode,
      durationMs,
    });
  }

  private getExceptionStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getDurationMs(startedAt: bigint): number {
    const durationNanoseconds = process.hrtime.bigint() - startedAt;

    return Number(durationNanoseconds) / 1_000_000;
  }
}
