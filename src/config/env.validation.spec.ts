import { validateEnvironment } from './env.validation';

function validEnvironment(): Record<string, string> {
  return {
    NODE_ENV: 'dev',
    APP_HOST: 'localhost',
    APP_PORT: '3000',
    API_PREFIX: 'api',
    CORS_ORIGINS: 'http://localhost:3000',
    DATABASE_HOST: 'localhost',
    DATABASE_PORT: '5432',
    DATABASE_NAME: 'nexuscrm',
    DATABASE_USER: 'nexuscrm_app',
    DATABASE_PASSWORD: 'development-password-123',
    DATABASE_SSL: 'false',
    DATABASE_LOGGING: 'false',
    DATABASE_POOL_SIZE: '10',
    DATABASE_MIGRATIONS_RUN: 'false',
    DATABASE_SYNCHRONIZE: 'false',
    POSTGRES_IMAGE:
      'postgres:17.10-bookworm@sha256:5530681ea5d3e2ed4ce396f9b5cb443efbac6baf2a8a19c0c0635e40ae7eadce',
    POSTGRES_CONTAINER_NAME: 'nexuscrm-postgres',
    POSTGRES_HOST_PORT: '5432',
    POSTGRES_CONTAINER_PORT: '5432',
    POSTGRES_DB: 'nexuscrm',
    POSTGRES_USER: 'nexuscrm_app',
    POSTGRES_PASSWORD: 'development-password-123',
    POSTGRES_VOLUME_NAME: 'nexuscrm_postgres_data',
    TEST_POSTGRES_CONTAINER_NAME: 'nexuscrm-postgres-test',
    TEST_POSTGRES_HOST_PORT: '5433',
    TEST_POSTGRES_DB: 'nexuscrm_test',
    TEST_POSTGRES_USER: 'nexuscrm_test',
    TEST_POSTGRES_PASSWORD: 'test-password-123456789',
    TEST_POSTGRES_VOLUME_NAME: 'nexuscrm_postgres_test_data',
    DATABASE_TEST_NAME: 'nexuscrm_test',
    PGADMIN_IMAGE:
      'dpage/pgadmin4:9.16@sha256:40fa840c5bb7c8463957f1255b01283732c2d8c9396a956d180f8e6c296753b3',
    PGADMIN_CONTAINER_NAME: 'nexuscrm-pgadmin',
    PGADMIN_HOST_PORT: '5050',
    PGADMIN_DEFAULT_EMAIL: 'admin@example.com',
    PGADMIN_DEFAULT_PASSWORD: 'pgadmin-password-123',
    PGADMIN_VOLUME_NAME: 'nexuscrm_pgadmin_data',
    SEED_RANDOM_SEED: '20260713',
    SEED_BATCH_SIZE: '100',
    SEED_ALLOW_DEMO_DATA: 'false',
  };
}

describe('validateEnvironment', () => {
  it('accepts the complete development contract', () => {
    expect(() => validateEnvironment(validEnvironment())).not.toThrow();
  });

  it.each([
    [
      'a missing database password',
      (environment: Record<string, string>) =>
        delete environment.DATABASE_PASSWORD,
      'DATABASE_PASSWORD',
    ],
    [
      'an out-of-range application port',
      (environment: Record<string, string>) => {
        environment.APP_PORT = '70000';
      },
      'APP_PORT',
    ],
    [
      'database synchronize enabled',
      (environment: Record<string, string>) => {
        environment.DATABASE_SYNCHRONIZE = 'true';
      },
      'DATABASE_SYNCHRONIZE',
    ],
    [
      'SSL disabled in production',
      (environment: Record<string, string>) => {
        environment.NODE_ENV = 'prod';
        environment.DATABASE_SSL = 'false';
      },
      'DATABASE_SSL',
    ],
  ])('rejects %s', (_description, changeEnvironment, expectedVariable) => {
    const environment = validEnvironment();
    changeEnvironment(environment);

    expect(() => validateEnvironment(environment)).toThrow(expectedVariable);
  });
});
