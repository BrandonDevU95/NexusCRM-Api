# Ruta de aprendizaje: listas de precios

**Código:** `MOD-12`

## Objetivo

Definir precios público, distribuidor, mayorista y especial; asignarlos a customers
y resolver un precio efectivo determinista por fecha, cantidad y prioridad.

## Vienes de

- `../11-products-services/LEARNING-PATH.md` y Customers integrados.
- Moneda/configuración de Platform disponible.

## Rama exacta

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-price-lists
```

## Recorrido único

1. Ve a `database/task-001-price-lists-schema.md`, sección **Diccionario completo**; regresa tras migración `up/down/up`.
2. Ve a `development/task-001-effective-price.md`, sección **Algoritmo de resolución**; regresa al cerrar endpoints/resolver.
3. Ve a `seeds/task-001-price-lists-seed.md`, sección **Dataset**; regresa tras segunda ejecución.
4. Ve a `tests/task-001-price-lists-tests.md`, sección **Matriz**; regresa para cierre.

## Registro de avance

- [ ] Rama `sdd/add-price-lists` creada desde `main` limpio.
- [ ] `DB-PRICE-001`: listas/items/assignments y FKs compuestas verificadas.
- [ ] `DEV-PRICE-001`: Decimal, precedence, cierres de items y default atómico completos.
- [ ] `SEED-PRICE-001`: doble ejecución dentro del EntityManager del runner.
- [ ] `TEST-PRICE-001`: unit/integration/E2E y configuración ambigua cubiertas.
- [ ] Diff/lockfile/commits revisados; push y PR completados.
- [ ] Merge `--no-ff` integrado y Quotes desbloqueado.

## Commits

```powershell
git add src/price-lists/entities src/database/migrations
git commit -m "feat(database): add price lists schema"
git add src/price-lists package.json pnpm-lock.yaml
git commit -m "feat(price-lists): add effective price resolution"
git add src/seed
git commit -m "feat(seed): add deterministic price lists"
git add src/price-lists test
git commit -m "test(price-lists): cover assignments and price resolution"
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
git push -u origin sdd/add-price-lists
gh pr create --base main --head sdd/add-price-lists --title "feat(price-lists): add effective pricing"
```

Después de aprobación, merge explícito:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-price-lists
git push origin main
git branch -d sdd/add-price-lists
git push origin --delete sdd/add-price-lists
```

## Definition of Done

- List/item/assignment pertenecen al mismo tenant y currency coherente.
- Vigencias usan intervalo claro `[valid_from, valid_to)`.
- Un item define precio fijo o descuento, nunca ambos ni ninguno.
- Resolución determina una sola lista por precedencia y explica la fuente.
- Un empate ambiguo produce conflicto de configuración, no resultado aleatorio.
- Quote podrá guardar snapshot sin consultar precios históricos después.
- Seed, permisos, auditoría y tres suites pasan.

## Siguiente destino

Continúa en `../13-quotes/LEARNING-PATH.md` cuando Deals esté integrado.
