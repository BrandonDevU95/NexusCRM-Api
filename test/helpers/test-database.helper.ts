import { DataSource } from 'typeorm';

import { loadEnvironment } from '../../src/config/env.loader';
import type { AppConfig } from '../../src/config/env.types';
import { validateEnvironment } from '../../src/config/env.validation';
import { createTypeOrmOptions } from '../../src/database/typeorm-options';

type DatabaseOverrides = Partial<AppConfig['database']>;

interface CurrentDatabaseRow {
  currentDatabase: string;
}

export function getTestConfig(): AppConfig {
  const config = loadEnvironment(validateEnvironment(process.env));
  assertTestDatabaseSafety(config);

  return config;
}

export function assertTestDatabaseSafety(config: AppConfig): void {
  const failures: string[] = [];

  if (config.app.environment !== 'test') {
    failures.push('NODE_ENV must be test');
  }
  if (config.database.name !== config.database.testName) {
    failures.push('DATABASE_NAME must match DATABASE_TEST_NAME');
  }
  if (config.database.name !== config.compose.testPostgres.database) {
    failures.push('DATABASE_NAME must match TEST_POSTGRES_DB');
  }
  if (config.database.port !== config.compose.testPostgres.hostPort) {
    failures.push('DATABASE_PORT must match TEST_POSTGRES_HOST_PORT');
  }
  if (config.database.name === config.compose.postgres.database) {
    failures.push('test and development database names must differ');
  }
  if (config.database.synchronize !== false) {
    failures.push('synchronize must be false');
  }
  if (config.database.migrationsRun !== false) {
    failures.push('migrationsRun must be false');
  }

  if (failures.length > 0) {
    throw new Error(
      `Unsafe test database configuration: ${failures.join('; ')}`,
    );
  }
}

export function createTestDataSource(
  config: AppConfig,
  overrides: DatabaseOverrides = {},
): DataSource {
  assertTestDatabaseSafety(config);

  return new DataSource(
    createTypeOrmOptions({
      ...config.database,
      ...overrides,
    }),
  );
}

export async function assertConnectedToTestDatabase(
  dataSource: DataSource,
  config: AppConfig,
): Promise<void> {
  assertTestDatabaseSafety(config);

  const options = dataSource.options;
  if (
    options.type !== 'postgres' ||
    options.database !== config.database.testName ||
    options.port !== config.compose.testPostgres.hostPort
  ) {
    throw new Error(
      'DataSource does not target the allowlisted test database.',
    );
  }

  const rows = await dataSource.query<CurrentDatabaseRow[]>(
    'SELECT current_database() AS "currentDatabase"',
  );
  if (rows[0]?.currentDatabase !== config.database.testName) {
    throw new Error(
      'PostgreSQL connection is not using the allowlisted test database.',
    );
  }
}

export async function resetTestSchema(
  dataSource: DataSource,
  config: AppConfig,
): Promise<void> {
  await assertConnectedToTestDatabase(dataSource, config);
  await dataSource.query('DROP SCHEMA IF EXISTS public CASCADE');
  await dataSource.query('CREATE SCHEMA public');
}
