import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { GlobalExceptionFilter } from './global-exception.filter';

interface HttpMocks {
  host: ArgumentsHost;
  response: Pick<Response, 'status' | 'json'>;
}

function createHttpMocks(request: Partial<Request>): HttpMocks {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
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
        path: '/api/customers',
        method: 'POST',
        correlationId: 'request-123',
        message: ['name must not be empty'],
        error: 'Bad Request',
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

  it('preserves string HTTP exception responses', () => {
    const stackMatcher: unknown = expect.any(String);
    const { host, response } = createHttpMocks({
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
        error: 'HttpException',
        correlationId: 'correlation-id-unavailable',
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
        message: 'Internal server error',
        error: 'Internal Server Error',
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
});
