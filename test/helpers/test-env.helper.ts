import { config as loadDotenv } from 'dotenv';
import { resolve } from 'node:path';

import { validateEnvironment } from '../../src/config/env.validation';

const TEST_ENVIRONMENT_FILE = resolve(process.cwd(), '.env.test');

export function loadTestEnvironment(): NodeJS.ProcessEnv {
  const result = loadDotenv({
    path: TEST_ENVIRONMENT_FILE,
    override: true,
    quiet: true,
  });

  if (result.error) {
    throw new Error('Could not load the required .env.test file.', {
      cause: result.error,
    });
  }

  delete process.env.NEXUSCRM_SEED_ENV_FILE;
  validateEnvironment(process.env);

  return process.env;
}

loadTestEnvironment();
