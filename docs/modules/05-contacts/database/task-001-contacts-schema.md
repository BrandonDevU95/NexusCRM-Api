# Database task 001: esquema de contactos

## Navegación

- **Código:** DB-CONT-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 1.
- **Regresa a:** `../LEARNING-PATH.md`, paso 2.
- **No continúes hasta:** demostrar máximo un principal activo por customer.

## contacts

| Campo | Tipo | Null | Default | Regla | Motivo |
|---|---|---:|---|---|---|
| id | uuid | no | generado | PK | Identidad estable. |
| organization_id | uuid | no | — | FK organizations.id | Defensa tenant. |
| customer_id | uuid | no | — | FK customers.id | Define cuenta padre. |
| first_name | varchar(100) | no | — | no vacío | Identidad personal. |
| last_name | varchar(120) | no | — | no vacío | Identidad personal. |
| email | varchar(254) | sí | null | formato válido | Canal de contacto. |
| normalized_email | varchar(254) | sí | null | índice | Búsqueda consistente. |
| phone | varchar(30) | sí | null | formato permitido | Canal laboral. |
| mobile_phone | varchar(30) | sí | null | formato permitido | Canal móvil. |
| job_title | varchar(120) | sí | null | — | Contexto comercial. |
| department | varchar(120) | sí | null | — | Segmenta interlocutor. |
| is_primary | boolean | no | false | máximo uno activo por customer | Define contacto preferente. |
| notes | text | sí | null | — | Contexto interno breve. |
| created_at / updated_at | timestamptz | no | now | — | Trazabilidad. |
| archived_at | timestamptz | sí | null | posterior a created_at | Archivo sin pérdida. |

Customer es lado **uno** y tiene **muchos** contacts. FK compuesta `(organization_id, customer_id)` referencia `customers(organization_id, id)`, no es nullable y usa `onDelete: RESTRICT`; un customer se archiva y sus contactos sobreviven para historial. Organization también es lado uno y contacts lado muchos, FK `organization_id`, `onDelete: RESTRICT`.

Declara `UQ_contacts_organization_id_id` sobre `(organization_id, id)` y `UQ_contacts_organization_customer_id` sobre `(organization_id, customer_id, id)` para que Deals pueda demostrar que contact pertenece al customer. El índice `UQ_contacts_active_primary_per_customer` es unique parcial sobre `(organization_id, customer_id)` donde `is_primary=true AND archived_at IS NULL`. Garantiza **máximo uno**, no exige que exista uno: un customer puede tener cero contactos principales. Índices adicionales por tenant/customer, nombre y email.

## contact_preferences

Campos: `id uuid PK`, `organization_id uuid not null`, `contact_id uuid unique not null`, `preferred_channel varchar(30) null`, `allow_email boolean not null default true`, `allow_phone boolean not null default true`, `allow_sms boolean not null default false`, `allow_whatsapp boolean not null default false`, `do_not_contact boolean not null default false`, `best_contact_time varchar(80) null`, timestamps.

Contact es lado **uno** y tiene cero o una preferences row. FK compuesta `(organization_id, contact_id)` referencia `contacts(organization_id, id)`, usa `onDelete: CASCADE`, y `UQ_contact_preferences_organization_contact` garantiza el uno-a-uno. Preferences no tienen valor independiente si un contacto se hard-delete durante limpieza controlada; el endpoint normal solo archiva.

`CHK_contact_preferences_do_not_contact` exige que, si `do_not_contact=true`, todos los flags de autorización estén en false. El DTO y service aplican la misma regla.

## Migración

Crea contacts antes de preferences. Prueba índice parcial con dos inserciones concurrentes y revisión `up/down`.

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreateCustomerContacts
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run
