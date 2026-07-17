import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Check(
  'CK_number_sequences_document_type_not_blank',
  'char_length(btrim("document_type")) > 0',
)
@Check(
  'CK_number_sequences_document_type_lowercase',
  '"document_type" = lower("document_type")',
)
@Check('CK_number_sequences_prefix_length', 'char_length("prefix") <= 20')
@Check('CK_number_sequences_next_value_positive', '"next_value" > 0')
@Check('CK_number_sequences_padding_range', '"padding" BETWEEN 1 AND 18')
@Unique('UQ_number_sequences_organization_id_document_type', [
  'organizationId',
  'documentType',
])
@Entity({ name: 'number_sequences' })
export class NumberSequence {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 50 })
  documentType!: string;

  @Column({ name: 'prefix', type: 'varchar', length: 20, default: '' })
  prefix!: string;

  @Column({ name: 'next_value', type: 'bigint', default: 1 })
  nextValue!: string;

  @Column({ name: 'padding', type: 'smallint', default: 6 })
  padding!: number;

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
