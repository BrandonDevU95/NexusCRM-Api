import 'reflect-metadata';

import { getEnvironmentFile, loadEnvironment } from '../config/env.loader';

import { DataSource } from 'typeorm';
import { createTypeOrmOptions } from './typeorm-options';
import { config as loadDotenv } from 'dotenv';
import { validateEnvironment } from '../config/env.validation';

loadDotenv({ path: getEnvironmentFile(), quiet: true });

const validatedEnvironment = validateEnvironment(process.env);
const appConfig = loadEnvironment(validatedEnvironment);

export default new DataSource(createTypeOrmOptions(appConfig.database));
