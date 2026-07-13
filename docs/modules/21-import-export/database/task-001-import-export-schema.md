# Database task 001: jobs de importación y exportación

## Navegación

- Código: `DB-IO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 1.
- Regresas a: paso 2.
- Rama: `sdd/add-import-export-jobs`.

## `import_jobs`

| Campo                                                        | Tipo         | Regla                                                                                            |
| ------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------ |
| `id`                                                         | uuid PK      | PostgreSQL                                                                                       |
| `organization_id`                                            | uuid FK      | requerido                                                                                        |
| `requested_by_member_id`                                     | uuid FK      | requerido                                                                                        |
| `resource_type`                                              | varchar(30)  | `CUSTOMER`, `CONTACT`, `LEAD`, `PRODUCT`                                                         |
| `file_format`                                                | varchar(10)  | `CSV`, `XLSX`                                                                                    |
| `original_file_name`                                         | varchar(255) | sanitizado, presentación                                                                         |
| `storage_key`                                                | varchar(500) | requerido, no path del cliente                                                                   |
| `file_size_bytes`                                            | bigint       | positivo y limitado                                                                              |
| `checksum_sha256`                                            | char(64)     | requerido                                                                                        |
| `status`                                                     | varchar(20)  | `UPLOADED`, `PREVIEWED`, `CONFIRMED`, `PROCESSING`, `COMPLETED`, `PARTIAL`, `FAILED`, `CANCELED` |
| `column_mapping`, `options`                                  | jsonb        | allowlisted                                                                                      |
| `total_rows`, `valid_rows`, `invalid_rows`, `processed_rows` | integer      | no negativos                                                                                     |
| `idempotency_key`                                            | varchar(180) | requerido                                                                                        |
| `confirmed_at`, `started_at`, `completed_at`, `expires_at`   | timestamptz  | según status                                                                                     |
| `error_code`, `error_summary`                                | varchar      | nullable y seguro                                                                                |
| `correlation_id`                                             | varchar(128) | requerido                                                                                        |
| `created_at`, `updated_at`                                   | timestamptz  | requeridos                                                                                       |

Unique `organization_id, idempotency_key`; índices status/created, requester y
expires. Checks de conteos, size y transición/timestamps.

Organization/member son lado uno; import jobs lado muchos. FKs `RESTRICT` para
conservar historial.

## `import_job_rows`

Campos: `id`, `import_job_id`, `row_number integer`, `raw_data jsonb`,
`normalized_data jsonb`, `validation_errors jsonb`, status
`VALID/INVALID/IMPORTED/SKIPPED/FAILED`, `target_entity_id uuid null`,
`target_entity_type`, `processed_at`, timestamps.

Un job es lado uno y tiene muchas rows; FK en rows usa `CASCADE` solo cuando un
job expirado es purgado por política. Unique `import_job_id, row_number`;
índices job/status/row y target entity. Row data no guarda passwords ni files.

## `export_jobs`

Campos: `id`, `organization_id`, `requested_by_member_id`, `resource_type`,
`file_format CSV/XLSX/PDF`, `filters jsonb`, `columns jsonb`, `sort jsonb`,
`status PENDING/PROCESSING/COMPLETED/FAILED/CANCELED`, `storage_key nullable`,
`file_name nullable`, `checksum_sha256 nullable`, `file_size_bytes nullable`,
`row_count`, `idempotency_key`, `error_code`, `correlation_id`,
`started_at/completed_at/expires_at`, timestamps.

Organization/member son lado uno; jobs lado muchos; FKs `RESTRICT`. Unique
organization/idempotency; índices status/created, requester y expires. Checks:
file metadata requerida únicamente al completar.

## Files y retención

PostgreSQL guarda metadata; bytes viven detrás de `FileStoragePort`. `storage_key`
la genera el servidor e incluye tenant/job de forma no manipulable. No se
aceptan absolute paths ni `..`.

## Migración

Nombre `CreateImportExportJobs`; orden import_jobs, rows, export_jobs. En down,
rows primero. La migración no borra files; el service debe coordinar storage y
DB con compensación documentada.

Completa `run -> revert -> run` y prueba unique/constraints/indices.

## Definition of Done

- [ ] Jobs tienen tenant, actor, idempotency, status y expiry.
- [ ] Rows pertenecen a un job por FK y orden único.
- [ ] Files no están en JSON/blob de DB.
- [ ] Relations y onDelete conservan historial.
- [ ] Worker y cleanup queries tienen índices.
- [ ] Migración se probó desde base limpia.
