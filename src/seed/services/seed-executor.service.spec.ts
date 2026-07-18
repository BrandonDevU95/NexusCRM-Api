import { ConfigService } from '@nestjs/config';
import { DataSource, type EntityManager } from 'typeorm';

import type { AppConfig } from '../../config/env.types';
import { SeedRegistry } from '../seed.registry';
import {
  type SeederDefinition,
  SeedExecutionError,
  type SeedMetrics,
  type SeedOutput,
} from '../seed.types';
import { SeedExecutorService } from './seed-executor.service';

const ZERO_METRICS: SeedMetrics = { inserted: 0, updated: 0, skipped: 0 };

interface DataSourceDouble {
  dataSource: DataSource;
  initialize: jest.Mock;
  showMigrations: jest.Mock;
  transaction: jest.Mock;
  destroy: jest.Mock;
  query: jest.Mock;
  manager: EntityManager;
}

function appConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const config: AppConfig = {
    app: {
      environment: 'dev',
      host: 'localhost',
      port: 3000,
      corsOrigins: ['http://localhost:3000'],
      compressionEnabled: true,
      compressionThresholdBytes: 2048,
      compressionLevel: 4,
      version: '1.0.0',
      swaggerEnabled: true,
      swaggerPath: 'docs',
    },
    database: {
      host: 'localhost',
      port: 5432,
      name: 'nexuscrm',
      user: 'nexuscrm_app',
      password: 'not-used-by-unit-tests',
      ssl: false,
      logging: false,
      poolSize: 10,
      migrationsRun: false,
      synchronize: false,
      testName: 'nexuscrm_test',
    },
    compose: {
      postgres: {
        image: 'postgres',
        containerName: 'postgres',
        hostPort: 5432,
        containerPort: 5432,
        database: 'nexuscrm',
        user: 'nexuscrm_app',
        password: 'not-used-by-unit-tests',
        volumeName: 'postgres-data',
      },
      testPostgres: {
        containerName: 'postgres-test',
        hostPort: 5433,
        database: 'nexuscrm_test',
        user: 'nexuscrm_test',
        password: 'not-used-by-unit-tests',
        volumeName: 'postgres-test-data',
      },
      pgAdmin: {
        image: 'pgadmin',
        containerName: 'pgadmin',
        hostPort: 5050,
        defaultEmail: 'admin@example.com',
        defaultPassword: 'not-used-by-unit-tests',
        volumeName: 'pgadmin-data',
      },
    },
    seed: {
      randomSeed: 42,
      batchSize: 100,
      allowDemoData: true,
    },
  };

  return {
    ...config,
    ...overrides,
    app: { ...config.app, ...overrides.app },
    database: { ...config.database, ...overrides.database },
    compose: { ...config.compose, ...overrides.compose },
    seed: { ...config.seed, ...overrides.seed },
  };
}

function configService(config: AppConfig): ConfigService<AppConfig, true> {
  return {
    getOrThrow: jest.fn((key: keyof AppConfig) => config[key]),
  } as unknown as ConfigService<AppConfig, true>;
}

function dataSourceDouble(pendingMigrations = false): DataSourceDouble {
  const query = jest.fn().mockResolvedValue(undefined);
  const manager = { query } as unknown as EntityManager;
  const double = {
    isInitialized: false,
    initialize: jest.fn(),
    showMigrations: jest.fn().mockResolvedValue(pendingMigrations),
    transaction: jest.fn(),
    destroy: jest.fn().mockResolvedValue(undefined),
  };
  double.initialize.mockImplementation(() => {
    double.isInitialized = true;
    return Promise.resolve(double);
  });
  double.transaction.mockImplementation(
    async (work: (transactionManager: EntityManager) => Promise<unknown>) =>
      work(manager),
  );

  return {
    dataSource: double as unknown as DataSource,
    initialize: double.initialize,
    showMigrations: double.showMigrations,
    transaction: double.transaction,
    destroy: double.destroy,
    query,
    manager,
  };
}

function outputDouble(): SeedOutput {
  return { info: jest.fn(), error: jest.fn() };
}

function seeder(
  name: string,
  dependencies: readonly string[],
  execute: SeederDefinition['execute'] = () => ZERO_METRICS,
  prepare?: SeederDefinition['prepare'],
): SeederDefinition {
  return {
    name,
    dataKinds: ['reference', 'demo'],
    dependencies,
    prepare,
    execute,
  };
}

function executor(
  registry: SeedRegistry,
  source: DataSourceDouble,
  config: AppConfig = appConfig(),
): SeedExecutorService {
  return new SeedExecutorService(
    source.dataSource,
    configService(config),
    registry,
    outputDouble(),
  );
}

describe('SeedExecutorService', () => {
  it('commits an empty registry with a shared transaction, lock, and zero metrics', async () => {
    const source = dataSourceDouble();
    const service = executor(new SeedRegistry([]), source);

    const result = await service.execute({
      moduleName: 'all',
      dataKind: 'reference',
    });

    expect(source.initialize).toHaveBeenCalledTimes(1);
    expect(source.showMigrations).toHaveBeenCalledTimes(1);
    expect(source.transaction).toHaveBeenCalledTimes(1);
    expect(source.query).toHaveBeenCalledWith(
      'SELECT pg_advisory_xact_lock($1)',
      [expect.any(Number)],
    );
    expect(result.modules).toEqual([]);
    expect(result.moduleResults).toEqual([]);
    expect(result.totals).toEqual(ZERO_METRICS);
    expect(result.status).toBe('committed');
  });

  it('orders transitive dependencies once and shares one EntityManager', async () => {
    const source = dataSourceDouble();
    const executionOrder: string[] = [];
    const managers: EntityManager[] = [];
    const definitions = [
      seeder('organizations', ['platform'], ({ manager }) => {
        executionOrder.push('organizations');
        managers.push(manager);
        return { inserted: 2, updated: 0, skipped: 0 };
      }),
      seeder('platform', [], ({ manager }) => {
        executionOrder.push('platform');
        managers.push(manager);
        return { inserted: 1, updated: 1, skipped: 0 };
      }),
      seeder('security', ['platform'], ({ manager }) => {
        executionOrder.push('security');
        managers.push(manager);
        return { inserted: 0, updated: 0, skipped: 3 };
      }),
      seeder('customers', ['organizations', 'security'], ({ manager }) => {
        executionOrder.push('customers');
        managers.push(manager);
        return ZERO_METRICS;
      }),
    ];
    const service = executor(new SeedRegistry(definitions), source);

    const result = await service.execute({
      moduleName: 'customers',
      dataKind: 'reference',
    });

    expect(executionOrder).toEqual([
      'platform',
      'organizations',
      'security',
      'customers',
    ]);
    expect(managers).toEqual([
      source.manager,
      source.manager,
      source.manager,
      source.manager,
    ]);
    expect(source.transaction).toHaveBeenCalledTimes(1);
    expect(result.totals).toEqual({ inserted: 3, updated: 1, skipped: 3 });
  });

  it('prepares all datasets before opening the transaction', async () => {
    const source = dataSourceDouble();
    const events: string[] = [];
    source.transaction.mockImplementation(
      async (work: (manager: EntityManager) => Promise<unknown>) => {
        events.push('transaction');
        return work(source.manager);
      },
    );
    const registry = new SeedRegistry([
      seeder(
        'platform',
        [],
        () => {
          events.push('execute');
          return ZERO_METRICS;
        },
        () => {
          events.push('prepare');
        },
      ),
    ]);

    await executor(registry, source).execute({
      moduleName: 'all',
      dataKind: 'reference',
    });

    expect(events).toEqual(['prepare', 'transaction', 'execute']);
  });

  it('rejects an unknown name before connecting or opening a transaction', async () => {
    const source = dataSourceDouble();
    const service = executor(new SeedRegistry([]), source);

    await expect(
      service.execute({ moduleName: 'users', dataKind: 'demo' }),
    ).rejects.toMatchObject({
      phase: 'arguments',
      status: 'not_started',
      message: 'Unknown seed module "users". Valid modules: (none).',
    });
    expect(source.initialize).not.toHaveBeenCalled();
    expect(source.transaction).not.toHaveBeenCalled();
  });

  it('rejects missing dependencies and cycles before connecting', async () => {
    const missingSource = dataSourceDouble();
    await expect(
      executor(
        new SeedRegistry([seeder('organizations', ['platform'])]),
        missingSource,
      ).execute({ moduleName: 'all', dataKind: 'reference' }),
    ).rejects.toThrow('depends on unregistered module "platform"');
    expect(missingSource.initialize).not.toHaveBeenCalled();

    const cycleSource = dataSourceDouble();
    await expect(
      executor(
        new SeedRegistry([
          seeder('platform', ['security']),
          seeder('security', ['platform']),
        ]),
        cycleSource,
      ).execute({ moduleName: 'all', dataKind: 'reference' }),
    ).rejects.toThrow('platform -> security -> platform');
    expect(cycleSource.initialize).not.toHaveBeenCalled();
  });

  it('blocks execution when migrations are pending', async () => {
    const source = dataSourceDouble(true);

    await expect(
      executor(new SeedRegistry([]), source).execute({
        moduleName: 'all',
        dataKind: 'reference',
      }),
    ).rejects.toMatchObject({
      phase: 'migrations',
      message:
        'Pending migrations detected. Run "pnpm migration:run" before seeding.',
    });
    expect(source.transaction).not.toHaveBeenCalled();
  });

  it('always blocks demo data in prod before connecting', async () => {
    const source = dataSourceDouble();
    const prodConfig = appConfig({
      app: { ...appConfig().app, environment: 'prod' },
      seed: { randomSeed: 42, batchSize: 100, allowDemoData: true },
    });

    await expect(
      executor(new SeedRegistry([]), source, prodConfig).execute({
        moduleName: 'all',
        dataKind: 'demo',
      }),
    ).rejects.toMatchObject({
      phase: 'environment',
      message: 'Demo seed data is always blocked in prod.',
    });
    expect(source.initialize).not.toHaveBeenCalled();
  });

  it('requires explicit demo authorization and a positive random seed', async () => {
    const unauthorizedSource = dataSourceDouble();
    await expect(
      executor(
        new SeedRegistry([]),
        unauthorizedSource,
        appConfig({
          seed: { randomSeed: 42, batchSize: 100, allowDemoData: false },
        }),
      ).execute({ moduleName: 'all', dataKind: 'demo' }),
    ).rejects.toThrow('SEED_ALLOW_DEMO_DATA=true');
    expect(unauthorizedSource.initialize).not.toHaveBeenCalled();

    const noRandomSeedSource = dataSourceDouble();
    await expect(
      executor(
        new SeedRegistry([]),
        noRandomSeedSource,
        appConfig({
          seed: {
            randomSeed: undefined,
            batchSize: 100,
            allowDemoData: true,
          },
        }),
      ).execute({ moduleName: 'all', dataKind: 'demo' }),
    ).rejects.toThrow('positive SEED_RANDOM_SEED');
    expect(noRandomSeedSource.initialize).not.toHaveBeenCalled();
  });

  it('reports rolled_back when a module fails inside the shared transaction', async () => {
    const source = dataSourceDouble();
    const service = executor(
      new SeedRegistry([
        seeder('platform', [], () => {
          throw new Error('technical detail');
        }),
      ]),
      source,
    );

    await expect(
      service.execute({ moduleName: 'all', dataKind: 'reference' }),
    ).rejects.toEqual(
      expect.objectContaining<Partial<SeedExecutionError>>({
        phase: 'transaction',
        status: 'rolled_back',
        message: 'Seed transaction failed and was rolled back.',
      }),
    );
  });

  it('destroys an initialized DataSource when the context closes', async () => {
    const source = dataSourceDouble();
    const service = executor(new SeedRegistry([]), source);
    await service.execute({ moduleName: 'all', dataKind: 'reference' });

    await service.onModuleDestroy();

    expect(source.destroy).toHaveBeenCalledTimes(1);
  });
});
