# Development task 002: workflow, aprobación, envío y PDF

**Código:** `DEV-QUOTE-002`
**Vienes de:** `../LEARNING-PATH.md`, paso 3.
**Regresa a:** `../LEARNING-PATH.md`, paso 4.
**No continúes hasta:** comprobar estados, approvals, expiración y PDF inmutable.

## Dependencias que se instalan aquí

Esta es la primera tarea que genera un PDF comercial. Instala:

```powershell
pnpm add -E pdfkit@0.17.2
pnpm add -D -E @types/pdfkit@0.17.6
```

PDFKit produce el documento como stream; la aplicación conserva metadata,
checksum y storage key, no el binario en PostgreSQL. Los tipos 0.17.6 documentan
la misma línea API 0.17. Antes de cerrar, genera un PDF mínimo como smoke test,
verifica que el stream termina y que el archivo puede abrirse. No actualices a
otra línea 0.x sin una revisión deliberada.

## Tenant

Mantén `X-Organization-Id` obligatorio y query tenant-scoped. Ningún comando de
estado acepta organization en body ni confía en tenant del JWT.

## Máquina de estados

- `DRAFT → PENDING_APPROVAL` congela primero una `quote_revision` con party,
  legal/contact, addresses, totals y revision items; si falla, no cambia status.
- `PENDING_APPROVAL → APPROVED` al completar todas las aprobaciones requeridas.
- `PENDING_APPROVAL → REJECTED` con comentario obligatorio.
- `APPROVED → SENT` al registrar envío exitoso o manual confirmado.
- `SENT/APPROVED → ACCEPTED` con `quotes:accept`; fija
  `accepted_revision_id` a la revision aprobada/enviada.
- Estados no terminales vencidos → `EXPIRED` mediante job idempotente.
- Estado permitido → `CANCELLED` según policy y motivo.
- `ACCEPTED → CONVERTED` solo dentro de la transacción de Orders; Quotes no ofrece
  un endpoint independiente para marcarlo.

No edites una revision. Si una quote rechazada/corregible vuelve a draft mediante
acción explícita autorizada, conserva la revision anterior y el siguiente submit
crea `revision_number + 1`; approvals/documents previos siguen unidos a su revision.

## Endpoints/permisos

- `POST /quotes/:id/approve` `quotes:approve`, approver asignado.
- `POST /quotes/:id/reject` `quotes:approve`, comment requerido.
- `POST /quotes/:id/send` `quotes:send`.
- `POST /quotes/:id/accept` `quotes:accept`.
- La conversión se invoca desde Orders y exige `quotes:convert`; no existe un
  endpoint Quote que marque CONVERTED por separado.
- `POST /quotes/:id/cancel` `quotes:delete` o permiso específico de cancelación.
- `POST /quotes/:id/documents/pdf` `quotes:read` + policy de generación.
- `GET /quotes/:id/documents` `quotes:read`.

## Aprobaciones, documentos y transacciones

- La regla de approval puede depender del total/rol/configuración, pero al submit
  materializa approver membership, sequence y `quoteRevisionId`.
- Toda transición/approval recibe `idempotencyKey` y persiste
  `requestFingerprint`. Misma pareja devuelve el resultado anterior; misma key
  con otro fingerprint responde `409`, nunca crea dos histories.
- PDF usa solo snapshots de `quoteRevisionId`; key+fingerprint incluye revision,
  template y opciones para que un retry no genere dos documentos. Genera fuera de una
  transacción larga, sube a storage y registra metadatos/current de forma segura;
  limpia el objeto si falla la DB.
- Enviar registra canal/destinatario en audit/event sin almacenar secretos. La
  integración real de email pertenece a Notifications; esta fase puede registrar
  envío manual/adaptador controlado.

## Auditoría/eventos

Audita submit, decisión, envío, aceptación, expiración, cancelación y generación
de PDF. Emite `quote.approval_requested`, `quote.approved`, `quote.rejected`,
`quote.sent`, `quote.accepted`, `quote.expired`, `quote.cancelled`,
`quote.pdf_generated`. No emitas `quote.converted` hasta commit de Order.

## Orden de implementación

1. Freeze transaccional de revision e immutable revision items.
2. State machine/policies e idempotency persistida.
3. Approval materializado por revision y decisiones.
4. PDF por revision/checksum.
5. Send/accept/cancel/expire idempotentes.
6. Swagger, auditoría y eventos.
