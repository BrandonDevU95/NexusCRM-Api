import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from './../src/app.module';
import { configureHttpApplication } from './../src/app.bootstrap';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

describe('HTTP API foundation (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureHttpApplication(app);
    await app.init();
  });

  it('returns the readiness contract under the versioned API prefix', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body, headers }) => {
        expect(headers['x-correlation-id']).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
        );
        expect(body).toEqual({
          status: 'ok',
          service: 'nexuscrm-api',
          version: '0.0.1',
          timestamp: expect.any(String),
          database: 'up',
        });
      });
  });

  it('propagates a valid correlation ID to the response header', () => {
    const correlationId = 'foundation-e2e-001';

    return request(app.getHttpServer())
      .get('/api/v1/health')
      .set('x-correlation-id', correlationId)
      .expect(200)
      .expect('x-correlation-id', correlationId);
  });

  it('returns the stable error envelope for an unknown API route', () => {
    const correlationId = 'foundation-e2e-404';

    return request(app.getHttpServer())
      .get('/api/v1/not-found')
      .set('x-correlation-id', correlationId)
      .expect(404)
      .expect('x-correlation-id', correlationId)
      .expect(({ body }) => {
        expect(body).toEqual({
          statusCode: 404,
          code: 'NOT_FOUND',
          message: 'Cannot GET /api/v1/not-found',
          details: [],
          timestamp: expect.any(String),
          path: '/api/v1/not-found',
          method: 'GET',
          correlationId,
        });
      });
  });

  afterAll(async () => {
    await app.close();
  });
});
