# Development task 002: settings, catálogos y numeración

## Navegación

- **Código:** DEV-PLAT-002
- **Etapa A viene de:** `../LEARNING-PATH.md`, registro `PLAT-004`.
- **Etapa A regresa a:** `../LEARNING-PATH.md`, registro `PLAT-004`.
- **Etapa B viene de:** módulo 03, registro `ORG-004`.
- **Etapa B regresa a:** `../LEARNING-PATH.md`, registro `PLAT-008`, y después
  a la ruta de Organizaciones.
- **No continúes hasta:** los controllers no consulten DB y cada consulta
  tenant-scoped reciba el organization ID validado.

## Etapa A: capacidad global

Antes de que existan users u organizations implementa solo lo que puede ser
seguro y coherente en ámbito global:

- Lectura de settings públicos mediante `GET /settings/public`.
- Repositories y services para settings y catálogos globales.
- Validadores de claves conocidas, codes, orden y metadata.
- Formateador puro de folios, sin leer ni incrementar secuencias.

No expongas temporalmente endpoints administrativos sin autenticación “para
probar”. Conserva los casos administrativos detrás de services hasta que
Security B pueda aplicar permisos explícitos.

### Contrato de settings globales conocidos

Etapa A reconoce únicamente estas claves. Sus valores son strings JSON y son
seguros para lectura pública cuando `is_public` es `true`:

| Key                         | Contrato del valor                                    | Ejemplo                 |
| --------------------------- | ----------------------------------------------------- | ----------------------- |
| `platform.default_language` | locale BCP 47 aceptado por `Intl.getCanonicalLocales` | `"es-MX"`               |
| `platform.default_currency` | código ISO 4217 en tres letras mayúsculas             | `"MXN"`                 |
| `platform.time_zone`        | zona horaria IANA aceptada por `Intl.DateTimeFormat`  | `"America/Mexico_City"` |
| `platform.date_format`      | `DD/MM/YYYY`, `MM/DD/YYYY` o `YYYY-MM-DD`             | `"DD/MM/YYYY"`          |

La allowlist tipada y los validadores viven dentro de `src/platform/services`
para que services, tests y seeders consuman el mismo contrato. Una clave ajena,
una variable de entorno o un valor que no cumpla su contrato nunca se devuelve
desde `GET /settings/public`, aun si una fila fue marcada accidentalmente como
pública.

## Etapa B: capacidad organizacional

Después de Organizations integra:

- Catálogos personalizados por tenant.
- Tasas por tenant y selección de un solo default activo.
- Siguiente folio por organization y document type.
- Settings organizacionales, cuyo owner es Organizations.

El módulo 03 aporta `X-Organization-Id`, membership guard y tenant context.
Platform recibe `organizationId` desde ese contexto y vuelve a incluirlo en
cada consulta. Body y JWT nunca eligen la organización activa.

La numeración no se expone como endpoint de “incrementar”. Quotes, Orders y
Tickets consumen el servicio dentro de la misma transacción que crea el
documento. El servicio bloquea la fila de secuencia, obtiene `next_value`, lo
incrementa y devuelve el folio sin commit independiente.

## Endpoints administrativos pendientes de Security B

Cuando Security B esté disponible habilita:

- `GET /settings` y `PATCH /settings/:key`.
- `GET /catalogs`, `POST /catalogs` y cambios de opciones.
- `GET /tax-rates` y `POST/PATCH /tax-rates`.
- Lectura/administración de formatos de secuencia, nunca incremento libre.

Usa constantes tipadas y decoradores del catálogo Security:

| Operación                     | Permiso                   |
| ----------------------------- | ------------------------- |
| Leer settings administrativos | `settings:read`           |
| Actualizar settings           | `settings:update`         |
| Leer catálogos                | `catalogs:read`           |
| Administrar catálogos         | `catalogs:manage`         |
| Leer formatos de secuencia    | `number-sequences:read`   |
| Administrar formatos          | `number-sequences:manage` |
| Leer tasas                    | `tax-rates:read`          |
| Administrar tasas             | `tax-rates:manage`        |

No escribas strings libres en controllers. Security B aplica
`@RequirePermissions(...)` y pruebas de regresión a estos endpoints.

## Validación

- Rechaza claves desconocidas de settings.
- Normaliza `code` antes de buscar unicidad.
- Normaliza `code` con `trim` y minúsculas; después rechaza el resultado vacío.
- Valida sort order como entero no negativo y metadata como objeto JSON plano.
- Valida `ratePercent` entre 0 y 100 y evita dos defaults activos.
- No acepta `organization_id` desde DTO.
- Un ID de otro tenant se busca con `organization_id` y responde `404`.

## Orden de implementación

1. Repositories globales y services puros de etapa A.
2. Lectura pública y DTOs de etapa A.
3. Tras Organizations, repositories tenant-scoped de etapa B.
4. Servicio de secuencias que participa en la transacción del consumidor.
5. Tasas y catálogos organizacionales.
6. Tras Security B, controllers administrativos, permisos y Swagger.
7. Tras Audit A, before/after de cambios críticos.

## Errores

- `404` para clave, catálogo u opción inexistente dentro del ámbito consultado.
- `409` para code duplicado, default duplicado o secuencia no configurada.
- `422` para JSON con forma válida pero valor inválido para una clave conocida.
- Los validadores de dominio no lanzan errores nativos como `RangeError` o
  `TypeError`; el service traduce su resultado al error HTTP correspondiente.

## Definition of Done

- [x] Etapa A no requiere organization ni publica administración insegura.
- [ ] Etapa B filtra todas las consultas por tenant.
- [ ] El body no decide organization.
- [ ] Numeración usa el manager/transacción del consumidor.
- [ ] Endpoints administrativos esperan permisos de Security B.
- [ ] Cambios críticos esperan auditoría de Audit A.
