import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { CorrelationIdInterceptor } from './common/interceptors/correlation-id.interceptor';
import helmet from 'helmet';
import compression from 'compression';

import type { AppConfig } from './config/env.types';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createCompressionOptions } from './config/compression.config';
import { createHelmetOptions } from './config/helmet.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  const appConfig = config.getOrThrow('app', { infer: true });

  app.use(helmet(createHelmetOptions(appConfig.environment)));

  if (appConfig.compressionEnabled) {
    app.use(compression(createCompressionOptions(appConfig)));
  }

  app.setGlobalPrefix(appConfig.apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        exposeUnsetFields: true,
      },
    }),
  );
  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(appConfig.port, appConfig.host);
}
void bootstrap();
