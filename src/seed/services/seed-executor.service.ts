import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

import type { AppConfig } from '../../config/env.types';
import { SeedRegistry } from '../seed.registry';
import {
  type SeederDefinition,
  SeedExecutionError,
  type SeedMetrics,
  type SeedModuleResult,
  type SeedOutput,
  SEED_OUTPUT,
  type SeedPreparationContext,
  type SeedRunRequest,
  type SeedRunResult,
} from '../seed.types';

const SEED_ADVISORY_LOCK_ID = 824_713_052;
const EMPTY_METRICS: Readonly<SeedMetrics> = {
  inserted: 0,
  updated: 0,
  skipped: 0,
};

@Injectable()
export class SeedExecutorService implements OnModuleDestroy {
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly registry: SeedRegistry,
    @Inject(SEED_OUTPUT) private readonly output: SeedOutput,
  ) {}

  async onModuleDestroy(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async execute(request: SeedRunRequest): Promise<SeedRunResult> {
    const startedAt = Date.now();
    const seeders = this.resolveExecutionOrder(request.moduleName);
    this.validateDataKind(seeders, request.dataKind);

    const config: AppConfig = {
      app: this.configService.getOrThrow('app', { infer: true }),
      database: this.configService.getOrThrow('database', { infer: true }),
      compose: this.configService.getOrThrow('compose', { infer: true }),
      seed: this.configService.getOrThrow('seed', { infer: true }),
    };
    const context = this.createPreparationContext(config, request);
    this.assertEnvironmentAllowed(config, context);

    this.output.info(
      `Seed target: environment=${context.environment} database=${context.databaseName}`,
    );
    if (request.dataKind === 'demo') {
      this.output.info(`Random seed: ${context.randomSeed}`);
    }

    await this.assertMigrationsAreCurrent();
    await this.prepareSeeders(seeders, context);

    let moduleResults: SeedModuleResult[];
    try {
      moduleResults = await this.dataSource.transaction(async (manager) => {
        await manager.query('SELECT pg_advisory_xact_lock($1)', [
          SEED_ADVISORY_LOCK_ID,
        ]);

        const results: SeedModuleResult[] = [];
        for (const seeder of seeders) {
          const metrics = await seeder.execute({ ...context, manager });
          this.assertValidMetrics(seeder.name, metrics);
          results.push({ module: seeder.name, ...metrics });
        }

        return results;
      });
    } catch (error) {
      throw new SeedExecutionError(
        'transaction',
        'rolled_back',
        'Seed transaction failed and was rolled back.',
        { cause: error },
      );
    }

    return {
      environment: context.environment,
      databaseName: context.databaseName,
      dataKind: context.dataKind,
      randomSeed: context.randomSeed,
      modules: seeders.map((seeder) => seeder.name),
      moduleResults,
      totals: moduleResults.reduce<SeedMetrics>(
        (totals, result) => ({
          inserted: totals.inserted + result.inserted,
          updated: totals.updated + result.updated,
          skipped: totals.skipped + result.skipped,
        }),
        { ...EMPTY_METRICS },
      ),
      durationMs: Date.now() - startedAt,
      status: 'committed',
    };
  }

  private resolveExecutionOrder(moduleName: string): SeederDefinition[] {
    const seeders = this.registry.list();
    const names = new Set(seeders.map((seeder) => seeder.name));

    for (const seeder of seeders) {
      for (const dependency of seeder.dependencies) {
        if (!names.has(dependency)) {
          throw new SeedExecutionError(
            'arguments',
            'not_started',
            `Seed module "${seeder.name}" depends on unregistered module "${dependency}".`,
          );
        }
      }
    }

    if (moduleName !== 'all' && !names.has(moduleName)) {
      const validNames = this.registry.names();
      throw new SeedExecutionError(
        'arguments',
        'not_started',
        `Unknown seed module "${moduleName}". Valid modules: ${validNames.length > 0 ? validNames.join(', ') : '(none)'}.`,
      );
    }

    const ordered: SeederDefinition[] = [];
    const state = new Map<string, 'visiting' | 'visited'>();
    const path: string[] = [];

    const visit = (seeder: SeederDefinition): void => {
      const currentState = state.get(seeder.name);
      if (currentState === 'visited') {
        return;
      }
      if (currentState === 'visiting') {
        const cycleStart = path.indexOf(seeder.name);
        const cycle = [...path.slice(cycleStart), seeder.name].join(' -> ');
        throw new SeedExecutionError(
          'arguments',
          'not_started',
          `Seed dependency cycle detected: ${cycle}.`,
        );
      }

      state.set(seeder.name, 'visiting');
      path.push(seeder.name);
      for (const dependencyName of seeder.dependencies) {
        visit(this.registry.get(dependencyName)!);
      }
      path.pop();
      state.set(seeder.name, 'visited');
      ordered.push(seeder);
    };

    for (const seeder of seeders) {
      visit(seeder);
    }

    if (moduleName === 'all') {
      return ordered;
    }

    const requiredNames = new Set<string>();
    const includeDependencies = (name: string): void => {
      if (requiredNames.has(name)) {
        return;
      }
      requiredNames.add(name);
      for (const dependency of this.registry.get(name)!.dependencies) {
        includeDependencies(dependency);
      }
    };
    includeDependencies(moduleName);

    return ordered.filter((seeder) => requiredNames.has(seeder.name));
  }

  private validateDataKind(
    seeders: readonly SeederDefinition[],
    dataKind: SeedRunRequest['dataKind'],
  ): void {
    const incompatible = seeders
      .filter((seeder) => !seeder.dataKinds.includes(dataKind))
      .map((seeder) => seeder.name);

    if (incompatible.length > 0) {
      throw new SeedExecutionError(
        'arguments',
        'not_started',
        `Data kind "${dataKind}" is not supported by: ${incompatible.join(', ')}.`,
      );
    }
  }

  private createPreparationContext(
    config: AppConfig,
    request: SeedRunRequest,
  ): SeedPreparationContext {
    return {
      dataKind: request.dataKind,
      environment: config.app.environment,
      databaseName: config.database.name,
      randomSeed: config.seed.randomSeed,
      batchSize: config.seed.batchSize,
    };
  }

  private assertEnvironmentAllowed(
    config: AppConfig,
    context: SeedPreparationContext,
  ): void {
    const expectedDatabaseName =
      context.environment === 'test'
        ? config.database.testName
        : config.compose.postgres.database;

    if (
      context.databaseName.trim().length === 0 ||
      context.databaseName !== expectedDatabaseName
    ) {
      throw new SeedExecutionError(
        'environment',
        'not_started',
        `Database name is not allowed for environment "${context.environment}".`,
      );
    }

    if (context.dataKind !== 'demo') {
      return;
    }

    if (context.environment === 'prod') {
      throw new SeedExecutionError(
        'environment',
        'not_started',
        'Demo seed data is always blocked in prod.',
      );
    }

    if (!config.seed.allowDemoData) {
      throw new SeedExecutionError(
        'environment',
        'not_started',
        'Demo seed data requires SEED_ALLOW_DEMO_DATA=true.',
      );
    }

    if (
      context.randomSeed === undefined ||
      !Number.isSafeInteger(context.randomSeed) ||
      context.randomSeed < 1
    ) {
      throw new SeedExecutionError(
        'environment',
        'not_started',
        'Demo seed data requires a positive SEED_RANDOM_SEED.',
      );
    }
  }

  private async assertMigrationsAreCurrent(): Promise<void> {
    try {
      if (!this.dataSource.isInitialized) {
        await this.dataSource.initialize();
      }

      if (await this.dataSource.showMigrations()) {
        throw new SeedExecutionError(
          'migrations',
          'not_started',
          'Pending migrations detected. Run "pnpm migration:run" before seeding.',
        );
      }
    } catch (error) {
      if (error instanceof SeedExecutionError) {
        throw error;
      }

      throw new SeedExecutionError(
        'migrations',
        'not_started',
        'Could not verify database migrations.',
        { cause: error },
      );
    }
  }

  private async prepareSeeders(
    seeders: readonly SeederDefinition[],
    context: SeedPreparationContext,
  ): Promise<void> {
    try {
      for (const seeder of seeders) {
        await seeder.prepare?.(context);
      }
    } catch (error) {
      throw new SeedExecutionError(
        'preparation',
        'not_started',
        'Seed dataset preparation failed before the transaction started.',
        { cause: error },
      );
    }
  }

  private assertValidMetrics(moduleName: string, metrics: SeedMetrics): void {
    const values = [metrics.inserted, metrics.updated, metrics.skipped];
    if (values.some((value) => !Number.isSafeInteger(value) || value < 0)) {
      throw new Error(`Seed module "${moduleName}" reported invalid metrics.`);
    }
  }
}
