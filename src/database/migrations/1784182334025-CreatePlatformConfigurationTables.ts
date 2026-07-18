import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePlatformConfigurationTables1784182334025 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'system_settings',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'key',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'value',
            type: 'jsonb',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_public',
            type: 'boolean',
            default: 'false',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        uniques: [
          {
            name: 'UQ_system_settings_key',
            columnNames: ['key'],
          },
        ],
        checks: [
          {
            name: 'CK_system_settings_key_not_blank',
            expression: 'char_length(btrim("key")) > 0',
          },
          {
            name: 'CK_system_settings_key_lowercase',
            expression: '"key" = lower("key")',
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'catalogs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: true,
            default: null,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '80',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true,
            default: null,
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: 'true',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        uniques: [],
        checks: [
          {
            name: 'CK_catalogs_code_not_blank',
            expression: 'char_length(btrim("code")) > 0',
          },
          {
            name: 'CK_catalogs_code_lowercase',
            expression: '"code" = lower("code")',
          },
          {
            name: 'CK_catalogs_name_not_blank',
            expression: 'char_length(btrim("name")) > 0',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'UQ_catalogs_global_code',
        columnNames: ['code'],
        isUnique: true,
        where: '"organization_id" IS NULL',
      }),
    );
    await queryRunner.createIndex(
      'catalogs',
      new TableIndex({
        name: 'UQ_catalogs_organization_id_code',
        columnNames: ['organization_id', 'code'],
        isUnique: true,
        where: '"organization_id" IS NOT NULL',
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'catalog_options',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'catalog_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '80',
            isNullable: false,
          },
          {
            name: 'label',
            type: 'varchar',
            length: '120',
            isNullable: false,
          },
          {
            name: 'sort_order',
            type: 'integer',
            isNullable: false,
            default: 0,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: false,
            default: "'{}'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        uniques: [
          {
            name: 'UQ_catalog_options_catalog_id_code',
            columnNames: ['catalog_id', 'code'],
          },
        ],
        checks: [
          {
            name: 'CK_catalog_options_code_not_blank',
            expression: 'char_length(btrim("code")) > 0',
          },
          {
            name: 'CK_catalog_options_code_lowercase',
            expression: '"code" = lower("code")',
          },
          {
            name: 'CK_catalog_options_label_not_blank',
            expression: 'char_length(btrim("label")) > 0',
          },
          {
            name: 'CK_catalog_options_sort_order_non_negative',
            expression: '"sort_order" >= 0',
          },
          {
            name: 'CK_catalog_options_metadata_is_object',
            expression: 'jsonb_typeof("metadata") = \'object\'',
          },
        ],
      }),
    );
    await queryRunner.createForeignKey(
      'catalog_options',
      new TableForeignKey({
        name: 'FK_catalog_options_catalog_id',
        columnNames: ['catalog_id'],
        referencedTableName: 'catalogs',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'number_sequences',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'prefix',
            type: 'varchar',
            length: '20',
            isNullable: false,
            default: "''",
          },
          {
            name: 'next_value',
            type: 'bigint',
            isNullable: false,
            default: 1,
          },
          {
            name: 'padding',
            type: 'smallint',
            isNullable: false,
            default: 6,
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        uniques: [
          {
            name: 'UQ_number_sequences_organization_id_document_type',
            columnNames: ['organization_id', 'document_type'],
          },
        ],
        checks: [
          {
            name: 'CK_number_sequences_document_type_not_blank',
            expression: 'char_length(btrim("document_type")) > 0',
          },
          {
            name: 'CK_number_sequences_document_type_lowercase',
            expression: '"document_type" = lower("document_type")',
          },
          {
            name: 'CK_number_sequences_prefix_length',
            expression: 'char_length("prefix") <= 20',
          },
          {
            name: 'CK_number_sequences_next_value_positive',
            expression: '"next_value" > 0',
          },
          {
            name: 'CK_number_sequences_padding_range',
            expression: '"padding" BETWEEN 1 AND 18',
          },
        ],
      }),
    );
    await queryRunner.createTable(
      new Table({
        name: 'tax_rates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'organization_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'code',
            type: 'varchar',
            length: '40',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'rate_percent',
            type: 'numeric(5,2)',
            isNullable: false,
          },
          {
            name: 'is_default',
            type: 'boolean',
            isNullable: false,
            default: false,
          },
          {
            name: 'is_active',
            type: 'boolean',
            isNullable: false,
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
        ],
        uniques: [
          {
            name: 'UQ_tax_rates_organization_id_code',
            columnNames: ['organization_id', 'code'],
          },
        ],
        checks: [
          {
            name: 'CK_tax_rates_code_not_blank',
            expression: 'char_length(btrim("code")) > 0',
          },
          {
            name: 'CK_tax_rates_code_lowercase',
            expression: '"code" = lower("code")',
          },
          {
            name: 'CK_tax_rates_name_not_blank',
            expression: 'char_length(btrim("name")) > 0',
          },
          {
            name: 'CK_tax_rates_rate_percent_range',
            expression: '"rate_percent" BETWEEN 0 AND 100',
          },
        ],
      }),
    );
    await queryRunner.createIndex(
      'tax_rates',
      new TableIndex({
        name: 'UQ_tax_rates_organization_active_default',
        columnNames: ['organization_id'],
        isUnique: true,
        where: '"is_default" IS TRUE AND "is_active" IS TRUE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tax_rates');
    await queryRunner.dropTable('number_sequences');
    await queryRunner.dropTable('catalog_options');
    await queryRunner.dropTable('catalogs');
    await queryRunner.dropTable('system_settings');
  }
}
