# Development task 002: conversación, adjuntos y timeline

**Código:** `DEV-TICKET-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 3.
**Regresa a:** `../LEARNING-PATH.md`, paso 4.
**No continúes hasta:** separar public/internal y comprobar notificación/archivo atómicos.

## Prerrequisito de uploads; no reinstalar

Attachments reutiliza `multer@2.2.0` y `@types/multer@2.2.0`, instalados en
`../../09-activities/development/task-001-activities-timeline.md`. No ejecutes
otro `pnpm add`. Confirma versiones exactas en `package.json` y que el lockfile
proviene de aquel checkpoint. Tickets agrega validación/policies propias, pero no
otra librería multipart.

## Tenant

Mantén `X-Organization-Id`, membership y queries tenant-scoped. No permitas tenant
en body/JWT. Valida ticket/comment/article/contact por organización.

## Conversación y visibilidad

- `POST /tickets/:id/replies` con `tickets:reply` crea comment PUBLIC de USER.
- `POST /tickets/:id/internal-notes` con `tickets:internal-comment` crea INTERNAL.
- `POST /tickets/:id/customer-replies` es un adapter interno protegido para
  registrar CONTACT; no es API pública anónima.
- `PATCH /tickets/:id/comments/:commentId` permite edición acotada al autor/manager
  y registra editedAt/audit; terminales no reescriben evidencia sensible.
- `GET /tickets/:id/comments` filtra INTERNAL según permiso. Nunca descargues
  todo y filtres después.

Una respuesta pública de agente fija `first_response_at` solo una vez y actualiza
`last_agent_response_at`. Una customer response actualiza
`last_customer_response_at` y, si estaba WAITING_CUSTOMER, lo devuelve a
IN_PROGRESS con history en la misma transacción. Internal note no dispara mensaje
al customer ni cambia first response.

Reply/internal note/attachment reciben idempotencyKey y guardan fingerprint en la
fila correspondiente. Misma key+fingerprint devuelve el mismo subresource; misma
key con otro body/metadata responde `409`.

## Adjuntos

Endpoints de iniciar/finalizar upload o registrar metadata exigen
`tickets:attach`. Valida allowlist MIME real, tamaño, checksum, storage key emitida
por servidor y visibility igual al comment cuando existe. DB no guarda binario.
Si storage termina pero DB falla, ejecuta limpieza compensatoria; si DB termina y
evento falla, outbox reintenta notificación sin duplicar.

## Contrato para Knowledge Base B

En esta rama no crees endpoints ni tabla de links. Proporciona una operación del
Tickets service que confirme ticket existente/accesible bajo tenant context sin
exponer su repository. Después de integrar Tickets, la Pasada B de Knowledge Base
creará `ticket_knowledge_articles` y coordinará ambos services.

Ese flujo posterior exigirá article del mismo tenant, permisos de lectura/link y
visibilidad válida. Artículo INTERNAL nunca se incluirá en una respuesta pública.

## Timeline e integración

El customer timeline del módulo 09 agrega tickets created/status/public reply/
closed como adaptador de lectura. No copies hechos a `activities`. Una consulta
del timeline aplica permisos: internal comments no se proyectan a roles sin acceso.

Notifications consume eventos de assignment, critical priority, public reply,
waiting y close. Tickets no envía email directamente.

## Orden de implementación

1. Comments query/write con visibility en SQL.
2. Métricas de first/last response y transición por customer reply.
3. Attachment metadata y compensación storage.
4. Frontera tenant-safe que consumirá Knowledge Base B.
5. Timeline adapter.
6. Policies, Swagger, audit/outbox/notifications.

## Errores

- Ticket/comment de otro tenant: `404`; article/link se prueba en Knowledge Base B.
- Internal sin permiso: `404/403` según política anti-enumeración consistente.
- Contact no pertenece a customer: `422`.
- Archivo inválido: `422`; storage temporal fallido: `503` sin row huérfana.
- Reply a CLOSED sin reopen: `409`.
