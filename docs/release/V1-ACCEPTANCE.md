# Ruta de aceptación y release `v1.0.0`

## Cuándo abrir este archivo

Únicamente después de integrar el módulo 23 y publicar `v0.9.0`. Esta ruta no
agrega un módulo escondido ni recorta pendientes: reúne las pruebas integrales
que demuestran que los 23 módulos funcionan como un solo CRM.

## Rama

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/prepare-v1-release
```

No programes nuevas capacidades en esta rama. Corrige defectos encontrados,
agrega pruebas de regresión, ajusta documentación y crea migraciones nuevas si
un arreglo requiere schema. Nunca edites una migración ya publicada.

## Gate 1: reconstrucción desde cero

1. Conserva intacta tu base de desarrollo y crea una base desechable de release.
2. Aplica todas las migraciones en orden.
3. Confirma que `migration:show` no reporte pendientes.
4. Ejecuta reference data y demo seed maestro.
5. Ejecuta el mismo seed una segunda vez.
6. Confirma conteos, relaciones e IDs lógicos sin duplicados.
7. Provoca una falla controlada del seed y comprueba rollback.

Ejecuta la reconstrucción con el environment de prueba explícito:

```powershell
pnpm install --frozen-lockfile
docker compose --env-file .env.test --profile test up -d database_test
pnpm test:migrations
pnpm seed:run -- --env-file .env.test --module all --data-kind demo
pnpm seed:run -- --env-file .env.test --module all --data-kind demo
```

La prueba de rollback deliberado pertenece a la suite de integración del runner;
no alteres un seeder real ni apuntes estos comandos a desarrollo o producción.

Resultado: un clon nuevo puede construir schema y datos únicamente con Git,
environment y comandos documentados.

## Gate 2: flujo comercial integral

Con un dataset controlado demuestra y conserva como E2E:

1. Un lead se crea y asigna.
2. Se registran actividades y una tarea de seguimiento.
3. Se califica y convierte una sola vez a customer, contact y deal.
4. El deal cambia de etapas con historial y termina ganado.
5. Se resuelve el precio efectivo de sus productos.
6. Se genera quote con folio, impuestos, descuentos y snapshots.
7. El proceso de aprobación y aceptación respeta su state machine.
8. La quote se convierte una sola vez a order.
9. La order reserva stock sin permitir cantidades negativas.
10. Un fulfillment parcial y después completo crea movimientos correctos.
11. Cambiar el producto o precio original no altera snapshots históricos.
12. Timeline, reportes y auditoría muestran la misma historia.

Repite variantes de rechazo, expiración, stock insuficiente, cancelación y
devolución. Cada fallo transaccional debe dejar un estado explicable.

## Gate 3: flujo postventa

1. Crea ticket desde customer/contact de la venta anterior.
2. Asigna agente, prioridad y categoría.
3. Agrega comentario público, comentario interno y adjunto.
4. Asocia un knowledge article.
5. Pasa por espera, resolución, cierre y reapertura permitida.
6. Comprueba notificaciones, tiempos, timeline, reporte y auditoría.

Un usuario sin permiso y un usuario de otro tenant deben fallar sin revelar la
existencia del ticket.

## Gate 4: automations, jobs y resiliencia

- Trigger de lead web crea la tarea una sola vez.
- Deal grande produce la notificación configurada.
- Ticket crítico asigna/avisa sin recursión.
- Stock bajo produce una alerta sin duplicados.
- Un action failure queda registrado, reintenta conforme a política y no repite
  acciones ya confirmadas.
- Import preview no escribe datos; confirm procesa filas y reporta errores.
- Export protege fórmulas CSV y respeta permisos/tenant.
- Jobs repetidos o reintentados conservan idempotencia.

## Gate 5: seguridad

- Argon2id y política de password están activas.
- Login failure, bloqueo y recuperación no permiten enumeración de usuarios.
- Refresh rotation, replay detection y revocación de sesión están cubiertos.
- Cookies/CORS/CSRF coinciden con el despliegue previsto de `NexusCRM-Web`.
- Matriz de roles comprueba al menos una ruta de cada módulo sensible.
- El contract test compara todos los permission constants/decorators contra el
  catálogo persistido y no permite códigos huérfanos.
- CASL comprueba propietario, manager y tenant distinto.
- Ningún log, error, response, audit record o seed imprime secrets/hashes.
- Rate limits y límites de payload/archivo están configurados.

## Gate 6: calidad y operación

```powershell
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:migrations
pnpm test:e2e
pnpm build
git diff --check
git status --short --branch
```

Además:

- Mide consultas de dashboard/import/export con datasets definidos.
- Confirma índices mediante planes cuando una task lo requiera.
- Verifica health/readiness sin exponer configuración.
- Restaura un respaldo desechable y documenta duración/resultado.
- Revisa Swagger, `.env.example`, permisos, scripts y README.
- Busca `latest`, rangos de versión, `synchronize: true`, secrets y TODOs.

## Commit y Pull Request

Separa defectos por causa; no hagas un solo commit “finish project”. El último
commit documental puede ser:

```powershell
git add README.md docs
git commit -m "docs(release): record v1 acceptance"
git push -u origin sdd/prepare-v1-release
```

El Pull Request debe incluir matriz de gates, comandos ejecutados, migraciones,
resultados del seed, riesgos y limitaciones conocidas. Integra solo con todos los
checks aprobados.

## Tag y release

Después del merge:

```powershell
git switch main
git pull --ff-only origin main
git tag -a v1.0.0 -m "v1.0.0 - stable end-to-end CRM API"
git push origin v1.0.0
gh release create v1.0.0 --title "NexusCRM API v1.0.0" --generate-notes
```

Edita las notas generadas para incluir requisitos, instalación, migraciones,
seed demo, flujos de prueba, limitaciones y política de upgrade. `v1.0.0` no
significa que el producto no evolucione; significa que el alcance comprometido
es reproducible, usable y está protegido por pruebas.
