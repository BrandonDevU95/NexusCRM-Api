import { Module, type Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import { AppConfigModule } from '../config/config.module';
import type { AppConfig } from '../config/env.types';
import { createTypeOrmOptions } from '../database/typeorm-options';
import { SeedRegistry } from './seed.registry';
import { SeedRunner } from './seed.runner';
import { SeedExecutorService } from './services/seed-executor.service';
import { type SeedOutput, SEED_OUTPUT } from './seed.types';

const dataSourceProvider: Provider = {
  provide: DataSource,
  inject: [ConfigService],
  useFactory: (configService: ConfigService<AppConfig, true>) => {
    const database = configService.getOrThrow('database', { infer: true });
    return new DataSource(createTypeOrmOptions(database));
  },
};

const seedOutput: SeedOutput = {
  info: (message) => process.stdout.write(`${message}\n`),
  error: (message) => process.stderr.write(`${message}\n`),
};

@Module({
  imports: [AppConfigModule],
  providers: [
    dataSourceProvider,
    SeedRegistry,
    SeedExecutorService,
    SeedRunner,
    { provide: SEED_OUTPUT, useValue: seedOutput },
  ],
})
export class SeedModule {}
