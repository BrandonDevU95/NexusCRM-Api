# Guía Git para NexusCRM API

## Objetivo

Git será parte del aprendizaje de cada tarea. No tendrás que inventar nombres:
cada `LEARNING-PATH.md` incluye rama, archivos que se agregan, commits y momento
de merge. Esta guía explica qué significan esos comandos.

## Herramientas y autenticación

Git es obligatorio. GitHub CLI (`gh`) se usa para crear Pull Requests y releases
desde terminal. Antes de la primera tarea verifica:

```powershell
git --version
gh --version
gh auth status
```

Si `gh` no existe, instálalo desde la
[documentación oficial de GitHub CLI](https://cli.github.com/manual/installation).
Si no
está autenticado, ejecuta `gh auth login`, elige GitHub.com, HTTPS y el método de
autenticación disponible; después repite `gh auth status`. No copies tokens en
`.env`, commits, capturas o documentación.

La alternativa pedagógica es abrir el Pull Request o release desde la interfaz
web de GitHub usando exactamente base `main`, head branch, título y texto que
indica la tarea. Los comandos Git de branch, commit, push y merge siguen siendo
obligatorios aunque el PR se abra en web.

## Ramas

```text
main                         estado integrado y verificable
sdd/<change-name>            tarea funcional guiada por documentación
fix/<short-description>      corrección de un defecto
docs/<short-description>     documentación sin cambio funcional
chore/<short-description>    mantenimiento o tooling
```

Se conserva el prefijo `sdd/` del flujo anterior, pero ya no implica repartir la
tarea entre proposal/spec/design/tasks. Aquí significa que una tarea documental
autocontenida gobierna una vertical slice completa.

Ejemplos:

```text
sdd/add-api-foundation
sdd/add-user-accounts
sdd/add-refresh-token-sessions
sdd/add-customer-accounts
fix/prevent-cross-organization-access
docs/clarify-contact-customer-relation
```

## Crear una rama

```powershell
git switch main
git pull --ff-only origin main
git switch -c sdd/add-user-accounts
```

- `switch main` te coloca en la base estable.
- `pull --ff-only` descarga cambios sin fabricar un merge accidental.
- `switch -c` crea la rama y te mueve a ella.

Antes de trabajar ejecuta `git status --short --branch`. Debe mostrar la rama
esperada y no debe contener cambios ajenos a la tarea.

## Commits por checkpoint

Usa Conventional Commits y agrega rutas específicas. Evita `git add .` porque
puede incluir secretos o cambios no relacionados.

```powershell
git add src/users/entities/user.entity.ts src/database/migrations/<migration>.ts
git commit -m "feat(database): add users schema"

git add src/users
git commit -m "feat(users): add user account management"

git add src/seed
git commit -m "feat(seed): add deterministic users dataset"

git add src/users/*.spec.ts test/integration/users test/e2e/users
git commit -m "test(users): cover user account management"
```

Tipos más frecuentes:

| Tipo       | Uso                                   |
| ---------- | ------------------------------------- |
| `feat`     | comportamiento nuevo                  |
| `fix`      | defecto corregido                     |
| `test`     | pruebas                               |
| `docs`     | explicación o guía                    |
| `refactor` | estructura sin cambiar comportamiento |
| `build`    | dependencias o compilación            |
| `chore`    | mantenimiento                         |
| `ci`       | automatización del repositorio        |

El scope describe el área: `database`, `auth`, `users`, `seed`, `customers`.
No agregues `Co-Authored-By` ni atribuciones de IA.

## Inspección antes de publicar

```powershell
git status
git diff --check
git diff --stat main...HEAD
git log --oneline --decorate main..HEAD
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
```

Ejecuta `pnpm build` solamente cuando el `LEARNING-PATH` cierre un hito o se
solicite explícitamente. Un fallo se corrige en la misma rama antes del merge.

## Push y Pull Request

```powershell
git push -u origin sdd/add-user-accounts
gh pr create --base main --head sdd/add-user-accounts --title "feat(users): add user accounts"
```

`-u` enlaza la rama local y remota; los siguientes pushes pueden usar solo
`git push`. El Pull Request debe explicar qué cambió, cómo se probó, migraciones,
seed, riesgos y limitaciones.

## Merge y limpieza

Después de revisar y aprobar la tarea:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-user-accounts
git push origin main
git branch -d sdd/add-user-accounts
git push origin --delete sdd/add-user-accounts
```

`--no-ff` conserva un nodo de merge que agrupa los commits pedagógicos de la
tarea. No uses `-D` si Git rechaza el borrado: primero comprueba por qué considera
que la rama no está integrada.

Si el merge se realiza desde GitHub, primero actualiza `main` local con
`git pull --ff-only` y después elimina la rama local.

## Migraciones y Git

- Entity y migración se confirman en el mismo commit de database.
- No edites una migración que ya llegó a `main`.
- Si dos ramas generan migraciones con timestamps cercanos, actualiza tu rama y
  comprueba el orden antes de integrar.
- Nunca resuelvas un conflicto de migración eligiendo un archivo al azar.

## Tags y releases

Un tag se crea solo después de integrar y verificar el hito:

| Tag      | Significado                                                          |
| -------- | -------------------------------------------------------------------- |
| `v0.1.0` | Foundation ejecutable                                                |
| `v0.2.0` | Plataforma, seguridad, organizaciones, auditoría y outbox base       |
| `v0.3.0` | CRM core, catálogos requeridos y lifecycle de leads                  |
| `v0.4.0` | Deals, conversión de leads, actividades, calendario y notificaciones |
| `v0.5.0` | Quotes, Inventory A y Orders base                                    |
| `v0.6.0` | Inventario y reservas funcionales                                    |
| `v0.7.0` | Soporte y base de conocimiento                                       |
| `v0.8.0` | Automatizaciones y notificaciones completas                          |
| `v0.9.0` | Reportes, import/export, auditoría final y administración            |
| `v1.0.0` | Flujo integral estable                                               |

```powershell
git switch main
git pull --ff-only origin main
git tag -a v0.1.0 -m "v0.1.0 - executable API foundation"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0 - API foundation" --generate-notes
```

El release debe agregar qué se implementó, migraciones incluidas, cómo probar,
datos del seed, limitaciones conocidas y siguiente hito.

## Situaciones que requieren detenerse

No hagas merge si hay secretos, archivos `.env`, migraciones sin revisar,
`synchronize: true`, tests omitidos, datos de otra tarea o cambios que no puedes
explicar. Usa `git status`, conserva el trabajo y pide revisión antes de intentar
“limpiar” con comandos destructivos.
