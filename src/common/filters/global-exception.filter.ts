import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { assignCorrelationId } from '../interceptors/correlation-id.interceptor';

interface ErrorResponse {
  statusCode: number;
  code: string;
  message: string;
  details: string[];
  timestamp: string;
  path: string;
  method: string;
  correlationId: string;
}

interface HttpExceptionResponse {
  message?: unknown;
}

interface HttpErrorDescriptor {
  code: string;
  message: string;
}

const HTTP_ERROR_DESCRIPTORS: Readonly<
  Partial<Record<number, HttpErrorDescriptor>>
> = {
  [HttpStatus.BAD_REQUEST]: {
    code: 'BAD_REQUEST',
    message: 'Bad request',
  },
  [HttpStatus.UNAUTHORIZED]: {
    code: 'UNAUTHORIZED',
    message: 'Unauthorized',
  },
  [HttpStatus.FORBIDDEN]: {
    code: 'FORBIDDEN',
    message: 'Forbidden',
  },
  [HttpStatus.NOT_FOUND]: {
    code: 'NOT_FOUND',
    message: 'Resource not found',
  },
  [HttpStatus.METHOD_NOT_ALLOWED]: {
    code: 'METHOD_NOT_ALLOWED',
    message: 'Method not allowed',
  },
  [HttpStatus.CONFLICT]: {
    code: 'CONFLICT',
    message: 'Conflict',
  },
  [HttpStatus.UNPROCESSABLE_ENTITY]: {
    code: 'UNPROCESSABLE_ENTITY',
    message: 'Unprocessable entity',
  },
  [HttpStatus.TOO_MANY_REQUESTS]: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Too many requests',
  },
  [HttpStatus.SERVICE_UNAVAILABLE]: {
    code: 'SERVICE_UNAVAILABLE',
    message: 'Service unavailable',
  },
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const statusCode = this.getStatusCode(exception);

    const correlationId = assignCorrelationId(request, response);

    const responseBody: ErrorResponse = {
      statusCode,
      ...this.getErrorContract(exception, statusCode),
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      correlationId,
    };

    this.logException({
      exception,
      request,
      statusCode,
      correlationId,
    });

    response.status(statusCode).json(responseBody);
  }

  private getStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorContract(
    exception: unknown,
    statusCode: number,
  ): Pick<ErrorResponse, 'code' | 'message' | 'details'> {
    if (!(exception instanceof HttpException)) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: [],
      };
    }

    const response = exception.getResponse();
    const details = this.getValidationDetails(response);

    if (details.length > 0) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'La solicitud contiene datos inválidos',
        details,
      };
    }

    return {
      code: this.getErrorCode(statusCode),
      message: this.getSafeHttpMessage(response, statusCode),
      details: [],
    };
  }

  private getValidationDetails(response: unknown): string[] {
    if (!this.isHttpExceptionResponse(response)) {
      return [];
    }

    return Array.isArray(response.message)
      ? response.message.filter(
          (detail): detail is string => typeof detail === 'string',
        )
      : [];
  }

  private getSafeHttpMessage(response: unknown, statusCode: number): string {
    if (typeof response === 'string') {
      return response;
    }

    if (
      this.isHttpExceptionResponse(response) &&
      typeof response.message === 'string'
    ) {
      return response.message;
    }

    return this.getDefaultHttpMessage(statusCode);
  }

  private isHttpExceptionResponse(
    response: unknown,
  ): response is HttpExceptionResponse {
    return typeof response === 'object' && response !== null;
  }

  private getErrorCode(statusCode: number): string {
    return HTTP_ERROR_DESCRIPTORS[statusCode]?.code ?? 'HTTP_ERROR';
  }

  private getDefaultHttpMessage(statusCode: number): string {
    return HTTP_ERROR_DESCRIPTORS[statusCode]?.message ?? 'Request failed';
  }

  private logException(params: {
    exception: unknown;
    request: Request;
    statusCode: number;
    correlationId: string;
  }): void {
    const { exception, request, statusCode, correlationId } = params;

    const logContext = {
      correlationId,
      method: request.method,
      path: request.originalUrl,
      statusCode,
      userAgent: request.get('user-agent'),
      ip: request.ip,
    };

    /*
     * Los errores 4xx suelen representar problemas del cliente:
     * validaciones, autenticación, recursos inexistentes, etc.
     */
    if (statusCode < 500) {
      this.logger.warn({
        ...logContext,
        message: this.getLogMessage(exception),
      });

      return;
    }

    /*
     * Los errores 5xx sí indican fallos internos y conviene
     * registrar el stack para diagnóstico.
     */
    this.logger.error({
      ...logContext,
      message: this.getLogMessage(exception),
      stack: exception instanceof Error ? exception.stack : undefined,
    });
  }

  private getLogMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }

    if (typeof exception === 'string') {
      return exception;
    }

    return 'Unknown exception';
  }
}
