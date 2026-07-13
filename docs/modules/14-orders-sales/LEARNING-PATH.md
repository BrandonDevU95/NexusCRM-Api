# Ruta de aprendizaje: órdenes y ventas

**Código:** `MOD-14`

## Objetivo

Crear orders manuales o desde quote aceptada, conservar snapshots financieros,
confirmar/cancelar sin borrar historial y dejar un contrato explícito para que
Inventory B implemente reservas, surtidos parciales y devoluciones.

## Vienes de

- Quotes integrado.
- `../15-inventory/LEARNING-PATH.md`, **Checkpoint A** integrado: warehouses,
  locations, stocks y movements existen.
- No inicies si Inventory A no está en `main`.

## Rama exacta

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-orders-sales
```

## Recorrido único

1. Ve a `database/task-001-orders-schema.md`, sección **Diccionario completo**; regresa tras `up/down/up`.
2. Ve a `development/task-001-order-creation-conversion.md`, sección **Conversión quote → order**; regresa al completar drafts y conversión.
3. Ve a `development/task-002-order-lifecycle-contract.md`, sección **Contrato con Inventory B**; regresa al cerrar lifecycle base.
4. Ve a `seeds/task-001-orders-seed.md`, sección **Dataset base**; regresa tras dos ejecuciones.
5. Ve a `tests/task-001-orders-tests.md`, sección **Matriz base**; regresa cuando pase.
6. Ejecuta verificación e integra esta rama.
7. **Regresa a** `../15-inventory/LEARNING-PATH.md`, Checkpoint B. Orders no cumple su DoD comercial completa hasta terminar Inventory B.

## Registro de avance

- [ ] Inventory A está integrado en `main`.
- [ ] Rama `sdd/add-orders-sales` creada desde `main` limpio.
- [ ] `DB-ORDER-001`: accepted revision, snapshots e idempotencia migrados.
- [ ] `DEV-ORDER-001/002`: manual/conversion/lifecycle base completos.
- [ ] `SEED-ORDER-001`: doble ejecución mediante EntityManager del runner.
- [ ] `TEST-ORDER-001`: unit/integration/E2E y conversión concurrente pasan.
- [ ] Push, PR y merge `--no-ff` completados.
- [ ] Quality gate/release `v0.5.0` publicado con limitación B documentada.
- [ ] Regreso a Inventory B confirmado.

## Commits

```powershell
git add src/orders/entities src/database/migrations
git commit -m "feat(database): add orders schema"
git add src/orders src/quotes
git commit -m "feat(orders): add manual and quote order creation"
git add src/seed
git commit -m "feat(seed): add deterministic orders dataset"
git add src/orders test
git commit -m "test(orders): cover creation conversion and lifecycle"
```

## Verificación, push e integración

```powershell
git status
git diff --check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git push -u origin sdd/add-orders-sales
gh pr create --base main --head sdd/add-orders-sales --title "feat(orders): add orders and sales"
```

Después de aprobación:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-orders-sales
git push origin main
git branch -d sdd/add-orders-sales
git push origin --delete sdd/add-orders-sales
```

## Cierre y release `v0.5.0`

Este tag cierra **Orders and sales base**: quotes convertibles, orders manuales,
snapshots, lifecycle base e Inventory A. La nota del release debe declarar que la
confirmación de tracked items, fulfillment y returns se completa en `v0.6.0` con
Inventory B.

Sobre `main` ya integrado ejecuta exactamente:

```powershell
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
docker compose --env-file .env.test --profile test up -d database_test
pnpm test:migrations
pnpm seed:run -- --env-file .env.test --module all --data-kind demo
pnpm seed:run -- --env-file .env.test --module all --data-kind demo
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm build
git diff --check
git status --short --branch
git tag -a v0.5.0 -m "v0.5.0 - orders and sales base"
git push origin v0.5.0
gh release create v0.5.0 --title "v0.5.0 - Orders and sales base" --generate-notes
```

`test:migrations` usa la base de prueba desechable, aplica todo el historial,
revierte la última migración y la reaplica. No crees el tag si el seed doble
cambia conteos, el status no está limpio, tracked orders se confirmaron sin
reservas, la conversión duplica documentos o alguna suite/build falla.

## Definition of Done base

- Manual y quote conversion preservan snapshots/totales.
- Una quote produce máximo una order y CONVERTED ocurre en la misma transacción.
- Draft es editable; documentos confirmados no reescriben items financieros.
- Status history es append-only y cancelación exige motivo/permiso.
- Producto con inventory tracking no se confirma sin el puerto de reserva.
- Tenant, audit, seed y tests base pasan.

## DoD completa después de Inventory B

- Confirmar reserva todo el inventario requerido atómicamente.
- Surtido parcial/completo actualiza order por cantidades reales.
- Cancelar libera remanente; devolución compensa mediante movement.
- No hay stock negativo ni doble fulfillment/return.
