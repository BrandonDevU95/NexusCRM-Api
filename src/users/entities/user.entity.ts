import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { EmailVerificationToken } from '../../auth/entities/email-verification-token.entity';
import { PasswordResetToken } from '../../auth/entities/password-reset-token.entity';
import { UserSession } from '../../auth/entities/user-session.entity';

export const USER_STATUSES = [
  'PENDING_VERIFICATION',
  'ACTIVE',
  'SUSPENDED',
] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

@Check(
  'CK_users_email_format',
  '"email" ~* \'^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$\'',
)
@Check(
  'CK_users_normalized_email_canonical',
  '"normalized_email" = lower(btrim("normalized_email"))',
)
@Check(
  'CK_users_password_hash_argon2id',
  '"password_hash" LIKE \'$argon2id$%\'',
)
@Check('CK_users_first_name_not_blank', 'char_length(btrim("first_name")) > 0')
@Check('CK_users_last_name_not_blank', 'char_length(btrim("last_name")) > 0')
@Check(
  'CK_users_status_allowed',
  "\"status\" IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED')",
)
@Check(
  'CK_users_failed_login_attempts_non_negative',
  '"failed_login_attempts" >= 0',
)
@Check(
  'CK_users_archived_after_created',
  '"archived_at" IS NULL OR "archived_at" > "created_at"',
)
@Unique('UQ_users_normalized_email', ['normalizedEmail'])
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id!: string;

  @Column({ name: 'email', type: 'varchar', length: 254 })
  email!: string;

  @Column({ name: 'normalized_email', type: 'varchar', length: 254 })
  normalizedEmail!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName!: string;

  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: 'PENDING_VERIFICATION',
  })
  status!: UserStatus;

  @Column({
    name: 'failed_login_attempts',
    type: 'smallint',
    default: 0,
  })
  failedLoginAttempts!: number;

  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil!: Date | null;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt!: Date | null;

  @Column({
    name: 'password_changed_at',
    type: 'timestamptz',
    default: () => 'now()',
  })
  passwordChangedAt!: Date;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt!: Date | null;

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

  @Column({ name: 'archived_at', type: 'timestamptz', nullable: true })
  archivedAt!: Date | null;

  @OneToMany(() => UserSession, (session) => session.user)
  sessions!: UserSession[];

  @OneToMany(() => EmailVerificationToken, (token) => token.user)
  emailVerificationTokens!: EmailVerificationToken[];

  @OneToMany(() => PasswordResetToken, (token) => token.user)
  passwordResetTokens!: PasswordResetToken[];
}
