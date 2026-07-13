# Ruta de aprendizaje: tickets de soporte

**Código:** `MOD-16`

## Objetivo

Gestionar postventa con customer/contact, agente, prioridad, categoría, estados,
conversación pública/interna, adjuntos, artículos relacionados, cierre y reapertura.

## Vienes de

- Customers y Contacts integrados.
- **Pasada A** de `../17-knowledge-base/LEARNING-PATH.md` integrada: articles
  existen, pero la tabla puente todavía no.
- Checkpoint inicial de `../19-notifications/LEARNING-PATH.md` completado para
  asignaciones, respuestas y alertas críticas.
- Audit inicial y number sequence `TICKET` disponibles.

El orden se explica en [dependencias](../../project/MODULE-DEPENDENCIES.md). No
recortes knowledge links o notifications por seguir únicamente el número 16.

## Rama exacta

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-support-tickets
```

## Recorrido único

1. Ve a `database/task-001-support-tickets-schema.md`, sección **Diccionario completo**; regresa tras `up/down/up`.
2. Ve a `development/task-001-ticket-lifecycle.md`, sección **Máquina de estados**; regresa al cerrar alta/asignación/estados.
3. Ve a `development/task-002-ticket-conversation.md`, sección **Conversación y visibilidad**; regresa al cerrar comments/attachments/timeline y el contrato que usará Knowledge Base B.
4. Ve a `seeds/task-001-support-tickets-seed.md`, sección **Dataset**; regresa después de la segunda ejecución.
5. Ve a `tests/task-001-ticket-lifecycle-tests.md`, sección **Matriz**; regresa cuando pase.
6. Ve a `tests/task-002-ticket-conversation-tests.md`, sección **Matriz**; regresa para cierre.

## Registro de avance

- [ ] Knowledge Base A y Notifications requeridas están integradas.
- [ ] Rama `sdd/add-support-tickets` creada desde `main` limpio.
- [ ] `DB-TICKET-001`: tickets/conversation/histories con FKs tenant migrados.
- [ ] `DEV-TICKET-001/002`: lifecycle, conversación, attachments y contrato KB completos.
- [ ] `SEED-TICKET-001`: doble ejecución mediante EntityManager del runner.
- [ ] `TEST-TICKET-001/002`: unit/integration/E2E y visibilidad pasan.
- [ ] Diff/commits revisados; push, PR y merge `--no-ff` completados.
- [ ] Pasada B de Knowledge Base marcada como siguiente destino; sin tag en Tickets.

## Commits

```powershell
git add src/tickets/entities src/database/migrations
git commit -m "feat(database): add support tickets schema"
git add src/tickets
git commit -m "feat(tickets): add lifecycle conversations and knowledge contract"
git add src/seed
git commit -m "feat(seed): add deterministic support tickets"
git add src/tickets test
git commit -m "test(tickets): cover support lifecycle and conversation"
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
git push -u origin sdd/add-support-tickets
gh pr create --base main --head sdd/add-support-tickets --title "feat(tickets): add post-sales support"
```

Después de aprobación:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-support-tickets
git push origin main
git branch -d sdd/add-support-tickets
git push origin --delete sdd/add-support-tickets
```

## Definition of Done

- Ticket tiene folio único por tenant, customer obligatorio y contact coherente.
- Assignment y status conservan historial append-only.
- Priority/status/category se filtran y auditan con permisos explícitos.
- Public reply e internal note no se confunden en response ni notificación.
- Adjuntos validan tipo/tamaño/checksum; DB solo guarda metadata.
- Cierre y reapertura siguen state machine y razones obligatorias.
- Tickets expone una frontera tenant-safe para que Knowledge Base B valide el
  ticket sin acceder informalmente a sus tablas.
- Customer timeline incorpora eventos del ticket sin tabla duplicada.
- Notification/audit se confirman con el cambio o mediante outbox confiable.
- Seeds dobles y suites unit/integration/E2E pasan.

## Siguiente destino

Después de integrar esta rama, **regresa a la Pasada B** de
`../17-knowledge-base/LEARNING-PATH.md`: ahí se crea
`ticket_knowledge_articles`, sus endpoints, seed y pruebas. No crees el release
postventa antes de verificar Knowledge Base A + Tickets + Knowledge Base B +
Notifications como un flujo completo.
