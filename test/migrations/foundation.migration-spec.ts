import { DataSource } from 'typeorm';

import {
  createTestDataSource,
  getTestConfig,
  resetTestSchema,
} from '../helpers/test-database.helper';

interface ExtensionRow {
  exists: boolean;
}

interface TableRow {
  exists: boolean;
}

interface RelationRow {
  migrationTable: string | null;
}

describe('Foundation migration history', () => {
  const config = getTestConfig();
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = createTestDataSource(config);
    await dataSource.initialize();
    await resetTestSchema(dataSource, config);
  });

  it('applies, reverts, and reapplies the real migration history', async () => {
    // Arrange
    const [initialState] = await dataSource.query<RelationRow[]>(
      `SELECT to_regclass('public.typeorm_migrations')::text AS "migrationTable"`,
    );
    expect(initialState?.migrationTable).toBeNull();

    // Act: apply every migration
    const appliedMigrations = await dataSource.runMigrations({
      transaction: 'all',
    });

    // Assert: the history and pgcrypto exist
    expect(appliedMigrations.map((migration) => migration.name)).toContain(
      'EnableDatabaseExtensions1784075887537',
    );
    expect(appliedMigrations.map((migration) => migration.name)).toContain(
      'CreatePlatformConfigurationTables1784182334025',
    );
    expect(appliedMigrations.map((migration) => migration.name)).toContain(
      'CreateAuthenticationSchema1784519690916',
    );
    await expect(pgcryptoExists()).resolves.toBe(true);
    await expect(platformTablesExist()).resolves.toBe(true);
    await expect(authenticationTablesExist()).resolves.toBe(true);
    await expect(dataSource.showMigrations()).resolves.toBe(false);

    // Act: revert the authentication schema migration
    await dataSource.undoLastMigration({ transaction: 'all' });

    // Assert: authentication disappears while Platform remains intact
    await expect(dataSource.showMigrations()).resolves.toBe(true);
    await expect(authenticationTablesExist()).resolves.toBe(false);
    await expect(platformTablesExist()).resolves.toBe(true);
    await expect(pgcryptoExists()).resolves.toBe(true);

    // Act: revert the platform schema migration
    await dataSource.undoLastMigration({ transaction: 'all' });

    // Assert: platform tables disappear, while their prerequisite remains
    await expect(platformTablesExist()).resolves.toBe(false);
    await expect(pgcryptoExists()).resolves.toBe(true);

    // Act: revert the extensions migration
    await dataSource.undoLastMigration({ transaction: 'all' });

    // Assert: its extension disappears too
    await expect(pgcryptoExists()).resolves.toBe(false);

    // Act: restore the final applied state
    await dataSource.runMigrations({ transaction: 'all' });

    // Assert
    await expect(dataSource.showMigrations()).resolves.toBe(false);
    await expect(pgcryptoExists()).resolves.toBe(true);
    await expect(platformTablesExist()).resolves.toBe(true);
    await expect(authenticationTablesExist()).resolves.toBe(true);
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

  async function pgcryptoExists(): Promise<boolean> {
    const [row] = await dataSource.query<ExtensionRow[]>(
      `SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
      ) AS "exists"`,
    );

    return row?.exists === true;
  }

  async function platformTablesExist(): Promise<boolean> {
    const [row] = await dataSource.query<TableRow[]>(
      `SELECT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relkind = 'r'
          AND relname = 'catalog_options'
      ) AS "exists"`,
    );

    return row?.exists === true;
  }

  async function authenticationTablesExist(): Promise<boolean> {
    const [row] = await dataSource.query<TableRow[]>(
      `SELECT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relkind = 'r'
          AND relname = 'refresh_tokens'
      ) AS "exists"`,
    );

    return row?.exists === true;
  }
});
