import { DataSource } from 'typeorm';

import {
  createTestDataSource,
  getTestConfig,
  resetTestSchema,
} from '../helpers/test-database.helper';

interface RelationRow {
  relationName: string | null;
}

const PLATFORM_TABLES = [
  'system_settings',
  'catalogs',
  'catalog_options',
  'number_sequences',
  'tax_rates',
] as const;

describe('Platform migration history', () => {
  const config = getTestConfig();
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = createTestDataSource(config);
    await dataSource.initialize();
    await resetTestSchema(dataSource, config);
  });

  it('PLAT-MIG-001 applies, reverts, and reapplies the Platform migration', async () => {
    await expect(relationExists('typeorm_migrations')).resolves.toBe(false);

    const appliedMigrations = await dataSource.runMigrations({
      transaction: 'all',
    });

    expect(appliedMigrations.map((migration) => migration.name)).toContain(
      'CreatePlatformConfigurationTables1784182334025',
    );
    await expect(platformTablesExist()).resolves.toBe(true);
    await expect(dataSource.showMigrations()).resolves.toBe(false);

    await dataSource.undoLastMigration({ transaction: 'all' });

    await expect(platformTablesExist()).resolves.toBe(false);
    await expect(relationExists('typeorm_migrations')).resolves.toBe(true);
    await expect(extensionExists('pgcrypto')).resolves.toBe(true);
    await expect(dataSource.showMigrations()).resolves.toBe(true);

    const reappliedMigrations = await dataSource.runMigrations({
      transaction: 'all',
    });

    expect(reappliedMigrations.map((migration) => migration.name)).toEqual([
      'CreatePlatformConfigurationTables1784182334025',
    ]);
    await expect(platformTablesExist()).resolves.toBe(true);
    await expect(dataSource.showMigrations()).resolves.toBe(false);
  });

  afterAll(async () => {
    if (!dataSource?.isInitialized) {
      return;
    }

    try {
      if (await dataSource.showMigrations()) {
        await dataSource.runMigrations({ transaction: 'all' });
      }
    } finally {
      await dataSource.destroy();
    }
  });

  async function platformTablesExist(): Promise<boolean> {
    for (const table of PLATFORM_TABLES) {
      if (!(await relationExists(table))) {
        return false;
      }
    }

    return true;
  }

  async function relationExists(relation: string): Promise<boolean> {
    const [row] = await dataSource.query<RelationRow[]>(
      `SELECT to_regclass($1)::text AS "relationName"`,
      [`public.${relation}`],
    );

    return row?.relationName !== null;
  }

  async function extensionExists(extension: string): Promise<boolean> {
    const rows = await dataSource.query<Array<{ exists: boolean }>>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = $1
      ) AS "exists"`,
      [extension],
    );

    return rows[0]?.exists === true;
  }
});
