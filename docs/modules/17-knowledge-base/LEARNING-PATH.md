# Ruta de aprendizaje: base de conocimiento

## Identidad

| Dato | Valor |
| --- | --- |
| Alcance original | Módulo 17: Knowledge Base |
| Código | `KB` |
| Rama core | `sdd/add-knowledge-base` |
| Rama integración | `sdd/link-knowledge-to-tickets` |
| Hito | Parte de `v0.7.0`; Support Tickets crea el tag |

## Resultado esperado

Podrás crear, categorizar, etiquetar, publicar, archivar y buscar artículos por
organization. Después de que exista Support Tickets, podrás asociar artículos a
tickets sin mezclar contenido ni IDs entre tenants.

La ruta tiene dos pasadas porque `ticket_knowledge_articles` necesita las tablas
`tickets` y `knowledge_articles`. La pausa elimina una foreign key circular; no
recorta la función.

## Prerrequisitos

- Products existe para relacionar documentación de producto por contenido y
  metadata, sin agregar todavía una FK obligatoria.
- Organizations, memberships, permissions y Audit Parte A están activos.
- Para la segunda pasada, Support Tickets y su migración deben estar aplicados.

## Pasada A — Knowledge Base core

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-knowledge-base
```

1. Abre
   [`database/task-001-knowledge-schema.md`](database/task-001-knowledge-schema.md)
   y completa el schema core.
2. Regresa y confirma entity más migración:

```powershell
git add src/knowledge-base src/database/migrations
git commit -m "feat(database): add knowledge base schema"
```

3. Abre
   [`development/task-001-knowledge-articles.md`](development/task-001-knowledge-articles.md)
   y construye categorías, tags, artículos, publication y search.
4. Confirma el comportamiento:

```powershell
git add src/knowledge-base src/app.module.ts
git commit -m "feat(knowledge): add article management and search"
```

5. Abre [`seeds/task-001-knowledge-seed.md`](seeds/task-001-knowledge-seed.md),
   ejecuta dos veces y confirma IDs estables.
6. Abre [`tests/task-001-knowledge-tests.md`](tests/task-001-knowledge-tests.md)
   y completa los casos core.

```powershell
git add src/seed
git commit -m "feat(seed): add knowledge base dataset"
git add src/knowledge-base/*.spec.ts test/integration/knowledge-base test/e2e/knowledge-base
git commit -m "test(knowledge): cover knowledge base core"
```

### Quality gate y cierre de la Pasada A

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git diff --check
git status
git push -u origin sdd/add-knowledge-base
gh pr create --base main --head sdd/add-knowledge-base --title "feat(knowledge): add knowledge base core"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-knowledge-base
git push origin main
git branch -d sdd/add-knowledge-base
git push origin --delete sdd/add-knowledge-base
```

No crees tag; Support Tickets cierra el hito.

Después del merge abre
[`../16-support-tickets/LEARNING-PATH.md`](../16-support-tickets/LEARNING-PATH.md),
completa ese módulo y regresa a esta ruta en **Pasada B**. No avances a
Automations desde Tickets.

## Pasada B — asociación con tickets

Después de cerrar Support Tickets:

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/link-knowledge-to-tickets
```

1. Abre
   [`database/task-002-ticket-article-links.md`](database/task-002-ticket-article-links.md)
   y crea la tabla puente con FKs tenant-safe.
2. Abre
   [`development/task-002-ticket-article-links.md`](development/task-002-ticket-article-links.md)
   y agrega link/unlink/list mediante services propietarios.
3. Regresa a Tests, sección **Integración con tickets**, y completa los casos.

```powershell
git add src/knowledge-base src/database/migrations
git commit -m "feat(knowledge): link articles to support tickets"
git add src/knowledge-base/*.spec.ts test/integration/knowledge-base test/e2e/knowledge-base
git commit -m "test(knowledge): cover ticket article links"
```

### Quality gate y cierre de la Pasada B

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git diff --check
git status
git push -u origin sdd/link-knowledge-to-tickets
gh pr create --base main --head sdd/link-knowledge-to-tickets --title "feat(knowledge): link articles to tickets"
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/link-knowledge-to-tickets
git push origin main
git branch -d sdd/link-knowledge-to-tickets
git push origin --delete sdd/link-knowledge-to-tickets
```

## Definition of Done

- [ ] Categorías y tags son únicos dentro de la organization.
- [ ] Artículos soportan draft, published, archived, internal y public.
- [ ] Search no cruza tenants ni devuelve drafts sin permiso.
- [ ] Public no significa anonymous; un portal público queda fuera de alcance.
- [ ] Ticket y article deben pertenecer a la misma organization.
- [ ] Seeds son determinísticos e idempotentes.
- [ ] Audit registra publish, archive y asociaciones.
- [ ] Migraciones completan `run -> revert -> run`.
- [ ] Quality gate de la rama pasa.

La Pasada B es el último cambio del hito porque Support Tickets ya está integrado.
Desde `main`, ejecuta también `pnpm build`, comprueba el flujo postventa
end-to-end y publica:

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
git tag -a v0.7.0 -m "v0.7.0 - support and knowledge base"
git push origin v0.7.0
gh release create v0.7.0 --title "v0.7.0 - Support and knowledge base" --generate-notes
```

Edita el release para incluir migraciones, seed, búsqueda, asociación de
artículos, conversaciones, adjuntos, permisos y pruebas de postventa.

## Siguiente paso

Vuelve a `docs/START-HERE.md`. Notifications puede haberse implementado antes
por dependencia; sigue el checkpoint global, no el número de carpeta.
