# Development task 001: creación manual y desde quote

**Código:** `DEV-ORDER-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 2.
**Regresa a:** `../LEARNING-PATH.md`, paso 3.
**No continúes hasta:** convertir una quote una sola vez con rollback completo.

## Dependencia monetaria ya disponible

Orders reutiliza `decimal.js@10.6.0`, instalado por Price Lists y ya usado por
Quotes. No repitas `pnpm add`: confirma la versión exacta en `package.json` y usa
la misma política de precisión/redondeo al crear una order manual o copiar totals.

## Tenant

Todos los endpoints usan `X-Organization-Id`; guard valida membership activa y
crea tenant context. Services filtran por tenant. Rechaza `organizationId` en body
y no usa tenant fijado en JWT.

## Endpoints base

- `POST /orders` `orders:create`: draft manual.
- `POST /quotes/:quoteId/order` `orders:create` + `quotes:convert`: conversión.
- `GET /orders`/`:id` `orders:read`: filtros/paginación.
- `PATCH /orders/:id` y CRUD items `orders:update`: solo draft manual.
- `POST /orders/:id/confirm` `orders:update`/`orders:confirm`.
- `POST /orders/:id/cancel` `orders:cancel`.

DTOs manuales validan customer/contact/deal, owner membership, `orderedAt`, items,
dirección, money y currency. Conversión recibe `idempotencyKey`; el servidor
calcula/persiste `requestFingerprint` y no acepta items/totales del cliente.

## Conversión quote → order

1. Carga quote por `(quoteId, organizationId)` con lock y su
   `accepted_revision_id`/revision items.
2. Exige status `ACCEPTED`, revision aceptada, no expirada/cancelada y sin order.
3. Busca `(organizationId,idempotencyKey)`: fingerprint igual devuelve la order
   previa; distinto devuelve `409`.
4. Valida customer/contact/deal y owner membership todavía accesibles; no recalcula precios.
5. Reserva folio ORDER con number sequence del tenant.
6. Copia party/legal/contact/address/totals y cada immutable revision item; guarda
   `quoteRevisionId`, key y fingerprint.
7. Inserta order/items/history inicial.
8. Cambia quote a `CONVERTED`, fija `converted_at` y agrega quote history con la
   misma idempotency identity coordinada.
9. Guarda audit/outbox events de ambos agregados y confirma una transacción.

Unique quote y unique idempotency key son defensas complementarias; no prometas
idempotencia basándote únicamente en el natural unique de quote.

## Manual

Una order manual resuelve prices/taxes al crear y guarda los mismos snapshots que
quote. Solo `DRAFT` permite cambiar items. Si todos son services, puede confirmar
sin Inventory; si algún item tiene `tracks_inventory_snapshot=true`, la
confirmación requiere el puerto implementado por Inventory B.

## Orden de implementación

1. DTO/query y creación manual draft.
2. Calculadora compartida por contrato, no duplicada informalmente.
3. Conversión desde accepted revision con idempotencia persistida.
4. List/detail tenant-scoped.
5. Permisos, Swagger, auditoría/eventos `order.created`, `quote.converted`.
