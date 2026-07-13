# Ruta de aprendizaje: cotizaciones

**Código:** `MOD-13`

## Objetivo

Crear documentos comerciales versionados con folio, snapshots de producto/precio,
descuentos, impuestos, aprobación, envío, aceptación, expiración y PDF. Una quote
no reserva ni mueve inventario.

## Vienes de

- Deals, Customers, Contacts, Products, Price Lists, Platform numbering/taxes y
  Audit inicial integrados.
- Revisa [mapa de dependencias](../../project/MODULE-DEPENDENCIES.md) y
  [Definition of Done](../../project/DEFINITION-OF-DONE.md).

## Rama exacta

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-quotes
```

## Recorrido único

1. Ve a `database/task-001-quotes-schema.md`, sección **Diccionario completo**; regresa después de `up/down/up`.
2. Ve a `development/task-001-quote-calculation.md`, sección **Algoritmo de cálculo**; regresa al completar drafts/items.
3. Ve a `development/task-002-quote-workflow-documents.md`, sección **Máquina de estados**; regresa tras approval/send/accept/PDF.
4. Ve a `seeds/task-001-quotes-seed.md`, sección **Dataset**; regresa tras segunda ejecución.
5. Ve a `tests/task-001-quote-calculation-tests.md`, sección **Matriz**; regresa cuando pase.
6. Ve a `tests/task-002-quote-workflow-tests.md`, sección **Matriz**; regresa para cierre.

## Registro de avance

- [ ] Rama `sdd/add-quotes` creada desde `main` limpio.
- [ ] `DB-QUOTE-001`: draft, revisions, immutable items, approvals y documents migrados.
- [ ] `DEV-QUOTE-001`: Decimal, snapshots, override y cálculo verificados.
- [ ] `DEV-QUOTE-002`: revisión, approvals, PDF, estados e idempotencia completos.
- [ ] `SEED-QUOTE-001`: revisiones/estados reproducibles en doble ejecución.
- [ ] `TEST-QUOTE-001/002`: unit, integration, E2E y direct cross-tenant insert pasan.
- [ ] Diff/lockfile/commits revisados; push, PR y merge `--no-ff` completos.
- [ ] Inventory A señalado como siguiente checkpoint.

## Commits

```powershell
git add src/quotes/entities src/database/migrations
git commit -m "feat(database): add quotes schema"
git add src/quotes package.json pnpm-lock.yaml
git commit -m "feat(quotes): add calculations approvals and documents"
git add src/seed
git commit -m "feat(seed): add deterministic quotes dataset"
git add src/quotes test
git commit -m "test(quotes): cover calculations and quote workflow"
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
git push -u origin sdd/add-quotes
gh pr create --base main --head sdd/add-quotes --title "feat(quotes): add commercial quotations"
```

Después de aprobación:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-quotes
git push origin main
git branch -d sdd/add-quotes
git push origin --delete sdd/add-quotes
```

## Definition of Done

- Folio se asigna por organización mediante `number_sequences` dentro de la transacción.
- Cada submit congela revision + revision items inmutables con party/legal/contact/
  addresses, products, prices, taxes y totals.
- Totales se calculan en backend con decimal y redondeo documentado.
- Estados/approvals son explícitos; cambios terminales no reescriben el documento.
- Approval, acceptance y PDF apuntan a una revision persistida/checksum; manual
  price conserva reason y overridden member.
- Quote no consulta ni modifica Inventory.
- Orders será el único dueño de la conversión y garantiza una sola order por quote.
- Permisos, auditoría, seed y tres niveles de tests pasan.

## Siguiente destino

Antes de Orders completa **Inventory A** siguiendo
`../15-inventory/LEARNING-PATH.md`, checkpoint A. Ese orquestador te regresará a
`../14-orders-sales/LEARNING-PATH.md`.
