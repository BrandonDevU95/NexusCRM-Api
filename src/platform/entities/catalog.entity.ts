import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CatalogOption } from './catalog-option.entity';

@Check('CK_catalogs_code_not_blank', 'char_length(btrim("code")) > 0')
@Check('CK_catalogs_code_lowercase', '"code" = lower("code")')
@Check('CK_catalogs_name_not_blank', 'char_length(btrim("name")) > 0')
@Index('UQ_catalogs_global_code', ['code'], {
  unique: true,
  where: '"organization_id" IS NULL',
})
@Index('UQ_catalogs_organization_id_code', ['organizationId', 'code'], {
  unique: true,
  where: '"organization_id" IS NOT NULL',
})
@Entity({ name: 'catalogs' })
export class Catalog {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid', nullable: true })
  organizationId!: string | null;

  @Column({ name: 'code', type: 'varchar', length: 80 })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description!: string | null;

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

  @OneToMany(() => CatalogOption, (option) => option.catalog)
  options!: CatalogOption[];
}
