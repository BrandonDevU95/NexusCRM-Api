import { DataSource } from 'typeorm';

import {
  createTestDataSource,
  getTestConfig,
  resetTestSchema,
} from '../helpers/test-database.helper';

interface ExtensionRow {
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
    await expect(pgcryptoExists()).resolves.toBe(true);
    await expect(dataSource.showMigrations()).resolves.toBe(false);

    // Act: revert the latest real migration
    await dataSource.undoLastMigration({ transaction: 'all' });

    // Assert: it is pending again and its extension disappeared
    await expect(dataSource.showMigrations()).resolves.toBe(true);
    await expect(pgcryptoExists()).resolves.toBe(false);

    // Act: restore the final applied state
    await dataSource.runMigrations({ transaction: 'all' });

    // Assert
    await expect(dataSource.showMigrations()).resolves.toBe(false);
    await expect(pgcryptoExists()).resolves.toBe(true);
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
});
