import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import {
  correlationIdMiddleware,
  CorrelationIdInterceptor,
} from './common/interceptors/correlation-id.interceptor';
import { API_PREFIX } from './common/constants/api.constants';
import helmet from 'helmet';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';

import type { AppConfig } from './config/env.types';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { createCompressionOptions } from './config/compression.config';
import {
  createHelmetOptions,
  createSwaggerHelmetOptions,
} from './config/helmet.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<AppConfig, true>);
  const appConfig = config.getOrThrow<AppConfig['app']>('app');

  const apiHelmet = helmet(createHelmetOptions(appConfig.environment));
  const swaggerHelmet = helmet(
    createSwaggerHelmetOptions(appConfig.environment),
  );
  const swaggerPath = `/${appConfig.swaggerPath}`;

  app.use((request: Request, response: Response, next: NextFunction): void => {
    const isSwaggerRequest =
      appConfig.swaggerEnabled &&
      (request.path === swaggerPath ||
        request.path.startsWith(`${swaggerPath}/`));

    (isSwaggerRequest ? swaggerHelmet : apiHelmet)(request, response, next);
  });

  if (appConfig.compressionEnabled) {
    app.use(compression(createCompressionOptions(appConfig)));
  }

  app.setGlobalPrefix(API_PREFIX);
  app.use(correlationIdMiddleware);
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

  if (appConfig.swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('NexusCRM API')
      .setDescription('Backend API for NexusCRM.')
      .setVersion(appConfig.version)
      .addServer(`/${API_PREFIX}`)
      .addTag('health', 'Application readiness checks')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      ignoreGlobalPrefix: true,
    });

    SwaggerModule.setup(appConfig.swaggerPath, app, document);
  }

  await app.listen(appConfig.port, appConfig.host);
}
void bootstrap();
