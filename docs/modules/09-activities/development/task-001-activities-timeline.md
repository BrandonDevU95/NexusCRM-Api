# Development task 001: actividades y timeline

**Código:** `DEV-ACT-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 3.
**Regresa a:** `../LEARNING-PATH.md`, paso 4.
**No continúes hasta:** probar tenant scope, estados, permisos y rollback de archivos/metadatos.

## Dependencias que se instalan aquí

Esta es la primera tarea que recibe archivos `multipart/form-data` y publica
eventos locales de dominio. Instala una sola vez:

```powershell
pnpm add -E multer@2.2.0 @nestjs/event-emitter@3.1.0
pnpm add -D -E @types/multer@2.2.0
```

- Multer procesa el stream multipart y permite configurar límites/almacenamiento;
  no sustituye la validación de MIME real, checksum ni autorización.
- Los tipos son de desarrollo y coinciden con Multer 2/Express 5.
- Event Emitter desacopla listeners locales después del commit. No garantiza
  entrega tras un crash y no sustituye el outbox de Automatizaciones.

Confirma versiones exactas en `package.json` y el cambio intencional en
`pnpm-lock.yaml`. No instales estas dependencias otra vez en Tickets.

## Contrato de tenant

Todo endpoint exige `X-Organization-Id`. El guard valida una membership activa y
crea el tenant context. El service incluye ese ID en la consulta inicial. No
aceptes `organizationId` en body, no lo tomes de un JWT y no busques solo por `id`.

## Casos de uso

- Crear actividad relacionada con uno o varios recursos compatibles del tenant.
- Consultar detalle y listado paginado con filtros combinables.
- Actualizar una actividad solamente mientras su estado lo permita.
- Iniciar, completar, cancelar y archivar mediante acciones explícitas.
- Agregar/editar/archivar comentarios con autoría.
- Registrar metadatos de adjunto después de validar archivo y storage.
- Consultar timeline de customer, contact, lead o deal.

## Endpoints y permisos

| Endpoint | DTO/entrada principal | Permiso |
|---|---|---|
| `POST /activities` | `CreateActivityDto` | `activities:create` |
| `GET /activities` | `QueryActivitiesDto` | `activities:read` |
| `GET /activities/:id` | params UUID | `activities:read` |
| `PATCH /activities/:id` | `UpdateActivityDto` | `activities:update` |
| `POST /activities/:id/start` | versión esperada | `activities:update` |
| `POST /activities/:id/complete` | `CompleteActivityDto` | `activities:complete` |
| `POST /activities/:id/cancel` | `CancelActivityDto` | `activities:update` |
| `POST /activities/:id/comments` | `CreateActivityCommentDto` | `activities:comment` |
| `PATCH /activities/:id/comments/:commentId` | `UpdateActivityCommentDto` | `activities:comment` y autor/policy |
| `POST /activities/:id/attachments` | metadatos previamente validados | `activities:attach` |
| `GET /customers/:id/timeline` | `QueryTimelineDto` | `customers:read` y `activities:read` |

Todos los listados aceptan `page`, `limit` acotado, rango de fechas, tipo,
estado, owner y uno de los IDs relacionados. Rechaza filtros desconocidos.

## Reglas de negocio

- Comprueba que customer/contact/lead/deal existan bajo el tenant activo. Si se
  proporciona contact y customer, el contacto debe pertenecer a ese customer.
- Si se proporciona deal y customer/contact, deben coincidir con el deal.
- Una nota puede crearse ya `COMPLETED`; una llamada planeada inicia `SCHEDULED`.
- No se edita contenido sustantivo después de `COMPLETED` o `CANCELLED`; una
  corrección queda como comentario o nueva actividad.
- `SCHEDULED → IN_PROGRESS → COMPLETED` y `SCHEDULED/IN_PROGRESS → CANCELLED` son
  transiciones válidas. Cada DTO de acción incluye idempotencyKey; el service
  persiste fingerprint en `activity_status_history`. Retry idéntico devuelve el
  mismo resultado; misma key con otro payload responde `409`.
- Completar registra `completedBy`, `completedAt`, `occurredAt` y outcome cuando
  corresponda, dentro de una transacción con el audit event.
- Valida extensión, MIME real, tamaño, checksum y nombre. La base guarda solo
  metadatos; no guarda binarios ni confía en una ruta enviada por el cliente.
- Comment/attachment también persisten key+fingerprint: retry idéntico retorna el
  mismo subresource y una key reutilizada con otro contenido produce `409`.

## Timeline

Construye un `TimelineQueryService` de lectura. En esta etapa combina activities
y los historiales disponibles de customer, lead y deal. Quotes, orders y tickets
registrarán adaptadores cuando existan. Cada entrada expone `eventType`, fecha,
actor, resumen y referencia, con paginación por cursor estable `(occurredAt, id)`.

No insertes copias en `customer_timeline`: duplicar hechos obligaría a sincronizar
dos fuentes y rompería el orden ante rollback.

## Orden de implementación

1. Enums/códigos y DTOs de alta, consulta y transiciones.
2. Consultas tenant-scoped, memberships y validación cruzada de padres.
3. Crear/listar/detalle/editar.
4. Máquina de estados y transacciones.
5. Comentarios y metadatos de adjuntos.
6. Timeline read model con cursor.
7. Policies, Swagger, audit events y manejo de errores.

## Auditoría y eventos

Emite después de confirmar: `activity.created`, `activity.completed`,
`activity.cancelled`, `activity.comment_added`, `activity.attachment_added`.
Audita before/after para cambio de estado, reasignación, archivo y retiro de
adjunto; redacta descripción/comentarios si la política de auditoría lo exige.

## Errores esperados

- Parent inexistente o de otro tenant: `404`.
- Relación cruzada inconsistente: `422`.
- Transición inválida o edición terminal: `409`.
- Falta de permiso: `403`.
- Archivo no permitido o demasiado grande: `422`.
