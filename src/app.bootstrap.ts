import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

import { API_PREFIX } from './common/constants/api.constants';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import {
  correlationIdMiddleware,
  CorrelationIdInterceptor,
} from './common/interceptors/correlation-id.interceptor';
import { createCompressionOptions } from './config/compression.config';
import type { AppConfig } from './config/env.types';
import {
  createHelmetOptions,
  createSwaggerHelmetOptions,
} from './config/helmet.config';

export function configureHttpApplication(app: NestExpressApplication): void {
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
}
