import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { GlobalExceptionFilter } from './global-exception.filter';

interface HttpMocks {
  host: ArgumentsHost;
  response: Pick<Response, 'status' | 'json' | 'setHeader'>;
}

function createHttpMocks(request: Partial<Request>): HttpMocks {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;

  return { host, response };
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let warn: jest.SpiedFunction<typeof Logger.prototype.warn>;
  let error: jest.SpiedFunction<typeof Logger.prototype.error>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('serializes HTTP exceptions and logs client errors as warnings', () => {
    const timestampMatcher: unknown =
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/);
    const { host, response } = createHttpMocks({
      correlationId: 'request-123',
      originalUrl: '/api/customers',
      method: 'POST',
      get: jest.fn().mockReturnValue('jest'),
      ip: '127.0.0.1',
    });
    const exception = new BadRequestException(['name must not be empty']);

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'La solicitud contiene datos inválidos',
        details: ['name must not be empty'],
        path: '/api/customers',
        method: 'POST',
        correlationId: 'request-123',
        timestamp: timestampMatcher,
      }),
    );
    expect(warn).toHaveBeenCalledWith({
      correlationId: 'request-123',
      method: 'POST',
      path: '/api/customers',
      statusCode: 400,
      userAgent: 'jest',
      ip: '127.0.0.1',
      message: 'Bad Request Exception',
    });
    expect(error).not.toHaveBeenCalled();
  });

  it('preserves safe messages from string HTTP exception responses', () => {
    const stackMatcher: unknown = expect.any(String);
    const { host, response } = createHttpMocks({
      correlationId: 'request-503',
      originalUrl: '/api/reports',
      method: 'GET',
      get: jest.fn(),
      ip: '127.0.0.1',
    });

    filter.catch(new HttpException('Report unavailable', 503), host);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Report unavailable',
        code: 'SERVICE_UNAVAILABLE',
        details: [],
        correlationId: 'request-503',
      }),
    );
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 503,
        message: 'Report unavailable',
        stack: stackMatcher,
      }),
    );
  });

  it('hides unexpected errors from the response and logs their stack', () => {
    const { host, response } = createHttpMocks({
      correlationId: 'request-500',
      originalUrl: '/api/orders',
      method: 'PATCH',
      get: jest.fn().mockReturnValue('integration-test'),
      ip: '10.0.0.8',
    });
    const exception = new Error('Database connection failed');

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: [],
      }),
    );
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'request-500',
        message: 'Database connection failed',
        stack: exception.stack,
      }),
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('generates a correlation ID when an unmatched route reaches the filter', () => {
    const correlationIdMatcher: unknown = expect.stringMatching(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    const { host, response } = createHttpMocks({
      originalUrl: '/api/v1/missing',
      method: 'GET',
      get: jest.fn(),
      ip: '127.0.0.1',
    });

    filter.catch(new NotFoundException(), host);

    expect(response.status).toHaveBeenCalledWith(404);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'NOT_FOUND',
        details: [],
        correlationId: correlationIdMatcher,
      }),
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      expect.any(String),
    );
  });

  it('does not serialize Terminus diagnostic objects into a 503 response', () => {
    const { host, response } = createHttpMocks({
      correlationId: 'request-503',
      originalUrl: '/api/v1/health',
      method: 'GET',
      get: jest.fn(),
      ip: '127.0.0.1',
    });
    const exception = new HttpException(
      {
        status: 'error',
        error: { database: { status: 'down' } },
        details: { database: { status: 'down' } },
      },
      503,
    );

    filter.catch(exception, host);

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'SERVICE_UNAVAILABLE',
        details: [],
        message: 'Service unavailable',
      }),
    );
  });
});
