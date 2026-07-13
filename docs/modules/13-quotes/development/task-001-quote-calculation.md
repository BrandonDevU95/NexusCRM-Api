# Development task 001: draft, items y cálculo

**Código:** `DEV-QUOTE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 2.
**Regresa a:** `../LEARNING-PATH.md`, paso 3.
**No continúes hasta:** reproducir totales exactos y rollback de folio/items.

## Dependencia monetaria ya disponible

La calculadora reutiliza `decimal.js@10.6.0`, instalado en
`../../12-price-lists/development/task-001-effective-price.md`. No repitas
`pnpm add`. Si no aparece con versión exacta en `package.json`/lockfile, vuelve al
checkpoint de Price Lists antes de implementar subtotal, descuentos o impuestos.

## Tenant

`X-Organization-Id` obligatorio; guard valida membership y crea context. El
service consulta con tenant desde el inicio. Rechaza `organizationId` en payload
y no lo fija en JWT.

## Endpoints y DTO

- `POST /quotes` con `quotes:create`: crea header, folio e items.
- `GET /quotes`/`:id` con `quotes:read`: filtros status/customer/deal/owner/date.
- `PATCH /quotes/:id` con `quotes:update`: solo draft permitido.
- `POST/PATCH/DELETE /quotes/:id/items` con `quotes:update`: solo draft.
- `POST /quotes/:id/recalculate` con `quotes:update`: recalcula desde snapshots
  actuales del draft; no reconsulta automáticamente al leer.
- `POST /quotes/:id/submit-approval` con `quotes:update`.

DTOs: `CreateQuoteDto`, `UpdateQuoteDto`, `CreateQuoteItemDto`,
`UpdateQuoteItemDto`, `QueryQuotesDto`. Money/cantidad/porcentaje usan decimal
seguro; UUIDs, currency, dates civiles, arrays y límites se validan.

## Algoritmo de cálculo

Por cada item, en este orden:

1. Valida product activo y mismo tenant.
2. Resuelve price con módulo 12 o acepta precio manual solo con
   `quotes:override-price`; guarda `overrideReason` y
   `overriddenByMemberId`, no solo un audit efímero.
3. Copia SKU, name, description, unit, product type, price source y tax code/rate.
4. Calcula `lineSubtotal = quantity × unitPrice` con precisión decimal.
5. Calcula discount percent o fixed; no permite descuento mayor al subtotal.
6. `taxableBase = lineSubtotal - discountTotal`.
7. Calcula impuesto sobre taxable base según tax snapshot.
8. `lineTotal = taxableBase + taxTotal`.
9. Suma líneas y redondea en el punto definido por la política de currency; no
   distribuyas centavos al azar.

El backend ignora totales enviados por cliente. Persiste header/items en la
transacción del caso de uso. Folio usa `number_sequences` con bloqueo/operación atómica; si
falla un item, no queda quote ni folio consumido según la política de secuencia
documentada.

## Reglas

- Customer/contact/deal/owner membership/list comparten tenant; contact pertenece a customer
  y deal corresponde al customer.
- Solo `DRAFT` permite cambios. Cada cambio sustantivo incrementa
  `draft_version`. Todavía no existe PDF: documents pertenecen a revisions.
- Currency del documento, price list y items debe coincidir; no hay FX implícito.
- Quote vacía puede guardarse draft, pero no enviarse a aprobación.
- Product se puede inactivar después; snapshots siguen válidos.

## Orden de implementación

1. Folio y creación de header tenant-scoped.
2. Price resolver y snapshot builder.
3. Calculadora decimal pura.
4. Mutación de items, override persistido y versionado transaccional.
5. List/detail con proyección segura.
6. Permisos, Swagger, audit event `quote.created/updated`.
