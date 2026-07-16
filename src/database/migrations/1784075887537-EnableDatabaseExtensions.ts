import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableDatabaseExtensions1784075887537 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Do not add CASCADE: PostgreSQL must protect dependent objects from removal.
    await queryRunner.query('DROP EXTENSION IF EXISTS "pgcrypto"');
  }
}
