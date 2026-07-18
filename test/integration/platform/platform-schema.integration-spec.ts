import { randomUUID } from 'node:crypto';
import { DataSource, EntityManager, QueryFailedError } from 'typeorm';

import cliDataSource from '../../../src/database/data-source';
import { CatalogOption } from '../../../src/platform/entities/catalog-option.entity';
import { Catalog } from '../../../src/platform/entities/catalog.entity';
import { TaxRate } from '../../../src/platform/entities/tax-rate.entity';
import {
  assertConnectedToTestDatabase,
  createTestDataSource,
  getTestConfig,
} from '../../helpers/test-database.helper';

interface PostgresDriverError {
  code?: string;
  constraint?: string;
}

describe('Platform schema constraints (integration)', () => {
  const config = getTestConfig();
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = createTestDataSource(config);
    await dataSource.initialize();
    await assertConnectedToTestDatabase(dataSource, config);
    await expect(dataSource.showMigrations()).resolves.toBe(false);
  });

  it('PLAT-IT-000 keeps runtime and CLI TypeORM options aligned and safe', () => {
    const runtimeOptions = dataSource.options;
    const cliOptions = cliDataSource.options;

    expect(runtimeOptions.type).toBe('postgres');
    expect(cliOptions.type).toBe('postgres');
    if (runtimeOptions.type !== 'postgres' || cliOptions.type !== 'postgres') {
      throw new Error('Platform tests require PostgreSQL DataSource options.');
    }

    expect(runtimeOptions).toMatchObject({
      type: cliOptions.type,
      host: cliOptions.host,
      port: cliOptions.port,
      database: cliOptions.database,
      username: cliOptions.username,
      password: cliOptions.password,
      ssl: cliOptions.ssl,
      logging: cliOptions.logging,
      poolSize: cliOptions.poolSize,
      migrationsTableName: cliOptions.migrationsTableName,
      synchronize: false,
      migrationsRun: false,
    });
  });

  it('PLAT-IT-001 rejects a duplicate normalized global catalog code', async () => {
    await withRollback(async (manager) => {
      await saveCatalog(manager, 'test-global-status');

      await expectPostgresError(
        saveCatalog(manager, 'test-global-status'),
        '23505',
        'UQ_catalogs_global_code',
      );
    });
  });

  it('PLAT-IT-002 scopes option codes by catalog', async () => {
    await withRollback(async (manager) => {
      const firstCatalog = await saveCatalog(manager, 'test-first-catalog');
      const secondCatalog = await saveCatalog(manager, 'test-second-catalog');

      await saveOption(manager, firstCatalog.id, 'active');
      await saveOption(manager, secondCatalog.id, 'active');

      await expect(
        manager.countBy(CatalogOption, { code: 'active' }),
      ).resolves.toBe(2);
      await expectPostgresError(
        saveOption(manager, firstCatalog.id, 'active'),
        '23505',
        'UQ_catalog_options_catalog_id_code',
      );
    });
  });

  it('PLAT-IT-003 restricts deleting a catalog that still has options', async () => {
    await withRollback(async (manager) => {
      const catalog = await saveCatalog(manager, 'test-restricted-catalog');
      await saveOption(manager, catalog.id, 'active');

      await expectPostgresError(
        manager.delete(Catalog, { id: catalog.id }),
        '23503',
        'FK_catalog_options_catalog_id',
      );
    });
  });

  it.each(['-0.01', '100.01'])(
    'PLAT-IT-004 rejects tax rate %s outside the inclusive 0-100 range',
    async (ratePercent) => {
      await withRollback(async (manager) => {
        await expectPostgresError(
          manager.insert(TaxRate, {
            organizationId: randomUUID(),
            code: `test-rate-${ratePercent.replace('.', '-')}`,
            name: 'Test invalid rate',
            ratePercent,
            isDefault: false,
            isActive: true,
          }),
          '23514',
          'CK_tax_rates_rate_percent_range',
        );
      });
    },
  );

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  async function withRollback(
    work: (manager: EntityManager) => Promise<void>,
  ): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await work(queryRunner.manager);
    } finally {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
  }
});

async function saveCatalog(
  manager: EntityManager,
  code: string,
): Promise<Catalog> {
  return manager.save(
    manager.create(Catalog, {
      organizationId: null,
      code,
      name: `Catalog ${code}`,
      description: null,
      isActive: true,
    }),
  );
}

async function saveOption(
  manager: EntityManager,
  catalogId: string,
  code: string,
): Promise<CatalogOption> {
  return manager.save(
    manager.create(CatalogOption, {
      catalogId,
      code,
      label: `Option ${code}`,
      sortOrder: 0,
      metadata: {},
      isActive: true,
    }),
  );
}

async function expectPostgresError(
  operation: Promise<unknown>,
  code: string,
  constraint: string,
): Promise<void> {
  let operationError: unknown;

  try {
    await operation;
  } catch (error) {
    operationError = error;
  }

  expect(operationError).toBeInstanceOf(QueryFailedError);
  const driverError = (
    operationError as QueryFailedError & {
      driverError: PostgresDriverError;
    }
  ).driverError;
  expect(driverError.code).toBe(code);
  expect(driverError.constraint).toBe(constraint);
}
