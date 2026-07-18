import { Test, TestingModule } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { DataSource, In, Repository } from 'typeorm';

import { AppModule } from '../../../src/app.module';
import { configureHttpApplication } from '../../../src/app.bootstrap';
import { SystemSetting } from '../../../src/platform/entities/system-setting.entity';
import {
  assertConnectedToTestDatabase,
  getTestConfig,
} from '../../helpers/test-database.helper';

const TEST_SETTING_KEYS = [
  'platform.default_language',
  'platform.default_currency',
  'platform.date_format',
  'database_password',
];

describe('Platform public settings (e2e)', () => {
  const config = getTestConfig();
  const unknownEnvironmentValue = 'platform-ci-job-sentinel-7843';
  const previousCiJobId = process.env.CI_JOB_ID;
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let settingsRepository: Repository<SystemSetting>;

  beforeAll(async () => {
    process.env.CI_JOB_ID = unknownEnvironmentValue;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureHttpApplication(app);
    await app.init();

    dataSource = app.get(DataSource);
    await assertConnectedToTestDatabase(dataSource, config);
    await expect(dataSource.showMigrations()).resolves.toBe(false);

    settingsRepository = dataSource.getRepository(SystemSetting);
    await removeTestSettings();
    await settingsRepository.save([
      settingsRepository.create({
        key: 'platform.default_language',
        value: 'es-MX',
        description: 'Default public locale.',
        isPublic: true,
      }),
      settingsRepository.create({
        key: 'platform.default_currency',
        value: 'mxn',
        description: 'Invalid lowercase currency.',
        isPublic: true,
      }),
      settingsRepository.create({
        key: 'platform.date_format',
        value: 'YYYY-MM-DD',
        description: 'Private setting.',
        isPublic: false,
      }),
      settingsRepository.create({
        key: 'database_password',
        value: 'do-not-expose',
        description: 'Unknown key marked public by mistake.',
        isPublic: true,
      }),
    ]);
  }, 15_000);

  it('PLAT-E2E-001 returns only known, valid, public settings', async () => {
    const response = await request(app.getHttpServer()).get(
      '/api/v1/settings/public',
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      {
        key: 'platform.default_language',
        value: 'es-MX',
        description: 'Default public locale.',
      },
    ]);
    expect(JSON.stringify(response.body)).not.toContain('database_password');
    expect(JSON.stringify(response.body)).not.toContain('do-not-expose');
    expect(JSON.stringify(response.body)).not.toContain(
      process.env.DATABASE_PASSWORD,
    );
    expect(JSON.stringify(response.body)).not.toContain('CI_JOB_ID');
    expect(JSON.stringify(response.body)).not.toContain(
      unknownEnvironmentValue,
    );
  });

  it('PLAT-E2E-002 does not expose temporary administrative endpoints', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer()).get('/api/v1/settings'),
      request(app.getHttpServer()).patch(
        '/api/v1/settings/platform.default_language',
      ),
      request(app.getHttpServer()).get('/api/v1/catalogs'),
      request(app.getHttpServer()).post('/api/v1/catalogs'),
      request(app.getHttpServer()).get('/api/v1/tax-rates'),
      request(app.getHttpServer()).get('/api/v1/number-sequences'),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(404);
    }
  });

  async function removeTestSettings(): Promise<void> {
    await settingsRepository.delete({ key: In(TEST_SETTING_KEYS) });
  }

  afterAll(async () => {
    if (settingsRepository) {
      await removeTestSettings();
    }
    if (app) {
      await app.close();
    }
    if (previousCiJobId === undefined) {
      delete process.env.CI_JOB_ID;
    } else {
      process.env.CI_JOB_ID = previousCiJobId;
    }
  });
});
