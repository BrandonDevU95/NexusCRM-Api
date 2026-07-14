import type { AppConfig } from '../config/env.types';
import type { DataSourceOptions } from 'typeorm';
import { join } from 'node:path';

export function createTypeOrmOptions(
  database: AppConfig['database'],
): DataSourceOptions {
  const fileExtension = __filename.endsWith('.ts') ? 'ts' : 'js';

  return {
    type: 'postgres',
    host: database.host,
    port: database.port,
    database: database.name,
    username: database.user,
    password: database.password,
    ssl: database.ssl,
    logging: database.logging,
    poolSize: database.poolSize,

    synchronize: false,
    migrationsRun: false,

    entities: [join(__dirname, '..', `**/*.entity.${fileExtension}`)],
    migrations: [join(__dirname, 'migrations', `*.${fileExtension}`)],
    migrationsTableName: 'typeorm_migrations',
  };
}
