# Ruta de aprendizaje: productos y servicios

**Código:** `MOD-11`

## Objetivo

Construir el catálogo vendible con SKU, categoría, unidad, costo, precio base,
impuesto sugerido y bandera de inventario. Producto y servicio comparten agregado,
pero un servicio nunca controla existencias.

## Vienes de

- Platform, Organizations, Security B y Audit inicial integrados.
- Puede trabajarse en paralelo al CRM comercial después de esos cimientos; revisa
  el [mapa de dependencias](../../project/MODULE-DEPENDENCIES.md).

## Rama exacta

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-products-services
```

## Recorrido único

1. Ve a `database/task-001-products-schema.md`, sección **Diccionario completo**; regresa después de `up/down/up`.
2. Ve a `development/task-001-product-catalog.md`, sección **Orden de implementación**; regresa al terminar endpoints y precio base.
3. Ve a `seeds/task-001-products-seed.md`, sección **Dataset**; regresa tras dos ejecuciones.
4. Ve a `tests/task-001-products-tests.md`, sección **Matriz mínima**; regresa para cierre.

## Registro de avance

- [ ] Rama `sdd/add-products-services` creada desde `main` limpio.
- [ ] `DB-PROD-001`: schema, UQ/FK tenant y migración `run/revert/run` verificados.
- [ ] `DEV-PROD-001`: catalog, cost visibility y base-price history completos.
- [ ] `SEED-PROD-001`: EntityManager del runner y doble ejecución comprobados.
- [ ] `TEST-PROD-001`: unit/integration/E2E y cross-tenant direct insert pasan.
- [ ] Diff/commits revisados; rama publicada y PR aprobado.
- [ ] Merge `--no-ff` integrado y siguiente destino Price Lists confirmado.

## Commits

```powershell
git add src/products/entities src/database/migrations
git commit -m "feat(database): add products and services schema"
git add src/products
git commit -m "feat(products): add product catalog management"
git add src/seed
git commit -m "feat(seed): add deterministic product catalog"
git add src/products test
git commit -m "test(products): cover catalog and base prices"
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
git push -u origin sdd/add-products-services
gh pr create --base main --head sdd/add-products-services --title "feat(products): add products and services"
```

Después de aprobación:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-products-services
git push origin main
git branch -d sdd/add-products-services
git push origin --delete sdd/add-products-services
```

## Definition of Done

- SKU y codes son únicos dentro de organización, no globalmente.
- Servicio implica `tracks_inventory=false` por constraint y regla de dominio.
- Unidad/categoría/impuesto pertenecen al mismo tenant.
- Dinero usa `numeric(19,4)` y currency ISO de tres letras.
- Cambio de precio base actualiza snapshot e historial en una transacción.
- Registros usados por documentos no se borran; se inactivan/archivan.
- Listados, permisos, auditoría, seed y tres niveles de tests están completos.

## Siguiente destino

Continúa en `../12-price-lists/LEARNING-PATH.md` y después en Inventory A cuando
lo indique su orquestador.
