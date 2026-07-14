import { getEnvironmentFile, loadEnvironment } from './env.loader';

import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { validateEnvironment } from './env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: getEnvironmentFile(),
      validate: validateEnvironment,
      load: [loadEnvironment],
    }),
  ],
})
export class AppConfigModule {}
