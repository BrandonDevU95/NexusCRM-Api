import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  correlationId: string;
  message: string | string[];
  error?: string;
}

interface HttpExceptionResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();

    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const statusCode = this.getStatusCode(exception);
    const exceptionResponse = this.getExceptionResponse(exception);

    const correlationId = request.correlationId ?? 'correlation-id-unavailable';

    const responseBody: ErrorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      correlationId,
      message: exceptionResponse.message,
      ...(exceptionResponse.error ? { error: exceptionResponse.error } : {}),
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

  private getExceptionResponse(
    exception: unknown,
  ): Required<Pick<HttpExceptionResponse, 'message'>> &
    Pick<HttpExceptionResponse, 'error'> {
    if (!(exception instanceof HttpException)) {
      return {
        message: 'Internal server error',
        error: 'Internal Server Error',
      };
    }

    const response = exception.getResponse();

    if (typeof response === 'string') {
      return {
        message: response,
        error: exception.name,
      };
    }

    const responseObject = response as HttpExceptionResponse;

    return {
      message:
        responseObject.message ?? exception.message ?? 'Unexpected error',
      error: responseObject.error ?? exception.name,
    };
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
