import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { configureHttpApplication } from '../../../src/app.bootstrap';
import { getTestConfig } from '../../helpers/test-database.helper';

describe('HTTP API foundation (e2e)', () => {
  const config = getTestConfig();
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let appClosed = false;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureHttpApplication(app);
    await app.init();
    dataSource = app.get(DataSource);
  });

  it('FND-E2E-001 starts in memory with the migrated test database', async () => {
    expect(app.getHttpServer().listening).toBe(false);
    expect(dataSource.isInitialized).toBe(true);
    await expect(dataSource.showMigrations()).resolves.toBe(false);
  });

  it('FND-E2E-002 exposes readiness under the versioned API prefix', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health');
    const timestampMatcher: unknown = expect.any(String);

    expect(response.status).toBe(200);
    expect(response.headers['x-correlation-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(response.body).toEqual({
      status: 'ok',
      service: 'nexuscrm-api',
      version: config.app.version,
      timestamp: timestampMatcher,
      database: 'up',
    });
  });

  it('FND-E2E-003 propagates a valid correlation ID consistently', async () => {
    const correlationId = 'foundation-e2e-001';

    const response = await request(app.getHttpServer())
      .get('/api/v1/not-found-with-correlation')
      .set('x-correlation-id', correlationId);
    const body = response.body as Record<string, unknown>;

    expect(response.headers['x-correlation-id']).toBe(correlationId);
    expect(body.correlationId).toBe(correlationId);
  });

  it('FND-E2E-004 returns a client-safe envelope for an unknown route', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/not-found',
    );
    const body: unknown = response.body;
    const timestampMatcher: unknown = expect.any(String);

    expect(response.status).toBe(404);
    expect(body).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Cannot GET /api/v1/not-found',
      details: [],
      timestamp: timestampMatcher,
      path: '/api/v1/not-found',
      method: 'GET',
      correlationId: response.headers['x-correlation-id'],
    });
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain(process.env.DATABASE_PASSWORD);
  });

  it('FND-E2E-005 closes the application and its database connection', async () => {
    await app.close();
    appClosed = true;

    expect(dataSource.isInitialized).toBe(false);
    expect(app.getHttpServer().listening).toBe(false);
  });

  afterAll(async () => {
    if (!appClosed) {
      await app.close();
    }
  });
});
