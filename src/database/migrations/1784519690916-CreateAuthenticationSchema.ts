import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthenticationSchema1784519690916 implements MigrationInterface {
  name = 'CreateAuthenticationSchema1784519690916';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "email_verification_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_email_verification_tokens_token_hash" UNIQUE ("token_hash"), CONSTRAINT "CK_email_verification_tokens_expires_after_created" CHECK ("expires_at" > "created_at"), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_verification_tokens_expires_at" ON "email_verification_tokens" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_email_verification_tokens_user_id" ON "email_verification_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_password_reset_tokens_token_hash" UNIQUE ("token_hash"), CONSTRAINT "CK_password_reset_tokens_expires_after_created" CHECK ("expires_at" > "created_at"), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_expires_at" ON "password_reset_tokens" ("expires_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_password_reset_tokens_user_id" ON "password_reset_tokens" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "session_id" uuid NOT NULL, "token_hash" character varying(255) NOT NULL, "parent_token_id" uuid, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used_at" TIMESTAMP WITH TIME ZONE, "revoked_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"), CONSTRAINT "REL_42df2dc5809858874287aa2705" UNIQUE ("parent_token_id"), CONSTRAINT "CK_refresh_tokens_parent_not_self" CHECK ("parent_token_id" IS NULL OR "parent_token_id" <> "id"), CONSTRAINT "CK_refresh_tokens_expires_after_created" CHECK ("expires_at" > "created_at"), CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_refresh_tokens_session_id" ON "refresh_tokens" ("session_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "user_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "user_id" uuid NOT NULL, "user_agent" character varying(512), "ip_address" inet, "last_used_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "revoked_at" TIMESTAMP WITH TIME ZONE, "revoke_reason" character varying(120), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CK_user_sessions_revocation_reason" CHECK (("revoked_at" IS NULL AND "revoke_reason" IS NULL) OR ("revoked_at" IS NOT NULL AND "revoke_reason" IS NOT NULL AND char_length(btrim("revoke_reason")) > 0)), CONSTRAINT "CK_user_sessions_expires_after_created" CHECK ("expires_at" > "created_at"), CONSTRAINT "PK_e93e031a5fed190d4789b6bfd83" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_sessions_user_revoked_expires" ON "user_sessions" ("user_id", "revoked_at", "expires_at") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "email" character varying(254) NOT NULL, "normalized_email" character varying(254) NOT NULL, "password_hash" character varying(255) NOT NULL, "first_name" character varying(100) NOT NULL, "last_name" character varying(100) NOT NULL, "status" character varying(30) NOT NULL DEFAULT 'PENDING_VERIFICATION', "failed_login_attempts" smallint NOT NULL DEFAULT '0', "locked_until" TIMESTAMP WITH TIME ZONE, "email_verified_at" TIMESTAMP WITH TIME ZONE, "password_changed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "last_login_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "archived_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_users_normalized_email" UNIQUE ("normalized_email"), CONSTRAINT "CK_users_archived_after_created" CHECK ("archived_at" IS NULL OR "archived_at" > "created_at"), CONSTRAINT "CK_users_failed_login_attempts_non_negative" CHECK ("failed_login_attempts" >= 0), CONSTRAINT "CK_users_status_allowed" CHECK ("status" IN ('PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED')), CONSTRAINT "CK_users_last_name_not_blank" CHECK (char_length(btrim("last_name")) > 0), CONSTRAINT "CK_users_first_name_not_blank" CHECK (char_length(btrim("first_name")) > 0), CONSTRAINT "CK_users_password_hash_argon2id" CHECK ("password_hash" LIKE '$argon2id$%'), CONSTRAINT "CK_users_normalized_email_canonical" CHECK ("normalized_email" = lower(btrim("normalized_email"))), CONSTRAINT "CK_users_email_format" CHECK ("email" ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_email_verification_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_password_reset_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_session_id" FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_refresh_tokens_parent_token_id" FOREIGN KEY ("parent_token_id") REFERENCES "refresh_tokens"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_sessions" ADD CONSTRAINT "FK_user_sessions_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_sessions" DROP CONSTRAINT "FK_user_sessions_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_parent_token_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_refresh_tokens_session_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_password_reset_tokens_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_email_verification_tokens_user_id"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_sessions_user_revoked_expires"`,
    );
    await queryRunner.query(`DROP TABLE "user_sessions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_refresh_tokens_session_id"`,
    );
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_password_reset_tokens_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_password_reset_tokens_expires_at"`,
    );
    await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_email_verification_tokens_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_email_verification_tokens_expires_at"`,
    );
    await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
  }
}
