import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { firstValueFrom, of, throwError } from 'rxjs';

import {
  correlationIdMiddleware,
  CorrelationIdInterceptor,
  MAX_CORRELATION_ID_LENGTH,
} from './correlation-id.interceptor';

function createHttpContext(correlationId?: string): {
  context: ExecutionContext;
  request: Pick<Request, 'get' | 'correlationId'>;
  response: Pick<Response, 'setHeader'>;
} {
  const request = {
    get: jest.fn().mockReturnValue(correlationId),
  };
  const response = {
    setHeader: jest.fn(),
  };

  const context = {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;

  return { context, request, response };
}

describe('CorrelationIdInterceptor', () => {
  const interceptor = new CorrelationIdInterceptor();

  it('reuses a valid correlation ID provided by the client', async () => {
    const { context, request, response } = createHttpContext('trace_123.abc');
    const handler: CallHandler = { handle: () => of('result') };

    await expect(
      firstValueFrom(interceptor.intercept(context, handler)),
    ).resolves.toBe('result');

    expect(request.get).toHaveBeenCalledWith('x-correlation-id');
    expect(request.correlationId).toBe('trace_123.abc');
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      'trace_123.abc',
    );
  });

  it('accepts correlation IDs up to the documented maximum length', async () => {
    const correlationId = 'a'.repeat(MAX_CORRELATION_ID_LENGTH);
    const { context, request, response } = createHttpContext(correlationId);
    const handler: CallHandler = { handle: () => of(undefined) };

    await firstValueFrom(interceptor.intercept(context, handler));

    expect(request.correlationId).toBe(correlationId);
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      correlationId,
    );
  });

  it.each([
    ['a missing value', undefined],
    ['characters outside the allowed set', 'trace id!'],
    ['a value longer than 128 characters', 'a'.repeat(129)],
  ])('generates an ID for %s', async (_description, providedCorrelationId) => {
    const { context, request, response } = createHttpContext(
      providedCorrelationId,
    );
    const handler: CallHandler = { handle: () => of(undefined) };

    await firstValueFrom(interceptor.intercept(context, handler));

    expect(request.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      request.correlationId,
    );
  });

  it('does not access HTTP objects for non-HTTP execution contexts', async () => {
    const switchToHttp = jest.fn();
    const handle = jest.fn(() => of('result'));
    const context = {
      getType: () => 'rpc',
      switchToHttp,
    } as unknown as ExecutionContext;
    const handler: CallHandler = { handle };

    await expect(
      firstValueFrom(interceptor.intercept(context, handler)),
    ).resolves.toBe('result');

    expect(switchToHttp).not.toHaveBeenCalled();
    expect(handle).toHaveBeenCalledTimes(1);
  });

  it('assigns the correlation ID before routing middleware', () => {
    const setHeader = jest.fn();
    const request = {
      get: jest.fn().mockReturnValue('before-router-001'),
    } as unknown as Request;
    const response = {
      setHeader,
    } as unknown as Response;
    const next = jest.fn();

    correlationIdMiddleware(request, response, next);

    expect(request.correlationId).toBe('before-router-001');
    expect(setHeader).toHaveBeenCalledWith(
      'x-correlation-id',
      'before-router-001',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('logs failed HTTP requests with the exception status code', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const { context } = createHttpContext('request-400');
    const handler: CallHandler = {
      handle: () => throwError(() => new BadRequestException()),
    };

    await expect(
      firstValueFrom(interceptor.intercept(context, handler)),
    ).rejects.toThrow(BadRequestException);

    expect(log).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: 'request-400',
        statusCode: 400,
      }),
    );

    log.mockRestore();
  });
});
