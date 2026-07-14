import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import type { AppConfig } from './config/env.types';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);

  app.setGlobalPrefix(config.getOrThrow('app.apiPrefix', { infer: true }));
  await app.listen(
    config.getOrThrow('app.port', { infer: true }),
    config.getOrThrow('app.host', { infer: true }),
  );
}
void bootstrap();
