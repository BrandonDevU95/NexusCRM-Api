# Ruta de aprendizaje: foundation de NexusCRM API

## Identidad

| Dato                        | Valor                    |
| --------------------------- | ------------------------ |
| Orden de implementación     | `00`                     |
| Módulo del alcance original | Base técnica transversal |
| Código documental           | `FND`                    |
| Rama                        | `sdd/add-api-foundation` |
| Tag                         | `v0.1.0`                 |

## Resultado esperado

Al terminar tendrás un proyecto NestJS limpio dentro del repositorio existente,
configuración validada con Joi, PostgreSQL administrado por Docker Compose, un
`DataSource` de TypeORM con `synchronize: false`, la primera migración de
infraestructura, un contrato HTTP versionado y observable, un SeedModule
ejecutable por CLI y una escalera inicial de pruebas.

No crearás todavía tablas comerciales ni módulos del CRM. Foundation construye
las herramientas que permitirán hacerlo sin improvisar en los 23 módulos.

## Cómo usar esta ruta

Lee un solo archivo subordinado a la vez. Cada checkpoint indica el archivo y
sección exactos, el criterio de regreso y el commit. Si interrumpes el trabajo,
anota en `docs/START-HERE.md` el último checkpoint terminado antes de cerrar.

Los documentos de referencia aplicables son:

- [`../../project/STACK-AND-VERSIONS.md`](../../project/STACK-AND-VERSIONS.md),
  para copiar únicamente versiones exactas.
- [`../../project/DATABASE-CONVENTIONS.md`](../../project/DATABASE-CONVENTIONS.md),
  para entender el ciclo de migraciones.
- [`../../project/SEED-STRATEGY.md`](../../project/SEED-STRATEGY.md), para
  distinguir reference, demo y test data.
- [`../../project/TESTING-STRATEGY.md`](../../project/TESTING-STRATEGY.md), para
  entender los niveles de prueba.

No necesitas leerlos completos ahora: cada tarea te envía a la sección que usa.

## Prerrequisitos

- [x] El repositorio contiene `README.md`, `AGENTS.md`, `.gitignore` y `docs/`.
- [x] No existen todavía `src/`, `test/`, `package.json` o `pnpm-lock.yaml` en
      la raíz.
- [x] `git status --short --branch` no muestra cambios ajenos.
- [x] Node informa `v24.17.0`.
- [x] pnpm informa `11.12.0`.
- [x] Docker Desktop está disponible y `docker version` responde.
- [x] `gh --version` responde y `gh auth status` confirma la cuenta correcta, o
      se decidió usar la interfaz web para PRs/releases.

Si ya existe alguno de los archivos de aplicación, no lo sobrescribas. Revisa
por qué existe y ajusta el paso de copia con una allowlist.

## Git: inicio

Desde la raíz del repositorio:

```powershell
git switch main
git pull --ff-only origin main
git status --short --branch
git switch -c sdd/add-api-foundation
```

`pull --ff-only` evita crear un merge accidental. El último comando debe dejarte
en `sdd/add-api-foundation`; compruébalo otra vez con `git status`.

## Mapa de checkpoints

| Checkpoint | Archivo                                           | Resultado                                                            |
| ---------- | ------------------------------------------------- | -------------------------------------------------------------------- |
| `FND-001`  | `development/task-001-safe-nest-scaffold.md`      | Starter NestJS integrado sin sobrescribir documentación              |
| `FND-002`  | `development/task-002-environment-joi-compose.md` | Contrato `.env`, Joi y PostgreSQL Compose                            |
| `FND-003`  | `database/task-001-typeorm-data-source.md`        | Runtime y CLI comparten configuración TypeORM                        |
| `FND-004`  | `database/task-002-first-migration.md`            | Primera migración ejecutada, revertida y reaplicada                  |
| `FND-005`  | `development/task-003-http-api-contract.md`       | Prefix `/api/v1`, validation, errores, correlation, Swagger y health |
| `FND-006`  | `seeds/task-001-seed-cli-foundation.md`           | SeedModule CLI modular y seguro, todavía sin datos comerciales       |
| `FND-007`  | `tests/task-001-testing-foundation.md`            | Unit, integration, migration y smoke E2E iniciales                   |

## Recorrido obligatorio

### Checkpoint FND-001 — scaffold seguro

1. Abre
   [`development/task-001-safe-nest-scaffold.md`](development/task-001-safe-nest-scaffold.md).
2. Comienza en **Por qué no generarlo directamente en la raíz**.
3. Completa su Definition of Done.
4. Regresa aquí sin abrir todavía la configuración.

Revisa que `docs/`, `README.md`, `AGENTS.md` y `.gitignore` sigan intactos. Haz
staging solo de los archivos nuevos y de la integración consciente de
`.gitignore`:

```powershell
git status --short
git add package.json pnpm-lock.yaml nest-cli.json tsconfig.json tsconfig.build.json eslint.config.mjs .prettierrc .npmrc src test .gitignore
git diff --cached --check
git commit -m "build: scaffold NestJS API foundation"
```

No agregues la carpeta temporal del starter.

### Checkpoint FND-002 — environment, Joi y Compose

1. Abre
   [`development/task-002-environment-joi-compose.md`](development/task-002-environment-joi-compose.md).
2. Comienza en **Separación de responsabilidades**.
3. Completa las pruebas manuales de variables inválidas y el healthcheck de
   PostgreSQL.
4. Regresa aquí.

Antes del commit confirma que `.env` y `.env.test` no aparecen en Git:

```powershell
git status --short
git check-ignore .env .env.test
git add package.json pnpm-lock.yaml .env.example .env.test.example compose.yaml src/config src/app.module.ts
git diff --cached --check
git commit -m "feat(config): validate environment and compose services"
```

Si todavía no existe `.env.test.example`, omítelo del staging y vuelve a la
tarea: la ruta no está terminada.

### Checkpoint FND-003 — DataSource

1. Abre
   [`database/task-001-typeorm-data-source.md`](database/task-001-typeorm-data-source.md).
2. Comienza en **Dos entradas, un solo contrato**.
3. Regresa cuando runtime y CLI apunten a la misma base y `migration:show`
   funcione sin crear schema.

```powershell
git status --short
git add package.json pnpm-lock.yaml src/config src/database src/app.module.ts
git diff --cached --check
git commit -m "feat(database): configure TypeORM DataSource"
```

### Checkpoint FND-004 — primera migración

1. Abre
   [`database/task-002-first-migration.md`](database/task-002-first-migration.md).
2. Comienza en **Por qué la primera migración no crea tablas comerciales**.
3. Completa el ciclo `show -> run -> inspect -> revert -> inspect -> run`.
4. Regresa únicamente cuando PostgreSQL vuelva a mostrar la extensión esperada
   y TypeORM registre la migración aplicada.

Reemplaza el glob del siguiente comando por el único archivo generado si hay
más de una migración en la carpeta:

```powershell
git status --short
git add src/database/migrations/*-EnableDatabaseExtensions.ts
git diff --cached --check
git commit -m "feat(database): add database extensions migration"
```

### Checkpoint FND-005 — contrato HTTP base

1. Abre
   [`development/task-003-http-api-contract.md`](development/task-003-http-api-contract.md).
2. Comienza en **Contrato de rutas**.
3. Regresa cuando `/api/v1/health`, el error envelope, correlation ID y Swagger
   tengan un comportamiento observable y documentado.

```powershell
git status --short
git add package.json pnpm-lock.yaml .env.example .env.test.example src/main.ts src/app.module.ts src/common src/health
git diff --cached --check
git commit -m "feat(api): add versioned HTTP foundation"
```

### Checkpoint FND-006 — SeedModule CLI

1. Abre
   [`seeds/task-001-seed-cli-foundation.md`](seeds/task-001-seed-cli-foundation.md).
2. Comienza en **Qué se construye ahora**.
3. Regresa cuando `seed:list` funcione, `seed:run` detecte migraciones
   pendientes y demo data quede bloqueado en `prod`.

Foundation no inserta filas comerciales. El primer seeder real llega en el
módulo de plataforma.

```powershell
git status --short
git add package.json pnpm-lock.yaml .env.example .env.test.example src/config src/seed
git diff --cached --check
git commit -m "feat(seed): add modular CLI seed foundation"
```

### Checkpoint FND-007 — pruebas iniciales

1. Abre
   [`tests/task-001-testing-foundation.md`](tests/task-001-testing-foundation.md).
2. Comienza en **Escalera de aprendizaje**.
3. Implementa cada nivel en orden; no empieces por E2E.
4. Regresa cuando las cuatro suites pequeñas pasen y puedas explicar qué
   protege cada una.

```powershell
git status --short
git add package.json pnpm-lock.yaml tsconfig*.json src/**/*.spec.ts test
git diff --cached --check
git commit -m "test: add foundation test suites"
```

Si PowerShell no expande una ruta como esperas, usa `git add` con los nombres
concretos que muestra `git status`; no sustituyas el comando por `git add .`.

## Quality gate de Foundation

Ejecuta en este orden:

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:migrations
pnpm test:e2e
pnpm install --frozen-lockfile
pnpm build
git diff --check
git status
```

Comprueba además desde un entorno desechable:

1. `docker compose --profile test down` detiene servicios de test.
2. Elimina únicamente el volumen de test después de confirmar su nombre.
3. `docker compose --profile test up -d` crea PostgreSQL test limpio.
4. Todas las migraciones aplican.
5. Las suites vuelven a pasar.

Foundation cierra el primer hito ejecutable, por eso `pnpm build` es obligatorio
en esta ruta. No se convierte en un comando para ejecutar después de cada tarea.

## Revisión final

- [x] No se sobrescribió documentación existente.
- [x] `package.json` usa versiones exactas, sin `^` ni `~`.
- [x] `pnpm-lock.yaml` está versionado.
- [x] `.env` y `.env.test` están ignorados.
- [x] Compose no contiene imágenes, credenciales, puertos ni nombres operativos
      hardcodeados.
- [x] Joi detiene el arranque ante configuración inválida.
- [x] `synchronize` y `migrationsRun` son `false`.
- [x] Runtime y CLI usan el mismo contrato de conexión.
- [x] La migración se ejecutó, revirtió y reaplicó.
- [x] El contrato HTTP usa `/api/v1`, ValidationPipe global, error envelope,
      correlation ID y health endpoint.
- [x] Swagger usa la versión fijada y puede deshabilitarse por entorno.
- [x] El seed es manual, CLI, modular y seguro por entorno.
- [x] Pruebas usan PostgreSQL test, no la base de desarrollo.
- [x] `pnpm build` termina correctamente.
- [x] Puedes explicar cada commit de la rama.

## Git: publicación y merge

```powershell
git status
git diff --stat main...HEAD
git log --oneline --decorate main..HEAD
git push -u origin sdd/add-api-foundation
```

Abre el pull request y documenta: scaffold, contrato de entorno, migración,
contrato HTTP, SeedModule, pruebas ejecutadas y la limitación de que todavía no
existen tablas CRM.

Después de revisión:

```powershell
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/add-api-foundation
git push origin main
git branch -d sdd/add-api-foundation
git push origin --delete sdd/add-api-foundation
```

## Tag y release `v0.1.0`

El tag se crea únicamente después del merge. Verifica `main` una última vez:

```powershell
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm build
git status
git tag -a v0.1.0 -m "v0.1.0 - executable API foundation"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0 - API foundation" --generate-notes
```

Edita el release para incluir:

- Runtime, pnpm, NestJS, PostgreSQL y TypeORM fijados.
- Cómo preparar `.env` y levantar Compose.
- Cómo aplicar y revertir la primera migración.
- Rutas `/api/v1/health` y Swagger.
- Suites y build ejecutados.
- SeedModule disponible, pero sin datos comerciales todavía.
- Limitación: ningún módulo CRM está implementado.
- Siguiente hito: plataforma y configuración.

## Siguiente paso único

Vuelve a [`../../START-HERE.md`](../../START-HERE.md) y continúa con la ruta que
aparezca como siguiente. No abras directamente Security.
