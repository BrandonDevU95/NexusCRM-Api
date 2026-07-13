# Convenciones de nombres y tipos

## Regla de idioma

Las explicaciones, mensajes al usuario y documentación se escriben en español de
México. Código, rutas, variables, ramas, commits, módulos, tablas y columnas usan
inglés.

## TypeScript y archivos

| Elemento                       | Convención         | Ejemplo                                |
| ------------------------------ | ------------------ | -------------------------------------- |
| variables/functions/properties | `camelCase`        | `organizationId`, `findActiveCustomer` |
| classes/types/enums            | `PascalCase`       | `Customer`, `CustomerStatus`           |
| constants                      | `UPPER_SNAKE_CASE` | `DEFAULT_PAGE_SIZE`                    |
| files/folders                  | `kebab-case`       | `customer-status-history.entity.ts`    |
| Nest modules                   | plural por dominio | `CustomersModule`                      |
| DTO                            | acción + recurso   | `CreateCustomerDto`                    |
| events                         | hecho en pasado    | `CustomerCreatedEvent`                 |

No uses nombres genéricos como `data`, `item`, `manager`, `helper` o `process`
cuando el dominio permite uno preciso.

## PostgreSQL

| Elemento           | Convención            | Ejemplo                     |
| ------------------ | --------------------- | --------------------------- |
| tables             | plural `snake_case`   | `organization_members`      |
| columns            | singular `snake_case` | `organization_id`           |
| primary key        | `id`                  | `customers.id`              |
| foreign key column | `<parent>_id`         | `customer_id`               |
| timestamps         | `<event>_at`          | `created_at`, `archived_at` |
| booleans           | `is_`, `has_`, `can_` | `is_primary`                |
| business codes     | `code` o específico   | `quote_number`              |

La property TypeScript puede ser `organizationId` y mapear explícitamente a
`organization_id`. No cambies de convención entre módulos.

## Constraints e índices

```text
PK_<table>_<columns>
FK_<table>_<columns>
UQ_<table>_<columns>
CK_<table>_<rule>
IDX_<table>_<columns>
```

Ejemplos:

```text
PK_users_id
UQ_users_normalized_email
FK_customers_organization_id
CK_quote_items_quantity_positive
IDX_deals_organization_id_stage_id
```

Los nombres explícitos mejoran mensajes, migraciones y diagnóstico. Si exceden
el límite de PostgreSQL, abrevia palabras sin perder el recurso ni propósito.

## Tipos base

- Identificadores: `uuid`.
- Fechas con instante real: `timestamptz`, almacenadas en UTC.
- Fechas civiles sin hora: `date`.
- Dinero: `numeric(19,4)`; nunca `float`/`double`.
- Cantidades de inventario: `numeric(19,4)` para soportar unidades fraccionarias.
- Porcentajes: `numeric(5,2)` con constraint de rango.
- Payloads flexibles controlados: `jsonb`, siempre validados antes de guardar.
- Texto corto con límite de negocio: `varchar(n)`; texto largo: `text`.

## Estados y catálogos

Usa enum en código y constraint/enum de PostgreSQL solo cuando los valores sean
estables y parte de la lógica. Usa tablas de catálogo cuando el administrador
deba configurarlos, traducirlos o desactivarlos. Nunca guardes la etiqueta en
español como identidad; guarda un `code` estable en inglés y presenta la etiqueta
en la interfaz futura.
