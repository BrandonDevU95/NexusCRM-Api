# Ruta de aprendizaje: inventario A/B

**Código:** `MOD-15`

## Objetivo

Aprender inventario como ledger: el saldo es una proyección actualizada únicamente
por movements. El módulo se trabaja en dos ramas porque reservations necesitan un
`order_item` que todavía no existe durante Inventory A.

## Vienes de

- Products integrado.
- Para **Checkpoint A**, Quotes debe estar integrado y Orders todavía no.
- Para **Checkpoint B**, `../14-orders-sales/LEARNING-PATH.md` debe estar integrado.
- Revisa [dependencias](../../project/MODULE-DEPENDENCIES.md) y
  [Definition of Done](../../project/DEFINITION-OF-DONE.md).

---

## Checkpoint A: almacenes, stock y movements

### Rama exacta A

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-inventory-foundation
```

### Recorrido A

1. Ve a `database/task-001-inventory-foundation-schema.md`, sección **Diccionario completo**; regresa después de `up/down/up`.
2. Ve a `development/task-001-stock-movements.md`, sección **Algoritmo transaccional**; regresa al cerrar receipt/adjust/transfer/alerts.
3. Ve a `seeds/task-001-inventory-foundation-seed.md`, sección **Dataset A**; regresa tras dos ejecuciones.
4. Ve a `tests/task-001-inventory-foundation-tests.md`, sección **Matriz A**; regresa y verifica.

### Registro de avance A

- [ ] Rama `sdd/add-inventory-foundation` creada desde `main` limpio.
- [ ] `DB-INV-A-001`: warehouses/locations/stocks/transfers/movements/alerts migrados.
- [ ] `DEV-INV-A-001`: ledger, locks, transfer e idempotencia completos.
- [ ] `SEED-INV-A-001`: doble ejecución sin reaplicar deltas.
- [ ] `TEST-INV-A-001`: concurrencia, projection y direct cross-tenant insert pasan.
- [ ] Push, PR y merge `--no-ff` A completados.

### Commits A

```powershell
git add src/inventory/entities src/database/migrations
git commit -m "feat(database): add inventory stock and movements schema"
git add src/inventory
git commit -m "feat(inventory): add stock ledger transfers and alerts"
git add src/seed
git commit -m "feat(seed): add deterministic inventory foundation"
git add src/inventory test
git commit -m "test(inventory): cover stock movements and transfers"
```

### Push e integración A

```powershell
git status
git diff --check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git push -u origin sdd/add-inventory-foundation
gh pr create --base main --head sdd/add-inventory-foundation --title "feat(inventory): add stock and movement foundation"
```

Después de aprobación:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-inventory-foundation
git push origin main
git branch -d sdd/add-inventory-foundation
git push origin --delete sdd/add-inventory-foundation
```

### Salto obligatorio

Ve ahora a `../14-orders-sales/LEARNING-PATH.md`. Integra Orders y después regresa
aquí. No continúes a B si `order_items` no existe en `main`.

---

## Checkpoint B: reservations, fulfillment y returns

### Rama exacta B

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-inventory-order-operations
```

### Recorrido B

1. Ve a `database/task-002-inventory-order-schema.md`, sección **Diccionario completo**; regresa después de `up/down/up`.
2. Ve a `development/task-002-reservations-fulfillment-returns.md`, sección **Transacciones críticas**; regresa al cerrar integración con Orders.
3. Ve a `seeds/task-002-inventory-order-seed.md`, sección **Dataset B**; regresa tras dos ejecuciones.
4. Ve a `tests/task-002-inventory-order-tests.md`, sección **Matriz B**; regresa para verificación completa.

### Registro de avance B

- [ ] Orders y tag `v0.5.0` existen en `main`.
- [ ] Rama `sdd/add-inventory-order-operations` creada desde `main` limpio.
- [ ] `DB-INV-B-002`: reservations/fulfillments/returns migrados y revertidos.
- [ ] `DEV-INV-B-002`: reserve/consume/release/return idempotentes completos.
- [ ] `SEED-INV-B-002`: doble ejecución dentro de la transacción del runner.
- [ ] `TEST-INV-B-002`: suites Inventory A + Orders + B pasan juntas.
- [ ] Push, PR y merge `--no-ff` B completados.
- [ ] Quality gate, status limpio y release `v0.6.0` publicados.

### Commits B

```powershell
git add src/inventory/entities src/orders/entities src/database/migrations
git commit -m "feat(database): add reservations fulfillments and returns schema"
git add src/inventory src/orders
git commit -m "feat(inventory): add order reservation fulfillment and returns"
git add src/seed
git commit -m "feat(seed): add deterministic inventory order operations"
git add src/inventory src/orders test
git commit -m "test(inventory): cover reservations fulfillment and returns"
```

### Verificación, push e integración B

```powershell
git status
git diff --check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git push -u origin sdd/add-inventory-order-operations
gh pr create --base main --head sdd/add-inventory-order-operations --title "feat(inventory): add order inventory operations"
```

Después de aprobación:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-inventory-order-operations
git push origin main
git branch -d sdd/add-inventory-order-operations
git push origin --delete sdd/add-inventory-order-operations
```

### Cierre y release `v0.6.0`

Después de integrar Inventory B, el hito cierra reserva all-or-nothing,
fulfillment parcial/completo, liberación, devolución y movimientos compensatorios
sobre Orders. Confirma primero que el tag `v0.5.0` existe y ejecuta sobre `main`:

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
git tag -a v0.6.0 -m "v0.6.0 - inventory order operations"
git push origin v0.6.0
gh release create v0.6.0 --title "v0.6.0 - Inventory order operations" --generate-notes
```

`test:migrations` ejecuta `run -> revert -> run` contra la base de prueba
desechable. No etiquetes si el seed doble cambia conteos, status no está limpio,
ledger/projection difieren, existe oversell, un retry duplica movements o las
suites/build Products/Quotes/Orders/Inventory no pasan juntas.

## Definition of Done completa

- Warehouse/location/stock están tenant-scoped y quantity disponible es derivada.
- Ningún endpoint actualiza stock directamente: todo cambio crea movement.
- Inventory transfer parent crea exactamente un OUT y un IN en una transacción.
- Solo locations SELLABLE aportan available/reservable; damaged/quarantine nunca.
- Confirmar order reserva todos los tracked items o ninguno.
- Fulfillment POSTED parcial reduce on-hand/reserved exactamente una vez y no se cancela.
- Cancelación libera remanente y return crea movement compensatorio.
- Row locks/idempotency evitan oversell y double processing.
- Low-stock alert se abre una vez y se resuelve al recuperar nivel.
- Seeds A/B dobles y suites A/B/Orders pasan.

## Siguiente destino

Continúa de acuerdo con el roadmap después de publicar `v0.6.0` y documentar
migraciones, seeds, límites operativos y pruebas de concurrencia en el release.
