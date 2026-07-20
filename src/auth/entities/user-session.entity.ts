import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { RefreshToken } from './refresh-token.entity';
import { User } from '../../users/entities/user.entity';

@Check('CK_user_sessions_expires_after_created', '"expires_at" > "created_at"')
@Check(
  'CK_user_sessions_revocation_reason',
  '("revoked_at" IS NULL AND "revoke_reason" IS NULL) OR ("revoked_at" IS NOT NULL AND "revoke_reason" IS NOT NULL AND char_length(btrim("revoke_reason")) > 0)',
)
@Index('IDX_user_sessions_user_revoked_expires', [
  'userId',
  'revokedAt',
  'expiresAt',
])
@Entity({ name: 'user_sessions' })
export class UserSession {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent!: string | null;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress!: string | null;

  @Column({
    name: 'last_used_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  lastUsedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;

  @Column({
    name: 'revoke_reason',
    type: 'varchar',
    length: 120,
    nullable: true,
  })
  revokeReason!: string | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  createdAt!: Date;

  @ManyToOne(() => User, (user) => user.sessions, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_user_sessions_user_id',
  })
  user!: User;

  @OneToMany(() => RefreshToken, (token) => token.session)
  refreshTokens!: RefreshToken[];
}
