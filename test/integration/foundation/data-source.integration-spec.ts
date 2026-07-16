import { DataSource } from 'typeorm';

import {
  assertConnectedToTestDatabase,
  createTestDataSource,
  getTestConfig,
} from '../../helpers/test-database.helper';

describe('Foundation DataSource (integration)', () => {
  const config = getTestConfig();

  it('FND-IT-001 connects exclusively to the PostgreSQL test database', async () => {
    // Arrange
    const dataSource = createTestDataSource(config);

    try {
      // Act
      await dataSource.initialize();

      // Assert
      await expect(
        assertConnectedToTestDatabase(dataSource, config),
      ).resolves.toBeUndefined();
      expect(dataSource.options.database).not.toBe(
        config.compose.postgres.database,
      );
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  });

  it('FND-IT-002 keeps synchronize and automatic migrations disabled', async () => {
    // Arrange
    const dataSource = createTestDataSource(config);

    try {
      // Act
      await dataSource.initialize();

      // Assert
      expect(dataSource.options.synchronize).toBe(false);
      expect(dataSource.options.migrationsRun).toBe(false);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }
  });

  it('FND-IT-003 rejects invalid credentials without exposing the password', async () => {
    // Arrange
    const invalidPassword = 'temporary-invalid-password-123';
    const dataSource = createTestDataSource(config, {
      password: invalidPassword,
    });

    // Act
    let initializationError: unknown;
    try {
      await dataSource.initialize();
    } catch (error) {
      initializationError = error;
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }

    // Assert
    expect(initializationError).toBeInstanceOf(Error);
    expect(String(initializationError)).not.toContain(invalidPassword);
    expect(dataSource.isInitialized).toBe(false);
  });

  it('FND-IT-004 destroys every initialized DataSource', async () => {
    // Arrange
    const dataSource: DataSource = createTestDataSource(config);

    // Act
    try {
      await dataSource.initialize();
      expect(dataSource.isInitialized).toBe(true);
    } finally {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }

    // Assert
    expect(dataSource.isInitialized).toBe(false);
  });
});
