import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Check('CK_tax_rates_code_not_blank', 'char_length(btrim("code")) > 0')
@Check('CK_tax_rates_code_lowercase', '"code" = lower("code")')
@Check('CK_tax_rates_name_not_blank', 'char_length(btrim("name")) > 0')
@Check('CK_tax_rates_rate_percent_range', '"rate_percent" BETWEEN 0 AND 100')
@Index('UQ_tax_rates_organization_active_default', ['organizationId'], {
  unique: true,
  where: '"is_default" IS TRUE AND "is_active" IS TRUE',
})
@Unique('UQ_tax_rates_organization_id_code', ['organizationId', 'code'])
@Entity({ name: 'tax_rates' })
export class TaxRate {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'code', type: 'varchar', length: 40 })
  code!: string;

  @Column({ name: 'name', type: 'varchar', length: 100 })
  name!: string;

  @Column({ name: 'rate_percent', type: 'numeric', precision: 5, scale: 2 })
  ratePercent!: string;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault!: boolean;

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
}
