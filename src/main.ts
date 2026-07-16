import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { configureHttpApplication } from './app.bootstrap';
import { API_PREFIX } from './common/constants/api.constants';
import type { AppConfig } from './config/env.types';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  const appConfig = config.getOrThrow<AppConfig['app']>('app');
  const bootstrapLogger = new Logger('Bootstrap');

  configureHttpApplication(app);

  bootstrapLogger.log(
    `Application starting on ${appConfig.host}:${appConfig.port} in ${appConfig.environment} mode`,
  );
  bootstrapLogger.log(`Global prefix: ${API_PREFIX}`);

  await app.listen(appConfig.port, appConfig.host);
  bootstrapLogger.log(
    `Application is running on: http://${appConfig.host}:${appConfig.port}/${API_PREFIX}`,
  );
}
void bootstrap();
