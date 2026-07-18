import { ConfigService } from '@nestjs/config';
import { DataSource, In, IsNull } from 'typeorm';

import type { AppConfig } from '../../../src/config/env.types';
import { CatalogOption } from '../../../src/platform/entities/catalog-option.entity';
import { Catalog } from '../../../src/platform/entities/catalog.entity';
import { SystemSetting } from '../../../src/platform/entities/system-setting.entity';
import { SeedRegistry } from '../../../src/seed/seed.registry';
import { platformReferenceSeeder } from '../../../src/seed/seeders/platform-reference.seeder';
import { SeedExecutorService } from '../../../src/seed/services/seed-executor.service';
import type {
  SeederDefinition,
  SeedMetrics,
  SeedOutput,
} from '../../../src/seed/seed.types';
import {
  assertConnectedToTestDatabase,
  createTestDataSource,
  getTestConfig,
} from '../../helpers/test-database.helper';

const SYSTEM_SETTING_KEYS = [
  'platform.default_language',
  'platform.default_currency',
  'platform.time_zone',
  'platform.date_format',
] as const;

const GLOBAL_CATALOG_CODES = [
  'languages',
  'currencies',
  'time_zones',
  'date_formats',
] as const;

interface PlatformSeedState {
  settingIds: string[];
  catalogIds: string[];
  optionIds: string[];
}

describe('Platform reference seed (integration)', () => {
  const config = getTestConfig();
  const output: SeedOutput = {
    info: jest.fn(),
    error: jest.fn(),
  };
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = createTestDataSource(config);
    await dataSource.initialize();
    await assertConnectedToTestDatabase(dataSource, config);
    await expect(dataSource.showMigrations()).resolves.toBe(false);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await removePlatformReferenceData();
  });

  it('PLAT-SEED-001 uses the runner manager without nested transactions or query runners', async () => {
    let receivedTransactionalManager = false;
    const contractSeeder: SeederDefinition = {
      name: platformReferenceSeeder.name,
      dataKinds: platformReferenceSeeder.dataKinds,
      dependencies: platformReferenceSeeder.dependencies,
      prepare: () => platformReferenceSeeder.prepare(),
      execute: async (context): Promise<SeedMetrics> => {
        receivedTransactionalManager =
          context.manager.queryRunner?.isTransactionActive === true;
        const nestedTransactionSpy = jest.spyOn(context.manager, 'transaction');
        const queryRunnerSpy = jest.spyOn(
          context.manager.connection,
          'createQueryRunner',
        );

        try {
          const metrics = await platformReferenceSeeder.execute(context);
          expect(nestedTransactionSpy).not.toHaveBeenCalled();
          expect(queryRunnerSpy).not.toHaveBeenCalled();
          return metrics;
        } finally {
          nestedTransactionSpy.mockRestore();
          queryRunnerSpy.mockRestore();
        }
      },
    };
    const transactionSpy = jest.spyOn(dataSource, 'transaction');

    const result = await createExecutor([contractSeeder]).execute({
      moduleName: 'platform',
      dataKind: 'reference',
    });

    expect(receivedTransactionalManager).toBe(true);
    expect(transactionSpy).toHaveBeenCalledTimes(1);
    expect(result.totals).toEqual({ inserted: 17, updated: 0, skipped: 0 });
    transactionSpy.mockRestore();
  });

  it('PLAT-SEED-002 preserves IDs and counts across two runs', async () => {
    const executor = createExecutor([platformReferenceSeeder]);

    const firstResult = await executor.execute({
      moduleName: 'platform',
      dataKind: 'reference',
    });
    const firstState = await readPlatformSeedState();

    const secondResult = await executor.execute({
      moduleName: 'platform',
      dataKind: 'reference',
    });
    const secondState = await readPlatformSeedState();

    expect(firstResult.totals).toEqual({
      inserted: 17,
      updated: 0,
      skipped: 0,
    });
    expect(secondResult.totals).toEqual({
      inserted: 0,
      updated: 0,
      skipped: 17,
    });
    expect(firstState).toEqual(secondState);
    expect(secondState.settingIds).toHaveLength(4);
    expect(secondState.catalogIds).toHaveLength(4);
    expect(secondState.optionIds).toHaveLength(9);
  });

  it('PLAT-SEED-003 rolls back all Platform changes when a later seeder fails', async () => {
    const failingSeeder: SeederDefinition = {
      name: 'platform-verification-failure',
      dataKinds: ['reference'],
      dependencies: ['platform'],
      execute: () => {
        throw new Error('Deliberate Platform seed failure.');
      },
    };
    const executor = createExecutor([platformReferenceSeeder, failingSeeder]);

    await expect(
      executor.execute({ moduleName: 'all', dataKind: 'reference' }),
    ).rejects.toMatchObject({
      phase: 'transaction',
      status: 'rolled_back',
    });

    await expect(readPlatformSeedState()).resolves.toEqual({
      settingIds: [],
      catalogIds: [],
      optionIds: [],
    });
  });

  it('PLAT-SEED-004 keeps the runtime registry reference-only before Customers', () => {
    const registry = new SeedRegistry();

    expect(registry.names()).toEqual(['platform']);
    expect(registry.get('platform')).toMatchObject({
      dataKinds: ['reference'],
      dependencies: [],
    });
  });

  afterAll(async () => {
    if (!dataSource?.isInitialized) {
      return;
    }

    try {
      await removePlatformReferenceData();
    } finally {
      await dataSource.destroy();
    }
  });

  function createExecutor(
    seeders: readonly SeederDefinition[],
  ): SeedExecutorService {
    return new SeedExecutorService(
      dataSource,
      new ConfigService<AppConfig, true>(config),
      new SeedRegistry(seeders),
      output,
    );
  }

  async function readPlatformSeedState(): Promise<PlatformSeedState> {
    const settings = await dataSource.getRepository(SystemSetting).find({
      where: { key: In([...SYSTEM_SETTING_KEYS]) },
      order: { key: 'ASC' },
    });
    const catalogs = await dataSource.getRepository(Catalog).find({
      where: {
        organizationId: IsNull(),
        code: In([...GLOBAL_CATALOG_CODES]),
      },
      relations: { options: true },
      order: { code: 'ASC', options: { code: 'ASC' } },
    });

    return {
      settingIds: settings.map((setting) => setting.id),
      catalogIds: catalogs.map((catalog) => catalog.id),
      optionIds: catalogs.flatMap((catalog) =>
        catalog.options.map((option) => option.id),
      ),
    };
  }

  async function removePlatformReferenceData(): Promise<void> {
    await dataSource.transaction(async (manager) => {
      const catalogs = await manager.find(Catalog, {
        where: {
          organizationId: IsNull(),
          code: In([...GLOBAL_CATALOG_CODES]),
        },
      });
      const catalogIds = catalogs.map((catalog) => catalog.id);

      if (catalogIds.length > 0) {
        await manager.delete(CatalogOption, {
          catalogId: In(catalogIds),
        });
        await manager.delete(Catalog, { id: In(catalogIds) });
      }

      await manager.delete(SystemSetting, {
        key: In([...SYSTEM_SETTING_KEYS]),
      });
    });
  }
});
