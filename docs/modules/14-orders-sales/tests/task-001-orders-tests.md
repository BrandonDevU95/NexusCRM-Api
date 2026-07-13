# Test task 001: órdenes base

**Código:** `TEST-ORDER-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 5.
**Regresa a:** `../LEARNING-PATH.md`, paso 6.
**No continúes hasta:** pasar unit, integration y E2E base; deja lista extensión B.

## Matriz base

### Unit

- State machine base y bloqueo de edición confirmada.
- Copy mapper conserva party/legal/contact/address/totals/items de accepted revision.
- Manual calculator y policies.
- Tracked item detecta necesidad del puerto Inventory.

### Integration

- Unique folio/quote/revision item/line/idempotency key y checks financieros.
- Dos conversiones concurrentes dejan una sola order.
- Crear order + convertir quote + histories/audit hace commit o rollback completo.
- FKs RESTRICT preservan quote/product/customer usados.
- Insert directo order/item con organization A y revision/customer/member/product
  de B falla por FK compuesta.
- Retry igual devuelve la order guardada; misma key con fingerprint diferente da `409`.

### E2E

- Crear manual, listar, detalle, editar draft, confirm services y cancel.
- Convert accepted quote; repetir retorna misma idempotent result o `409`.
- OrderedAt de negocio no cambia al confirmar; confirmedAt sí se fija al transicionar.
- Quote no accepted/expirada/otro tenant: rechazo.
- Header ausente, membership inactiva, organizationId body, cross-tenant.
- Sin permisos create/confirm/cancel: `403`.
- Tracked order antes de B no confirma ni deja side effects.
- Auditoría e histories exactos.

## Pruebas que Inventory B extenderá

- Confirmar tracked order reserva todo o nada.
- Partial/full fulfillment actualiza estado.
- Cancel libera remaining.
- Return compensa stock y evita exceso.

No marques esas cuatro como completadas en esta rama; Inventory B tiene la
responsabilidad y su propio checkpoint.
