import 'reflect-metadata';

import type { INestApplicationContext } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { config as loadDotenv } from 'dotenv';

import { SEED_ENVIRONMENT_FILE_VARIABLE } from '../config/env.loader';
import { getSeedEnvironmentFile, SeedRunner } from './seed.runner';

async function bootstrap(): Promise<void> {
  let application: INestApplicationContext | undefined;

  try {
    const arguments_ = process.argv.slice(2);
    const environmentFile = getSeedEnvironmentFile(arguments_);
    process.env[SEED_ENVIRONMENT_FILE_VARIABLE] = environmentFile;

    const dotenvResult = loadDotenv({ path: environmentFile, quiet: true });
    if (dotenvResult.error) {
      throw new Error(
        `Could not load allowed environment file ${environmentFile}.`,
      );
    }

    // Loading this module earlier would make ConfigModule read the wrong env file.
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { SeedModule } =
      require('./seed.module') as typeof import('./seed.module');
    /* eslint-enable @typescript-eslint/no-require-imports */
    application = await NestFactory.createApplicationContext(SeedModule, {
      abortOnError: false,
      logger: false,
    });

    process.exitCode = await application.get(SeedRunner).run(arguments_);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Seed CLI could not start due to an unknown error.';
    process.stderr.write(`Seed bootstrap failed: ${message}\n`);
    process.exitCode = 1;
  } finally {
    if (application !== undefined) {
      try {
        await application.close();
      } catch {
        process.stderr.write(
          'Seed application context could not close cleanly.\n',
        );
        process.exitCode = 1;
      }
    }
  }
}

void bootstrap();
