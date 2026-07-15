import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

import { AppConfig } from '../config/env.types';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  constructor(
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly healthCheckService: HealthCheckService,
    private readonly typeOrmHealthIndicator: TypeOrmHealthIndicator,
  ) {}

  async healthCheck() {
    const app = this.configService.getOrThrow('app', { infer: true });

    const result = await this.healthCheckService.check([
      () =>
        this.typeOrmHealthIndicator.pingCheck('database', { timeout: 1_000 }),
    ]);

    return {
      status: 'ok',
      service: 'NexusCRM API',
      version: app.version,
      timestamp: new Date().toISOString(),
      database: result.details.database.status,
    };
  }
}
