import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Check('CK_system_settings_key_not_blank', 'char_length(btrim("key")) > 0')
@Check('CK_system_settings_key_lowercase', '"key" = lower("key")')
@Unique('UQ_system_settings_key', ['key'])
@Entity({ name: 'system_settings' })
export class SystemSetting {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'key', type: 'varchar', length: 100 })
  key!: string;

  @Column({ name: 'value', type: 'jsonb' })
  value!: unknown;

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @Column({ name: 'is_public', type: 'boolean', default: false })
  isPublic!: boolean;

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
