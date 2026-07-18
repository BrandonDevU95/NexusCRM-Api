import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Catalog } from './catalog.entity';

@Check('CK_catalog_options_code_not_blank', 'char_length(btrim("code")) > 0')
@Check('CK_catalog_options_code_lowercase', '"code" = lower("code")')
@Check('CK_catalog_options_label_not_blank', 'char_length(btrim("label")) > 0')
@Check('CK_catalog_options_sort_order_non_negative', '"sort_order" >= 0')
@Check(
  'CK_catalog_options_metadata_is_object',
  'jsonb_typeof("metadata") = \'object\'',
)
@Unique('UQ_catalog_options_catalog_id_code', ['catalogId', 'code'])
@Entity({ name: 'catalog_options' })
export class CatalogOption {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'catalog_id', type: 'uuid' })
  catalogId!: string;

  @Column({ name: 'code', type: 'varchar', length: 80 })
  code!: string;

  @Column({ name: 'label', type: 'varchar', length: 120 })
  label!: string;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  @Column({ name: 'metadata', type: 'jsonb', default: () => "'{}'" })
  metadata!: Record<string, unknown>;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  updatedAt!: Date;

  @ManyToOne(() => Catalog, (catalog) => catalog.options, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'catalog_id',
    foreignKeyConstraintName: 'FK_catalog_options_catalog_id',
  })
  catalog!: Catalog;
}
