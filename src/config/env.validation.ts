import * as Joi from 'joi';

import { SWAGGER_DEFAULT_PATH } from '../common/constants/api.constants';
import type { NodeEnvironment } from './env.types';

type EnvironmentValues = Record<string, unknown>;

const booleanString = Joi.string()
  .trim()
  .lowercase()
  .valid('true', 'false', '1', '0')
  .only();

const falseBooleanString = Joi.string()
  .trim()
  .lowercase()
  .valid('false', '0')
  .only();

const integerString = (minimum: number, maximum: number) =>
  Joi.string()
    .trim()
    .pattern(/^\d+$/)
    .custom((value, helpers) => {
      const rawValue: unknown = value;
      if (typeof rawValue !== 'string') {
        return helpers.error('string.base');
      }

      const parsedValue = Number(rawValue);

      if (parsedValue < minimum || parsedValue > maximum) {
        return helpers.error('number.range');
      }

      return rawValue;
    });

const imageWithDigest = Joi.string()
  .trim()
  .pattern(/^[a-z0-9][a-z0-9._/-]*:[^\s@]+@sha256:[a-f0-9]{64}$/);

const safePassword = Joi.string()
  .trim()
  .min(16)
  .invalid('password', 'postgres', 'changeme', 'replace-with-local-secret')
  .required();

const corsOrigins = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const rawValue: unknown = value;
    if (typeof rawValue !== 'string') {
      return helpers.error('string.base');
    }

    const origins = rawValue.split(',').map((origin) => origin.trim());

    if (origins.length === 0 || origins.some((origin) => origin.length === 0)) {
      return helpers.error('cors.empty');
    }

    for (const origin of origins) {
      if (origin === '*') {
        continue;
      }

      try {
        const parsedOrigin = new URL(origin);
        if (
          !['http:', 'https:'].includes(parsedOrigin.protocol) ||
          parsedOrigin.origin !== origin
        ) {
          return helpers.error('cors.origin');
        }
      } catch {
        return helpers.error('cors.origin');
      }
    }

    return rawValue;
  });

const environmentSchema = Joi.object({
  NODE_ENV: Joi.string().valid('dev', 'test', 'prod').only().required(),
  APP_HOST: Joi.alternatives()
    .try(Joi.string().valid('localhost'), Joi.string().hostname())
    .required(),
  APP_PORT: integerString(1, 65535).required(),
  APP_VERSION: Joi.string()
    .trim()
    .pattern(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/)
    .required(),
  CORS_ORIGINS: corsOrigins.required(),
  COMPRESSION_ENABLED: booleanString.required(),
  COMPRESSION_THRESHOLD_BYTES: integerString(1024, 1_048_576).required(),
  COMPRESSION_LEVEL: integerString(1, 6).required(),
  SWAGGER_ENABLED: booleanString.default('false'),
  SWAGGER_PATH: Joi.string()
    .trim()
    .pattern(/^[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)*$/i)
    .default(SWAGGER_DEFAULT_PATH),

  DATABASE_HOST: Joi.string().trim().min(1).required(),
  DATABASE_PORT: integerString(1, 65535).required(),
  DATABASE_NAME: Joi.string().trim().pattern(/^\S+$/).required(),
  DATABASE_USER: Joi.string().trim().min(1).required(),
  DATABASE_PASSWORD: safePassword,
  DATABASE_SSL: booleanString.required(),
  DATABASE_LOGGING: booleanString.default('false'),
  DATABASE_POOL_SIZE: integerString(1, 100).default('10'),
  DATABASE_MIGRATIONS_RUN: falseBooleanString.required(),
  DATABASE_SYNCHRONIZE: falseBooleanString.required(),

  POSTGRES_IMAGE: imageWithDigest.required(),
  POSTGRES_CONTAINER_NAME: Joi.string().trim().min(1).required(),
  POSTGRES_HOST_PORT: integerString(1, 65535).required(),
  POSTGRES_CONTAINER_PORT: integerString(1, 65535).required(),
  POSTGRES_DB: Joi.string().trim().pattern(/^\S+$/).required(),
  POSTGRES_USER: Joi.string().trim().min(1).required(),
  POSTGRES_PASSWORD: safePassword,
  POSTGRES_VOLUME_NAME: Joi.string().trim().min(1).required(),

  TEST_POSTGRES_CONTAINER_NAME: Joi.string().trim().min(1).required(),
  TEST_POSTGRES_HOST_PORT: integerString(1, 65535).required(),
  TEST_POSTGRES_DB: Joi.string().trim().pattern(/^\S+$/).required(),
  TEST_POSTGRES_USER: Joi.string().trim().min(1).required(),
  TEST_POSTGRES_PASSWORD: safePassword,
  TEST_POSTGRES_VOLUME_NAME: Joi.string().trim().min(1).required(),
  DATABASE_TEST_NAME: Joi.string().trim().pattern(/^\S+$/).required(),

  PGADMIN_IMAGE: imageWithDigest.required(),
  PGADMIN_CONTAINER_NAME: Joi.string().trim().min(1).required(),
  PGADMIN_HOST_PORT: integerString(1, 65535).required(),
  PGADMIN_DEFAULT_EMAIL: Joi.string().email().required(),
  PGADMIN_DEFAULT_PASSWORD: safePassword,
  PGADMIN_VOLUME_NAME: Joi.string().trim().min(1).required(),

  SEED_RANDOM_SEED: integerString(1, Number.MAX_SAFE_INTEGER).optional(),
  SEED_BATCH_SIZE: integerString(1, 1000).required(),
  SEED_ALLOW_DEMO_DATA: booleanString.default('false'),
});

export function validateEnvironment(
  config: EnvironmentValues,
): EnvironmentValues {
  const validationResult = environmentSchema.validate(config, {
    abortEarly: false,
    allowUnknown: true,
    convert: false,
  });
  const error = validationResult.error;
  const value = validationResult.value as EnvironmentValues;

  const invalidVariables = new Set(
    error?.details.map((detail) =>
      detail.path.length > 0 ? detail.path.join('.') : 'environment',
    ) ?? [],
  );

  if (!error) {
    const environment = value.NODE_ENV as NodeEnvironment;
    const isTest = environment === 'test';
    const expectedDatabaseName = isTest
      ? value.TEST_POSTGRES_DB
      : value.POSTGRES_DB;
    const expectedDatabaseUser = isTest
      ? value.TEST_POSTGRES_USER
      : value.POSTGRES_USER;
    const expectedDatabasePassword = isTest
      ? value.TEST_POSTGRES_PASSWORD
      : value.POSTGRES_PASSWORD;
    const expectedDatabasePort = isTest
      ? value.TEST_POSTGRES_HOST_PORT
      : value.POSTGRES_HOST_PORT;

    const matchingKeys: Array<[string, unknown, unknown]> = [
      ['DATABASE_NAME', value.DATABASE_NAME, expectedDatabaseName],
      ['DATABASE_USER', value.DATABASE_USER, expectedDatabaseUser],
      ['DATABASE_PASSWORD', value.DATABASE_PASSWORD, expectedDatabasePassword],
      ['DATABASE_PORT', value.DATABASE_PORT, expectedDatabasePort],
    ];

    for (const [key, actual, expected] of matchingKeys) {
      if (actual !== expected) {
        invalidVariables.add(key);
      }
    }

    if (isTest && value.DATABASE_NAME !== value.DATABASE_TEST_NAME) {
      invalidVariables.add('DATABASE_TEST_NAME');
    }

    if (
      environment === 'prod' &&
      !['true', '1'].includes(value.DATABASE_SSL as string)
    ) {
      invalidVariables.add('DATABASE_SSL');
    }

    if (
      environment === 'prod' &&
      !['false', '0'].includes(value.SEED_ALLOW_DEMO_DATA as string)
    ) {
      invalidVariables.add('SEED_ALLOW_DEMO_DATA');
    }

    if (
      environment === 'prod' &&
      String(value.CORS_ORIGINS)
        .split(',')
        .map((origin) => origin.trim())
        .includes('*')
    ) {
      invalidVariables.add('CORS_ORIGINS');
    }
  }

  if (invalidVariables.size > 0) {
    throw new Error(
      `Invalid environment variables: ${[...invalidVariables].join(', ')}`,
    );
  }

  return value;
}
