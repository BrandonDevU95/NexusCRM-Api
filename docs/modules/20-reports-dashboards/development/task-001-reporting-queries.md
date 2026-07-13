# Development task 001: consultas de Reporting

## Navegación

- Código: `DEV-RPT-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 2.
- Regresas a: paso 3.

## Catálogo obligatorio

Dashboard: new/converted leads, open/won/lost deals, pipeline amount, monthly
sales, pending quotes, open tickets y overdue tasks.

Comerciales: pipeline by stage, forecast, lead conversion, sales by seller,
customer/product, lost reasons y average sales cycle.

Operativos: quotes/orders by status, top products, low stock, inventory
movements, tickets by priority/agent y average resolution time.

Cada report code se mapea a un executor del owner domain o a un coordinator que
combina resultados ya tenant-scoped. No construyas un repository universal con
table names dinámicos.

## DTOs

- `ReportQueryDto`: dateFrom/dateTo, timezone, filters, dimensions, metrics,
  page, limit y sort.
- `CreateSavedReportDto`: definitionId, name, visibility y configuration.
- `CreateDashboardWidgetDto`: definitionId, title, type, scope, configuration y
  grid position.
- `DashboardQueryDto`: date range y timezone.

Validar fechas ISO, máximo de rango, page size, allowed filter values y
compatibilidad metric/dimension según definition. `organizationId` proviene de
`X-Organization-Id`; owner del actor autenticado.

## Endpoints y permisos

| Método/path                        | Permission                                  |
| ---------------------------------- | ------------------------------------------- |
| `GET /api/v1/dashboard`            | `reports:read` más permissions de cada dato |
| `GET /api/v1/report-definitions`   | `reports:read`                              |
| `POST /api/v1/reports/:code/query` | permission de definition                    |
| CRUD `/api/v1/saved-reports`       | `reports:manage` y ownership                |
| CRUD `/api/v1/dashboard-widgets`   | `dashboards:manage`                         |

Response incluye `asOf`, applied filters, timezone, rows/series, pagination y
warning si una métrica fue limitada. No expone SQL ni plan interno.

## Rendimiento y aislamiento

- Aplicar organization filter en cada subquery antes de agregar.
- Rango default y máximo; rechazar consultas sin límite.
- Statement timeout específico de reportes.
- Paginar tablas; limitar series y dimensions.
- Ejecutar widgets compatibles en batch, no N+1.
- Cache opcional siempre keyeada por organization, permissions, filters y
  version; no introducir cache global insegura.
- Reportes extensos crean un Export Job en el siguiente módulo.
- Usar read-only transaction cuando varias métricas necesiten un snapshot
  consistente.

## Semántica

Documenta por reporte qué timestamp, status y moneda usa. Forecast no equivale a
revenue; sales cycle define inicio y cierre; conversion evita dividir entre cero;
amount multi-currency se convierte con la regla/snapshot disponible o se agrupa
por currency, nunca se suma sin explicación.

## Audit

Crear/editar/compartir saved reports y widgets organizational genera audit.
Queries ordinarias no generan una fila por lectura, pero exportar datos sí se
audita en Export.

## Definition of Done

- [ ] Todos los report codes tienen fórmula documentada y executor.
- [ ] Header, membership, permissions y tenant scope son obligatorios.
- [ ] Date/filters/sorts/dimensions tienen allowlists y límites.
- [ ] No hay SQL dinámico desde JSON.
- [ ] Métricas monetarias documentan currency.
- [ ] Queries costosas tienen plan revisado y timeout.
