# Convenciones HTTP y contrato de API

Este documento elimina decisiones repetitivas. Cada development task debe volver
a indicar las reglas aplicables con sus rutas y permisos concretos.

## Base URL y versiones

```text
http://localhost:<API_PORT>/api/v1
```

- El prefijo global es `/api`.
- La versión inicial es URI versioning con `/v1`.
- Los recursos usan sustantivos plurales en `kebab-case`.
- Las acciones de negocio que no son CRUD se modelan como subrecursos o verbos
  explícitos: `status-transitions`, `approve`, `cancel`, `convert`.
- Swagger vive en `/api/docs` y su JSON en `/api/docs-json`.
- Health vive en `/api/v1/health` y no expone secretos.

## Tenant context decidido

Los endpoints de negocio conservan rutas legibles como `/customers` y requieren:

```text
X-Organization-Id: <organization UUID>
```

El flujo obligatorio es:

1. Authentication identifica `userId` y `sessionId`.
2. El tenant guard valida que el header sea UUID.
3. Busca una `organization_member` activa para ese user y organization.
4. Confirma que la organization esté activa.
5. Crea un contexto inmutable con `userId`, `sessionId`, `organizationId` y
   `membershipId`.
6. Authorization resuelve roles/permisos de esa membresía.
7. El service usa el `organizationId` del contexto en todas sus consultas.

El body nunca acepta `organizationId` para decidir alcance. El access token no
fija una organización activa porque el usuario puede cambiar de tenant y una
membresía puede revocarse antes de que expire el JWT.

Rutas globales como login, refresh y lista de organizaciones accesibles no
requieren el header. Las tareas deben decir explícitamente si la ruta es global
o tenant-scoped.

## Métodos y status codes

| Operación | Método | Éxito normal |
| --- | --- | --- |
| Crear recurso | `POST` | `201 Created` |
| Listar/consultar | `GET` | `200 OK` |
| Actualización parcial | `PATCH` | `200 OK` |
| Reemplazar asignación | `PUT` | `200 OK` |
| Acción sin body de respuesta | según caso | `204 No Content` |
| Archivar mediante endpoint DELETE | `DELETE` | `204 No Content` |

No uses `200` para todos los casos. Un DELETE comercial casi siempre archiva o
cancela según el dominio; la task explica el comportamiento real.

## Respuestas

Un recurso exitoso usa:

```text
data: objeto o null
```

Una lista usa:

```text
data: arreglo
meta:
  limit
  offset
  total
  hasMore
```

La API nunca devuelve entity instances sin controlar. Los response DTOs deciden
campos, formato decimal, fechas y relaciones incluidas. Password hashes, token
hashes, secrets, internal seed keys y payloads sensibles nunca salen.

## Paginación, filtros y orden

- Default `limit`: 25.
- Máximo `limit`: 100 salvo reporte/export explícito.
- `offset` comienza en 0.
- `search` se normaliza y tiene longitud mínima/máxima.
- Filtros repetibles usan nombres documentados; fechas usan ISO 8601.
- `sortBy` solo acepta una allowlist.
- `sortOrder` acepta `asc` o `desc`.
- Toda lista tiene un orden estable secundario por `id` para evitar saltos.
- El total se calcula dentro del mismo tenant y filtros.

Offset pagination es la primera estrategia porque es familiar y suficiente para
la administración interna. Un módulo con volumen medido puede migrar a cursor
pagination mediante un cambio versionado, no por intuición.

## Errores

La API usa una forma coherente inspirada en Problem Details:

```text
type, title, status, detail, instance, errorCode, correlationId, errors
```

- `400`: forma o sintaxis inválida.
- `401`: no hay identidad válida.
- `403`: identidad válida sin permiso/membresía.
- `404`: recurso no existe, está archivado para esa operación o pertenece a otro
  tenant; no se revela cuál caso ocurrió.
- `409`: unique, idempotencia o conflicto de estado actual.
- `422`: regla de negocio entendible pero no ejecutable.
- `429`: throttling.
- `500`: error inesperado con detalle interno redactado.

`errorCode` es estable y técnico, por ejemplo `CUSTOMER_NOT_FOUND` o
`QUOTE_INVALID_STATUS_TRANSITION`. El texto puede cambiar; los consumidores no
deben programarse contra frases humanas.

## ValidationPipe y DTOs

- `whitelist: true` elimina o rechaza properties desconocidas según la política
  documentada.
- `forbidNonWhitelisted: true` hace visible el error en requests externos.
- `transform: true` solo se usa con transformaciones deliberadas.
- UUID, email, URL, enum, longitud, rango y fechas se validan en DTOs.
- Las reglas que requieren consultar datos o estado actual viven en el service.
- Joi queda reservado para environment variables.

## Idempotencia y concurrencia

Crear quote/order, convertir lead, convertir quote y ejecutar acciones externas
puede requerir `Idempotency-Key`. La task explica alcance, persistencia, respuesta
repetida y conflicto. No se afirma idempotencia solo porque existe un unique.

Los `PATCH` que dependen del estado actual deben detectar transiciones inválidas;
inventario, folios y conversiones usan transacciones y locks específicos.

## Permisos y auditoría

Los permisos siguen `<resource>:<action>`:

```text
customers:create
customers:read
customers:update
customers:archive
customers:assign
```

Cada endpoint tenant-scoped pasa por Authentication, Tenant Context, Permission
y CASL cuando aplique. La auditoría registra actor, tenant, recurso, acción,
correlation ID y cambios permitidos, no el request completo sin filtrar.

## Compatibilidad con el frontend futuro

`NexusCRM-Web` conocerá la organización seleccionada y enviará el header. CORS
permitirá únicamente orígenes configurados; las cookies usarán `credentials` y
la política SameSite/Secure definida por ambiente. Separar repositorios no
cambia el contrato ni autoriza `*` con credenciales.
