import type { AppConfig, NodeEnvironment } from './env.types';

type EnvironmentValues = Record<string, unknown>;

function requiredString(environment: EnvironmentValues, key: string): string {
  const value = environment[key];

  if (typeof value !== 'string') {
    throw new Error(`Missing validated environment variable: ${key}`);
  }

  return value;
}

function toInteger(environment: EnvironmentValues, key: string): number {
  return Number(requiredString(environment, key));
}

function toBoolean(environment: EnvironmentValues, key: string): boolean {
  const value = requiredString(environment, key).toLowerCase();

  return value === 'true' || value === '1';
}

export function getEnvironmentFile(): string {
  return process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
}

export function loadEnvironment(
  environment: EnvironmentValues = process.env,
): AppConfig {
  return {
    app: {
      environment: requiredString(environment, 'NODE_ENV') as NodeEnvironment,
      host: requiredString(environment, 'APP_HOST'),
      port: toInteger(environment, 'APP_PORT'),
      apiPrefix: requiredString(environment, 'API_PREFIX'),
      corsOrigins: requiredString(environment, 'CORS_ORIGINS')
        .split(',')
        .map((origin) => origin.trim()),
    },
    database: {
      host: requiredString(environment, 'DATABASE_HOST'),
      port: toInteger(environment, 'DATABASE_PORT'),
      name: requiredString(environment, 'DATABASE_NAME'),
      user: requiredString(environment, 'DATABASE_USER'),
      password: requiredString(environment, 'DATABASE_PASSWORD'),
      ssl: toBoolean(environment, 'DATABASE_SSL'),
      logging: toBoolean(environment, 'DATABASE_LOGGING'),
      poolSize: toInteger(environment, 'DATABASE_POOL_SIZE'),
      migrationsRun: false,
      synchronize: false,
      testName: requiredString(environment, 'DATABASE_TEST_NAME'),
    },
    compose: {
      postgres: {
        image: requiredString(environment, 'POSTGRES_IMAGE'),
        containerName: requiredString(environment, 'POSTGRES_CONTAINER_NAME'),
        hostPort: toInteger(environment, 'POSTGRES_HOST_PORT'),
        containerPort: toInteger(environment, 'POSTGRES_CONTAINER_PORT'),
        database: requiredString(environment, 'POSTGRES_DB'),
        user: requiredString(environment, 'POSTGRES_USER'),
        password: requiredString(environment, 'POSTGRES_PASSWORD'),
        volumeName: requiredString(environment, 'POSTGRES_VOLUME_NAME'),
      },
      testPostgres: {
        containerName: requiredString(
          environment,
          'TEST_POSTGRES_CONTAINER_NAME',
        ),
        hostPort: toInteger(environment, 'TEST_POSTGRES_HOST_PORT'),
        database: requiredString(environment, 'TEST_POSTGRES_DB'),
        user: requiredString(environment, 'TEST_POSTGRES_USER'),
        password: requiredString(environment, 'TEST_POSTGRES_PASSWORD'),
        volumeName: requiredString(environment, 'TEST_POSTGRES_VOLUME_NAME'),
      },
      pgAdmin: {
        image: requiredString(environment, 'PGADMIN_IMAGE'),
        containerName: requiredString(environment, 'PGADMIN_CONTAINER_NAME'),
        hostPort: toInteger(environment, 'PGADMIN_HOST_PORT'),
        defaultEmail: requiredString(environment, 'PGADMIN_DEFAULT_EMAIL'),
        defaultPassword: requiredString(
          environment,
          'PGADMIN_DEFAULT_PASSWORD',
        ),
        volumeName: requiredString(environment, 'PGADMIN_VOLUME_NAME'),
      },
    },
    seed: {
      randomSeed: toInteger(environment, 'SEED_RANDOM_SEED'),
      batchSize: toInteger(environment, 'SEED_BATCH_SIZE'),
      allowDemoData: toBoolean(environment, 'SEED_ALLOW_DEMO_DATA'),
    },
  };
}
