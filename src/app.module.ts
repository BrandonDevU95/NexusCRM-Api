import type { AppConfig } from './config/env.types';
import { AppConfigModule } from './config/config.module';
import { ConfigService } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { Module } from '@nestjs/common';
import { PlatformModule } from './platform/platform.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createTypeOrmOptions } from './database/typeorm-options';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const database = configService.getOrThrow('database', {
          infer: true,
        });

        return createTypeOrmOptions(database);
      },
    }),
    HealthModule,
    PlatformModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
