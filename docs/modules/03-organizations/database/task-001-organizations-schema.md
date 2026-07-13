# Database task 001: esquema de organizaciones

## Navegación

- **Código:** DB-ORG-001
- **Vienes de:** `../LEARNING-PATH.md`, registro `ORG-001`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `ORG-001`.
- **No continúes hasta:** agregar y probar las FKs diferidas de Plataforma.

## Diseño

### organizations

Campos: `id uuid PK`, `name varchar(160) not null`, `legal_name varchar(200) null`, `slug varchar(100) not null`, `tax_id varchar(30) null`, `normalized_tax_id varchar(30) null`, `status varchar(30) not null default ACTIVE`, `base_currency char(3) not null default MXN`, `timezone varchar(80) not null`, `locale varchar(20) not null`, `logo_url varchar(500) null`, timestamps y `archived_at timestamptz null`.

Constraints e índices cerrados:

- Slug normalizado unique global.
- `UQ_organizations_active_normalized_tax_id` unique parcial sobre `normalized_tax_id` donde no es null y `archived_at IS NULL`. Una misma entidad fiscal no puede tener dos organizations vigentes.
- `CHK_organizations_tax_id_pair` exige tax ID de presentación y normalizado juntos.
- Índice por status/archived y CHECK de timestamps.

### organization_members

Campos: `id uuid PK`, `organization_id uuid not null`, `user_id uuid not null`, `status varchar(30) not null default ACTIVE`, `job_title varchar(120) null`, `joined_at timestamptz null`, `invited_by_member_id uuid null`, timestamps y `archived_at`.

Una organización es lado **uno** y tiene **muchas** membresías. FK `organization_id`, `onDelete: RESTRICT` porque las membresías sostienen historial. Un usuario es lado **uno** y tiene **muchas** membresías; FK `user_id`, `onDelete: RESTRICT`. Esto representa usuarios-organizaciones muchos-a-muchos sin duplicar usuarios.

Declara `UQ_organization_members_organization_id_id` para todas las FKs tenant-owned posteriores y unique parcial de membership vigente por `(organization_id, user_id)`. El actor usa FK compuesta nullable `(organization_id, invited_by_member_id)` hacia `organization_members(organization_id, id)` con `SET NULL (invited_by_member_id)`.

### organization_settings

Campos: `id uuid PK`, `organization_id uuid not null`, `date_format varchar(30) not null`, `language varchar(20) not null`, `default_country char(2) null`, `fiscal_year_start_month smallint not null default 1`, `settings jsonb not null default {}`, timestamps.

Una organización es lado **uno** y tiene **un** registro de settings. FK `organization_id` unique, `onDelete: RESTRICT`. Declara además `UQ_organization_settings_organization_id_id` si otra tabla la referencia. No uses JSON para moneda, timezone o campos consultados frecuentemente si ya tienen columna.

## Integración de Plataforma

Agrega FKs desde `catalogs.organization_id`, `number_sequences.organization_id` y `tax_rates.organization_id` hacia `organizations.id` con `onDelete: RESTRICT`.

Relaciones: organización lado **uno**; cada tabla de configuración lado **muchos**. La FK vive en el dependiente porque el mismo tipo de secuencia, tasa o catálogo puede repetirse en organizaciones distintas.

Agrega unique por tenant:

- `catalogs(organization_id, id)`, `number_sequences(organization_id, id)` y `tax_rates(organization_id, id)` como claves candidatas tenant-safe.
- `catalogs(organization_id, code)` para filas organizacionales.
- `number_sequences(organization_id, document_type)`.
- `tax_rates(organization_id, code)`.
- Máximo un `tax_rates.is_default=true` activo por organización mediante índice parcial.

## Migración

La migración debe crear primero organizaciones, luego settings/members y finalmente FKs a Plataforma. En reversión, elimina primero las FKs agregadas. No reviertas si ya existen datos comerciales sin evaluar pérdida.

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreateOrganizationsAndTenantRelations
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run
