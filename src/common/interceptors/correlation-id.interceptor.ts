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
import type { Request, Response } from 'express';

import { randomUUID } from 'node:crypto';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CorrelationIdInterceptor.name);

  private readonly correlationIdPattern = /^[a-zA-Z0-9._-]{1,100}$/;

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const httpContext = context.switchToHttp();

    const request = httpContext.getRequest<Request>();

    const response = httpContext.getResponse<Response>();

    const providedCorrelationId = request.get('x-correlation-id');

    const correlationId = this.isValidCorrelationId(providedCorrelationId)
      ? providedCorrelationId
      : randomUUID();

    request.correlationId = correlationId;

    response.setHeader('x-correlation-id', correlationId);

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

  private isValidCorrelationId(value: string | undefined): value is string {
    return typeof value === 'string' && this.correlationIdPattern.test(value);
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
