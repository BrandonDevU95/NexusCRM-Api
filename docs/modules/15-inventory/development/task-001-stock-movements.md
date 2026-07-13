# Development task 001: stock, adjustments y transfers

**Código:** `DEV-INV-A-001`
**Vienes de:** `../LEARNING-PATH.md`, Recorrido A paso 2.
**Regresa a:** `../LEARNING-PATH.md`, Recorrido A paso 3.
**No continúes hasta:** demostrar ledger+projection atómico bajo concurrencia.

## Tenant

Todos los endpoints exigen `X-Organization-Id`. Guard valida membership activa y
crea tenant context; service filtra cada parent/stock por ese ID. Rechaza tenant
en body y no lo toma del JWT.

## Endpoints/permisos A

- CRUD/inactivate warehouses y locations: `warehouses:manage`.
- `GET /inventory/stocks`: `inventory:read`, filtros product/warehouse/location/low.
- `GET /inventory/movements`: `inventory:read`, paginado por cursor.
- `POST /inventory/receipts`: `inventory:adjust`.
- `POST /inventory/issues`: `inventory:adjust`, nunca para venta aún.
- `POST /inventory/adjustments`: `inventory:adjust`, motivo obligatorio.
- `POST /inventory/transfers`: `inventory:transfer`.
- `GET /inventory/alerts`: `inventory:read`; acknowledge usa
  `POST /inventory/alerts/:id/acknowledge` con `inventory:adjust`.

DTOs usan decimal exacto, quantity positiva, idempotency key, request fingerprint derivado, UUIDs, reason,
fechas/rangos y límites. No aceptan `newStock` ni deltas arbitrarios desde cliente.

## Algoritmo transaccional

Para un movement simple:

1. Valida membership/permiso y parents por tenant; product activo y tracked.
2. Inicia transacción y busca key: fingerprint igual devuelve resultado;
   fingerprint distinto produce `409`.
3. Obtén/crea stock y bloquea la fila para actualización.
4. Deriva deltas según command type; nunca confía en deltas del DTO.
5. Calcula balances y rechaza negativos o reserved > onHand.
6. Inserta movement con balances posteriores.
7. Actualiza stock projection/version.
8. Abre/actualiza/resuelve low-stock alert según available.
9. Registra audit/outbox y confirma.

Transfer bloquea origen y destino en orden determinista, inserta un
`inventory_transfer` y sus movements hijos `TRANSFER_OUT`/`TRANSFER_IN` con
`transfer_id`, y actualiza ambos stocks en una transacción. No enlaza movements
entre sí ni permite misma location.

## Reglas

- Inactivar warehouse/location con stock o reservas no cero se rechaza.
- Adjustment exige motivo específico y audit before/after.
- ISSUE no puede reducir below zero; no hay negative stock/backorder en v1.
- Available/reservable suma exclusivamente locations ACTIVE de tipo SELLABLE;
  DAMAGED, QUARANTINE, RECEIVING y SHIPPING no aportan disponibilidad.
- Balance nunca se reconstruye editando movements. Una corrección crea otro
  movement compensatorio.
- Cost valuation, lots, serials y expirations están fuera de alcance.
- Alert event se emite solo al abrir/cambiar/resolver, no en cada GET.

## Orden de implementación

1. Warehouses/locations y queries.
2. Stock reader con available derivado.
3. Transaction service receipt/issue/adjustment.
4. Transfer aggregate, lock ordering y dos movements hijos.
5. Alert lifecycle.
6. Policies, Swagger, audit y eventos.

Eventos: `inventory.received`, `inventory.adjusted`, `inventory.transferred`,
`inventory.stock_low`, `inventory.stock_recovered`.
