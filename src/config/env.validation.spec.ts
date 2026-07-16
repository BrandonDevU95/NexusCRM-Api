import { validateEnvironment } from './env.validation';

function validEnvironment(): Record<string, string> {
  return {
    NODE_ENV: 'dev',
    APP_HOST: 'localhost',
    APP_PORT: '3000',
    CORS_ORIGINS: 'http://localhost:3000',
    COMPRESSION_ENABLED: 'true',
    COMPRESSION_THRESHOLD_BYTES: '2048',
    COMPRESSION_LEVEL: '4',
    APP_VERSION: '1.0.0',
    SWAGGER_ENABLED: 'true',
    SWAGGER_PATH: 'docs',
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
  it('FND-UT-001 normalizes a complete development environment', () => {
    // Arrange
    const environment = validEnvironment();

    // Act
    const result = validateEnvironment(environment);

    // Assert
    expect(result).toMatchObject(environment);
  });

  it('allows reference mode configuration without a random seed', () => {
    const environment = validEnvironment();
    delete environment.SEED_RANDOM_SEED;

    expect(() => validateEnvironment(environment)).not.toThrow();
  });

  it('defaults demo data authorization to false', () => {
    const environment = validEnvironment();
    delete environment.SEED_ALLOW_DEMO_DATA;

    expect(validateEnvironment(environment).SEED_ALLOW_DEMO_DATA).toBe('false');
  });

  it.each([
    [
      'FND-UT-002 rejects a missing database password without exposing values',
      (environment: Record<string, string>) =>
        delete environment.DATABASE_PASSWORD,
      'DATABASE_PASSWORD',
    ],
    [
      'FND-UT-003 rejects an out-of-range application port',
      (environment: Record<string, string>) => {
        environment.APP_PORT = '70000';
      },
      'APP_PORT',
    ],
    [
      'an invalid application version',
      (environment: Record<string, string>) => {
        environment.APP_VERSION = '1.0';
      },
      'APP_VERSION',
    ],
    [
      'an unsafe compression level',
      (environment: Record<string, string>) => {
        environment.COMPRESSION_LEVEL = '9';
      },
      'COMPRESSION_LEVEL',
    ],
    [
      'FND-UT-004 rejects database synchronize enabled',
      (environment: Record<string, string>) => {
        environment.DATABASE_SYNCHRONIZE = 'true';
      },
      'DATABASE_SYNCHRONIZE',
    ],
    [
      'FND-UT-005 rejects SSL disabled in production',
      (environment: Record<string, string>) => {
        environment.NODE_ENV = 'prod';
        environment.DATABASE_SSL = 'false';
      },
      'DATABASE_SSL',
    ],
    [
      'FND-UT-006 rejects demo data enabled in production',
      (environment: Record<string, string>) => {
        environment.NODE_ENV = 'prod';
        environment.DATABASE_SSL = 'true';
        environment.SEED_ALLOW_DEMO_DATA = 'true';
      },
      'SEED_ALLOW_DEMO_DATA',
    ],
    [
      'a zero random seed',
      (environment: Record<string, string>) => {
        environment.SEED_RANDOM_SEED = '0';
      },
      'SEED_RANDOM_SEED',
    ],
  ])('%s', (_description, changeEnvironment, expectedVariable) => {
    // Arrange
    const environment = validEnvironment();
    changeEnvironment(environment);

    // Act
    let validationError: Error | undefined;
    try {
      validateEnvironment(environment);
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error;
      }
      validationError = error;
    }

    // Assert
    expect(validationError?.message).toContain(expectedVariable);
    expect(validationError?.message).not.toContain('development-password-123');
  });
});
