# Trazabilidad del alcance

Esta matriz demuestra que ningún módulo de la propuesta fue descartado. “Paso”
es orden pedagógico; “módulo” conserva la numeración original.

| Módulo | Carpeta                     |   Pasos | Hito                | Cobertura principal                                                        |
| -----: | --------------------------- | ------: | ------------------- | -------------------------------------------------------------------------- |
|      1 | `01-platform-configuration` |       1 | `v0.2.0`            | settings, sequences, catalogs, taxes                                       |
|      2 | `02-security-access`        |   2 y 4 | `v0.2.0`            | users, auth, sessions, tokens, roles, permissions, CASL                    |
|      3 | `03-organizations`          |       3 | `v0.2.0`            | organizations, members, settings, tenant context                           |
|      4 | `04-customers`              |       6 | `v0.3.0`            | accounts, notes, tags, statuses, archive, owner                            |
|      5 | `05-contacts`               |       7 | `v0.3.0`            | contacts, primary contact, preferences                                     |
|      6 | `06-leads`                  | 11 y 13 | `v0.3.0` y `v0.4.0` | lifecycle en A; conversion después de Deals en B                           |
|      7 | `07-sales-pipeline`         |      10 | `v0.3.0`            | pipelines, ordered stages, close rules                                     |
|      8 | `08-deals`                  |      12 | `v0.4.0`            | opportunities, stages, products, win/loss                                  |
|      9 | `09-activities`             |      14 | `v0.4.0`            | activity types, comments, attachments, timeline                            |
|     10 | `10-calendar-tasks`         |      15 | `v0.4.0`            | tasks, assignments, events, reminders                                      |
|     11 | `11-products-services`      |       8 | `v0.3.0`            | products, services, categories, units, prices                              |
|     12 | `12-price-lists`            |       9 | `v0.3.0`            | lists, items, customer assignment, effective price                         |
|     13 | `13-quotes`                 |      17 | `v0.5.0`            | items, totals, taxes, approvals, PDF, snapshots                            |
|     14 | `14-orders-sales`           |      19 | `v0.5.0`            | items, conversion y lifecycle base; fulfillment se completa en Inventory B |
|     15 | `15-inventory`              | 18 y 20 | `v0.5.0` y `v0.6.0` | A: warehouses/stocks/movements; B: reservations/fulfillment/returns        |
|     16 | `16-support-tickets`        |      22 | `v0.7.0`            | tickets, comments, statuses, categories, attachments                       |
|     17 | `17-knowledge-base`         | 21 y 23 | `v0.7.0`            | articles, categories, tags, search, visibility, ticket links               |
|     18 | `18-automations`            |      24 | `v0.8.0`            | rules, triggers, conditions, actions, runs y dispatcher outbox             |
|     19 | `19-notifications`          |      16 | `v0.4.0` y `v0.8.0` | base in-app temprana; email, templates y deliveries completas              |
|     20 | `20-reports-dashboards`     |      25 | `v0.9.0`            | sales, leads, inventory, support, widgets                                  |
|     21 | `21-import-export`          |      26 | `v0.9.0`            | CSV/Excel/PDF, preview, validation, jobs                                   |
|     22 | `22-audit-logs`             |  5 y 27 | `v0.2.0` y `v0.9.0` | audit/outbox temprano; consultas, retención y administración final         |
|     23 | `23-system-administration`  |      28 | `v0.9.0`            | administración compuesta y health operacional                              |

## Reglas funcionales también trazadas

| Regla de propuesta                               | Lugar de introducción                       | Verificación final              |
| ------------------------------------------------ | ------------------------------------------- | ------------------------------- |
| Todo registro comercial pertenece a organization | Organizations y cada database task          | E2E cross-tenant por módulo     |
| Módulos sensibles tienen permisos                | Security B y cada development task          | matriz E2E 401/403              |
| Acción crítica genera audit log                  | Audit foundation y cada task                | integration/E2E de side effect  |
| Listas tienen búsqueda, filtros y paginación     | Foundation HTTP conventions y cada listado  | contract tests                  |
| Formularios validan frontend/backend             | DTO backend ahora; frontend en NexusCRM-Web | E2E 400 y futura UI             |
| Controller no consulta DB                        | Architecture y code review de cada task     | unit tests/service boundary     |
| Reports no bloquean core                         | Reports                                     | rangos, índices y medición      |
| Automations guardan historial                    | Automations                                 | retry/idempotency tests         |
| Inventario se mueve por movements                | Inventory A/B                               | constraints y concurrency tests |
| Orders no borran historial                       | Orders                                      | cancel/return tests             |
| Quotes conservan precios                         | Quotes                                      | snapshot tests                  |
| Refresh tokens rotan y sesiones se revocan       | Security A                                  | replay/revocation E2E           |

## Cobertura de navegación futura

El frontend separado podrá construir Dashboard, CRM, Sales, Inventory, Support,
Automation, Reports y Administration consumiendo estos contratos. Separar el
repositorio no elimina ninguna pantalla ni caso de uso; únicamente desacopla el
momento de aprendizaje del backend y el frontend.
