# Database task 001: esquema de pipeline

## Navegación

- **Código:** DB-PIPE-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 1.
- **Regresa a:** `../LEARNING-PATH.md`, paso 2.
- **No continúes hasta:** ejecutar, revertir y reaplicar la migración sin errores.

## pipelines

| Campo                   | Tipo         | Null | Default  | Regla                              | Motivo                                      |
| ----------------------- | ------------ | ---: | -------- | ---------------------------------- | ------------------------------------------- |
| id                      | uuid         |   no | generado | PK                                 | Identidad estable.                          |
| organization_id         | uuid         |   no | —        | FK organizations.id                | Aísla tenant.                               |
| code                    | varchar(60)  |   no | —        | unique por organization            | Referencia estable para seed.               |
| name                    | varchar(120) |   no | —        | no vacío                           | Nombre visible.                             |
| description             | varchar(255) |   sí | null     | —                                  | Contexto administrativo.                    |
| is_default              | boolean      |   no | false    | máximo uno activo por organization | Conversión necesita destino predeterminado. |
| is_active               | boolean      |   no | true     | —                                  | Desactiva sin borrar.                       |
| created_by_member_id    | uuid         |   sí | null     | FK membership                      | Conserva actor.                             |
| created_at / updated_at | timestamptz  |   no | now      | —                                  | Trazabilidad.                               |
| archived_at             | timestamptz  |   sí | null     | posterior a created_at             | Preserva uso histórico.                     |

Organization es lado **uno** y pipelines lado **muchos**. FK `organization_id`, `onDelete: RESTRICT`: deals históricos impedirán eliminar configuración. Membership lado uno y muchos pipelines creados; FK compuesta nullable `(organization_id, created_by_member_id)` usa `SET NULL (created_by_member_id)` para conservar el tenant.

Constraints/índices: `UQ_pipelines_organization_id_id`; unique `(organization_id, code)`; unique parcial `(organization_id)` donde default, activo y no archivado; índice `(organization_id, is_active, archived_at)`; CHECK de timestamps.

## pipeline_stages

| Campo                   | Tipo         | Null | Default  | Regla                | Motivo                          |
| ----------------------- | ------------ | ---: | -------- | -------------------- | ------------------------------- |
| id                      | uuid         |   no | generado | PK                   | Identidad de etapa.             |
| organization_id         | uuid         |   no | —        | FK organizations.id  | Defensa tenant.                 |
| pipeline_id             | uuid         |   no | —        | FK pipelines.id      | Ubica etapa.                    |
| code                    | varchar(60)  |   no | —        | unique por pipeline  | Referencia estable.             |
| name                    | varchar(120) |   no | —        | no vacío             | Etiqueta kanban.                |
| description             | varchar(255) |   sí | null     | —                    | Criterio de avance.             |
| sort_order              | integer      |   no | —        | mayor o igual a cero | Orden visual.                   |
| probability             | numeric(5,2) |   no | 0        | entre 0 y 100        | Forecast base en porcentaje.    |
| stage_type              | varchar(20)  |   no | OPEN     | OPEN, WON o LOST     | Define terminalidad.            |
| stale_after_days        | smallint     |   sí | null     | mayor que cero       | Detecta oportunidades vencidas. |
| is_active               | boolean      |   no | true     | —                    | Archivo lógico funcional.       |
| created_at / updated_at | timestamptz  |   no | now      | —                    | Trazabilidad.                   |
| archived_at             | timestamptz  |   sí | null     | —                    | Conserva historial.             |

Pipeline es lado **uno** y stages lado **muchos**. La FK compuesta `(organization_id, pipeline_id)` referencia `pipelines(organization_id, id)`, no es nullable y usa `onDelete: RESTRICT`; la base impide stages cross-tenant.

Constraints/índices: `UQ_pipeline_stages_organization_id_id` y `UQ_pipeline_stages_organization_pipeline_id` sobre `(organization_id, pipeline_id, id)` para que Deals pueda validar pipeline+stage; unique `(organization_id, pipeline_id, code)` y unique parcial `(organization_id, pipeline_id, sort_order)` para etapas activas; índice `(organization_id, pipeline_id, stage_type)`; CHECK probability y stale days. La regla de al menos una OPEN, una WON y una LOST se valida transaccionalmente porque abarca varias filas.

## pipeline_stage_history

Campos: `id uuid PK`, `organization_id uuid not null`, `stage_id uuid not null`, `change_type varchar(40) not null`, `old_values jsonb not null default {}`, `new_values jsonb not null default {}`, `changed_by_member_id uuid null`, `created_at timestamptz not null default now`.

Stage es lado **uno** y configuration histories lado **muchos**; FK compuesta `(organization_id, stage_id)` referencia `pipeline_stages(organization_id, id)` con `onDelete: RESTRICT`. Actor usa FK compuesta y `SET NULL (changed_by_member_id)`. Constraints: JSON debe ser objeto y al menos uno de old/new no vacío. Índices `(organization_id, stage_id, created_at desc)` y `(organization_id, created_at desc)`.

`pipeline_stage_history` explica cambios de nombre, orden, probabilidad o tipo de etapa. El movimiento de un deal pertenece a `deal_stage_history`.

## Ciclo de migración

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreateSalesPipelines
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run
