import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { UserSession } from './user-session.entity';

@Check('CK_refresh_tokens_expires_after_created', '"expires_at" > "created_at"')
@Check(
  'CK_refresh_tokens_parent_not_self',
  '"parent_token_id" IS NULL OR "parent_token_id" <> "id"',
)
@Unique('UQ_refresh_tokens_token_hash', ['tokenHash'])
@Index('IDX_refresh_tokens_session_id', ['sessionId'])
@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  tokenHash!: string;

  @Column({ name: 'parent_token_id', type: 'uuid', nullable: true })
  parentTokenId!: string | null;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt!: Date;

  @ManyToOne(() => UserSession, (session) => session.refreshTokens, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'session_id',
    foreignKeyConstraintName: 'FK_refresh_tokens_session_id',
  })
  session!: UserSession;

  @OneToOne(() => RefreshToken, (token) => token.childToken, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'parent_token_id',
    foreignKeyConstraintName: 'FK_refresh_tokens_parent_token_id',
  })
  parentToken!: RefreshToken | null;

  @OneToOne(() => RefreshToken, (token) => token.parentToken)
  childToken!: RefreshToken | null;
}
