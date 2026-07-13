# Development task 001: ciclo de oportunidades

## Navegación

- **Código:** DEV-DEAL-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, paso 3.
- **No continúes hasta:** mover, ganar y perder deals dejando estado e historial coherentes.

## Casos de uso

Crear/listar/consultar/actualizar/archivar; asignar owner; agregar productos; mover etapa; pausar/reanudar; ganar/perder/cancelar; consultar historial, monto por etapa y vencidas.

## Contrato tenant

Las rutas `/deals` exigen `X-Organization-Id`. El guard valida membresía activa, crea tenant context y services filtran deal y cada FK por ese organization ID. Body y JWT no deciden tenant.

## Endpoints orientativos

- `POST /deals`, `GET /deals`, `GET /deals/:id`, `PATCH /deals/:id`, `DELETE /deals/:id`
- `PUT /deals/:id/owner`
- `PUT /deals/:id/products`
- `POST /deals/:id/stage-transitions`
- `POST /deals/:id/win`, `POST /deals/:id/lose`, `POST /deals/:id/cancel`
- `GET /deals/:id/stage-history`
- `GET /pipelines/:pipelineId/deals-summary`

## DTO validation

UUIDs, decimal money/quantity, ISO currency, probability 0–100, `amountSource` MANUAL/PRODUCTS, fecha ISO y filtros/paginación acotados. No acepta tenant, status terminal, timestamps ni history mediante update general. Con MANUAL exige `amount`; con PRODUCTS rechaza que el cliente controle `amount`.

## Cambio de etapa

Bloquea deal; carga target stage del mismo pipeline/tenant; valida transición y terminalidad; actualiza stage/status/probability/timestamp; inserta history/audit/outbox; commit único. Ganar y perder son casos específicos, no PATCH libre. Cambiar de pipeline requiere caso excepcional que mapee stage y preserve history.

## Productos y fuente del monto

Valida producto activo y mismo tenant. Conserva name/price/currency snapshot para estimación.

- `amount_source=MANUAL`: `amount` lo define una acción comercial autorizada; cambiar `deal_products` no lo sobrescribe.
- `amount_source=PRODUCTS`: cada cambio de products recalcula `amount` con aritmética decimal a partir de quantity, unit price y discount dentro de la misma transacción; el DTO no acepta amount manual.
- Cambiar de MANUAL a PRODUCTS recalcula inmediatamente. Cambiar de PRODUCTS a MANUAL exige el nuevo amount explícito. Ambos cambios se auditan.

## Permisos, auditoría y eventos

Usa `deals:create`, `deals:read`, `deals:update`, `deals:delete` y `deals:close`; además `customers:read` para enlaces. CASL limita owner/manager. Audita create, owner, products, stage, win/loss/cancel/archive. Emite `deal.created`, `deal.stage_changed`, `deal.won`, `deal.lost`, `deal.cancelled`.

## Errores

Referencia ajena `404`; stage fuera de pipeline, contact fuera de customer o owner fuera de tenant `422`; deal terminal `409`; sin close permission `403`.
