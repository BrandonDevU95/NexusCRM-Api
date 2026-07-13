# Database task 001: esquema de oportunidades

## Navegación

- **Código:** DB-DEAL-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 1.
- **Regresa a:** `../LEARNING-PATH.md`, paso 2.
- **No continúes hasta:** probar constraints de tenant, pipeline/stage y estados terminales.

## deal_loss_reasons

Campos: `id uuid PK`, `organization_id uuid not null`, `code varchar(60) not null`, `name varchar(120) not null`, `description varchar(255) null`, `is_active boolean not null default true`, timestamps. Motivo: catálogo administrable sin perder clasificación histórica.

Organization lado **uno**, loss reasons lado **muchos**; FK `RESTRICT`. Declara `UQ_deal_loss_reasons_organization_id_id`, unique `(organization_id, code)` e índice por `(organization_id, is_active)`.

## deals

| Campo | Tipo | Null | Default | Regla | Motivo |
|---|---|---:|---|---|---|
| id | uuid | no | generado | PK | Identidad estable. |
| organization_id | uuid | no | — | FK organizations.id | Aísla tenant. |
| customer_id | uuid | no | — | FK customers.id | Toda oportunidad real pertenece a cuenta. |
| contact_id | uuid | sí | null | FK contacts.id | Contacto principal de negociación opcional. |
| owner_member_id | uuid | no | — | FK organization_members.id | Responsabilidad comercial. |
| pipeline_id | uuid | no | — | FK pipelines.id | Define proceso. |
| stage_id | uuid | no | — | FK pipeline_stages.id | Posición actual. |
| title | varchar(180) | no | — | no vacío | Identificación comercial. |
| amount | numeric(19,4) | no | 0 | mayor o igual a cero | Valor estimado sin float. |
| amount_source | varchar(20) | no | MANUAL | MANUAL o PRODUCTS | Define quién controla amount. |
| currency | char(3) | no | — | ISO 4217 | Interpreta amount. |
| probability | numeric(5,2) | no | — | entre 0 y 100 | Permite override porcentual de stage. |
| expected_close_date | date | sí | null | — | Forecast sin hora. |
| status | varchar(20) | no | OPEN | OPEN, WON, LOST, CANCELLED, ON_HOLD | State machine. |
| loss_reason_id | uuid | sí | null | FK deal_loss_reasons.id | Clasifica pérdidas. |
| loss_notes | varchar(500) | sí | null | — | Explicación particular. |
| won_at | timestamptz | sí | null | coherente con WON | Métrica temporal. |
| lost_at | timestamptz | sí | null | coherente con LOST | Métrica temporal. |
| created_at / updated_at | timestamptz | no | now | — | Trazabilidad. |
| archived_at | timestamptz | sí | null | — | No borrar historial. |

Relaciones: organization/customer/owner/pipeline/stage/loss reason son lados **uno** y cada uno tiene **muchos** deals. Todas usan `onDelete: RESTRICT` y las referencias tenant-owned son compuestas:

- `(organization_id, customer_id)` → `customers(organization_id, id)`.
- `(organization_id, customer_id, contact_id)` → `contacts(organization_id, customer_id, id)`; nullable por contact y demuestra también que pertenece al customer.
- `(organization_id, owner_member_id)` → `organization_members(organization_id, id)`.
- `(organization_id, pipeline_id)` → `pipelines(organization_id, id)`.
- `(organization_id, pipeline_id, stage_id)` → `pipeline_stages(organization_id, pipeline_id, id)`; demuestra que stage pertenece al pipeline.
- `(organization_id, loss_reason_id)` → `deal_loss_reasons(organization_id, id)`, nullable.

Constraints: `UQ_deals_organization_id_id`; amount/probability no negativos/en rango; `amount_source` solo MANUAL o PRODUCTS; WON exige `won_at` y stage WON; LOST exige `lost_at`, loss reason y stage LOST; otros estados no tienen esos timestamps salvo política documentada. Índices `(organization_id, status, archived_at)`, `(organization_id, stage_id)`, owner, customer, expected close, created date.

## deal_stage_history

Campos: `id`, `organization_id`, `deal_id`, `from_stage_id null`, `to_stage_id not null`, `from_status varchar(20) null`, `to_status varchar(20) not null`, `moved_by_member_id null`, `reason varchar(255) null`, `created_at`.

Deal lado **uno**, histories lado **muchos**; FK compuesta `(organization_id, deal_id)` usa `RESTRICT`. Stages son lado uno y muchas histories como origen/destino; FKs compuestas `(organization_id, from_stage_id)` y `(organization_id, to_stage_id)` usan `RESTRICT`. Actor usa FK compuesta y `SET NULL (moved_by_member_id)`. Índices `(organization_id, deal_id, created_at)` y tenant/date. Append-only.

## deal_products

Campos: `id uuid PK`, `organization_id`, `deal_id`, `product_id`, `quantity numeric(19,4)`, `unit_price numeric(19,4)`, `discount_amount numeric(19,4) default 0`, `currency char(3)`, `product_name_snapshot varchar(180)`, timestamps.

Deals y products son muchos-a-muchos mediante `deal_products`: cada padre es lado uno respecto a muchas filas puente. FKs compuestas `(organization_id, deal_id)` y `(organization_id, product_id)` usan `RESTRICT` porque la estimación debe sobrevivir cambios/archivo. Unique `(organization_id, deal_id, product_id)` si un producto solo ocupa un renglón; checks de cantidades/precios/descuento e índice tenant/product.

## Migración

Crea catálogos, root y después histories/items. Revisa que el `down` no oculte pérdida; prueba `up/down/up` en base desechable.

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreateDealAggregate
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run
