# Database task 001: esquema de clientes

## Navegación

- **Código:** DB-CUST-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 1.
- **Regresa a:** `../LEARNING-PATH.md`, paso 2.
- **No continúes hasta:** probar tenant, owner, histories y reglas de eliminación.

## Aggregate root: customers

| Campo                   | Tipo         | Null | Default  | Regla                                        | Motivo                                 |
| ----------------------- | ------------ | ---: | -------- | -------------------------------------------- | -------------------------------------- |
| id                      | uuid         |   no | generado | PK                                           | Identidad estable.                     |
| organization_id         | uuid         |   no | —        | FK organizations.id                          | Aísla tenant.                          |
| owner_member_id         | uuid         |   sí | null     | FK organization_members.id                   | Asigna responsabilidad comercial.      |
| name                    | varchar(180) |   no | —        | no vacío                                     | Nombre operativo.                      |
| legal_name              | varchar(220) |   sí | null     | —                                            | Identidad legal opcional.              |
| tax_id                  | varchar(30)  |   sí | null     | valor de presentación                        | Identificación fiscal sin facturación. |
| normalized_tax_id       | varchar(30)  |   sí | null     | uppercase sin espacios/separadores admitidos | Unicidad fiscal consistente.           |
| email                   | varchar(254) |   sí | null     | formato válido                               | Contacto general.                      |
| normalized_email        | varchar(254) |   sí | null     | índice                                       | Búsqueda y duplicados indicativos.     |
| phone                   | varchar(30)  |   sí | null     | formato permitido                            | Contacto general.                      |
| website                 | varchar(500) |   sí | null     | URL válida                                   | Perfil comercial.                      |
| industry                | varchar(100) |   sí | null     | valor controlado                             | Segmentación.                          |
| source                  | varchar(80)  |   sí | null     | valor controlado                             | Atribución.                            |
| status                  | varchar(30)  |   no | PROSPECT | estado permitido                             | Ciclo de relación.                     |
| type                    | varchar(40)  |   no | COMPANY  | tipo permitido                               | Comportamiento/clasificación.          |
| address_line_1          | varchar(180) |   sí | null     | —                                            | Domicilio.                             |
| address_line_2          | varchar(180) |   sí | null     | —                                            | Complemento.                           |
| city                    | varchar(100) |   sí | null     | —                                            | Filtro geográfico.                     |
| state                   | varchar(100) |   sí | null     | —                                            | Filtro geográfico.                     |
| country                 | char(2)      |   sí | null     | ISO alpha-2                                  | Normaliza país.                        |
| postal_code             | varchar(20)  |   sí | null     | —                                            | Domicilio/logística futura.            |
| created_at / updated_at | timestamptz  |   no | now      | —                                            | Trazabilidad.                          |
| archived_at             | timestamptz  |   sí | null     | posterior a created_at                       | Archivo sin pérdida.                   |

Una organización es lado **uno** y tiene **muchos** customers. FK no nula en `customers.organization_id`, `onDelete: RESTRICT`: no se destruyen clientes al eliminar tenant. Una membresía es lado **uno** y puede ser responsable de **muchos** customers. La FK compuesta nullable `(organization_id, owner_member_id)` referencia `organization_members(organization_id, id)` con `onDelete: RESTRICT`; una membership se archiva, no se borra, y la base impide asignar owner de otro tenant.

Constraints e índices obligatorios:

- `UQ_customers_organization_id_id` sobre `(organization_id, id)` habilita FKs tenant-safe desde hijos.
- `UQ_customers_active_normalized_tax_id` sobre `(organization_id, normalized_tax_id)` donde `normalized_tax_id IS NOT NULL AND archived_at IS NULL`. Dos clientes activos del mismo tenant no comparten tax ID; tenants distintos sí pueden hacerlo.
- `IDX_customers_organization_status_archived`, `IDX_customers_organization_owner`, `IDX_customers_organization_created`, y búsquedas justificadas por nombre/email.
- `CHK_customers_tax_id_pair` exige que `tax_id` y `normalized_tax_id` sean ambos null o ambos no null.

## customer_notes

Campos: `id`, `organization_id`, `customer_id`, `author_member_id`, `body text not null`, timestamps y `archived_at`.

Customer lado **uno**, notes lado **muchos**. FK compuesta `(organization_id, customer_id)` referencia `customers(organization_id, id)`, `onDelete: RESTRICT` porque son historial. Membership lado uno, muchas notas; FK compuesta `(organization_id, author_member_id)` referencia la membership del mismo tenant con `onDelete: RESTRICT`.

## tags y customer_tags

`tags`: `id`, `organization_id`, `code varchar(60)`, `name varchar(100)`, `color varchar(20) null`, `is_active boolean default true`, timestamps. Declara `UQ_tags_organization_id_id` y unique `(organization_id, code)`.

`customer_tags`: `organization_id`, `customer_id`, `tag_id`, `assigned_by_member_id null`, `created_at`; PK `(organization_id, customer_id, tag_id)`.

Customers y tags son muchos-a-muchos. La tabla puente crea dos relaciones uno-a-muchos. Las FKs compuestas `(organization_id, customer_id)` y `(organization_id, tag_id)` usan `onDelete: CASCADE` solo para la asociación. `(organization_id, assigned_by_member_id)` es nullable y usa `SET NULL (assigned_by_member_id)` para no borrar `organization_id`.

## customer_status_history

Campos: `id`, `organization_id`, `customer_id`, `from_status varchar(30) null`, `to_status varchar(30) not null`, `reason varchar(255) null`, `changed_by_member_id uuid null`, `created_at`.

Customer lado **uno**, history lado **muchos**. FK compuesta `(organization_id, customer_id)`, `onDelete: RESTRICT`. Actor nullable usa FK compuesta `(organization_id, changed_by_member_id)` con `SET NULL (changed_by_member_id)`. History es append-only.

## Migración y checks

- Estados: PROSPECT, ACTIVE, INACTIVE, BLOCKED, LOST, FOLLOW_UP.
- Tipos: INDIVIDUAL, COMPANY, DISTRIBUTOR, CUSTOMER_SUPPLIER. El origen desde Lead se demuestra mediante `lead_conversions`; no es un tipo de customer.
- No permitas `updated_at < created_at` ni `archived_at < created_at`.
- Revisa SQL e índices, ejecuta, revierte y aplica otra vez.

  pnpm migration:show
  pnpm migration:generate src/database/migrations/CreateCustomerAggregate
  pnpm migration:run
  pnpm migration:revert
  pnpm migration:run
