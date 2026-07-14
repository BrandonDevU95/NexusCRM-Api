import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { loadEnvironment } from './env.loader';
import { validateEnvironment } from './env.validation';

const environmentFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: environmentFile,
      validate: validateEnvironment,
      load: [loadEnvironment],
    }),
  ],
})
export class AppConfigModule {}
