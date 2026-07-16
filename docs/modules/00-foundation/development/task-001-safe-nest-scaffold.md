# Development task 001: scaffold seguro de NestJS

## Navegación

| Dato          | Valor                                       |
| ------------- | ------------------------------------------- |
| Código        | `DEV-FND-001`                               |
| Vienes de     | `../LEARNING-PATH.md`, checkpoint `FND-001` |
| Regresas a    | `../LEARNING-PATH.md`, checkpoint `FND-001` |
| Rama esperada | `sdd/add-api-foundation`                    |

No continúes hasta que NestJS arranque, las versiones estén fijadas y todos los
documentos preexistentes permanezcan intactos.

## Objetivo

Crear el starter NestJS dentro de un repositorio que ya contiene planeación. La
CLI normalmente piensa que está creando un proyecto nuevo; por eso se genera en
una carpeta temporal y se integra mediante una allowlist.

Aprenderás a distinguir scaffold, dependencias, lockfile y archivos propiedad
del repositorio.

## Por qué no generarlo directamente en la raíz

Ejecutar `nest new` sobre una carpeta con archivos existentes puede producir
conflictos o reemplazar `README.md`, `.gitignore` y otra documentación. Un
scaffold temporal permite comparar antes de copiar y evita crear otro `.git`
dentro del proyecto.

La regla es: copiar únicamente los archivos técnicos que todavía no existen;
nunca copiar toda la carpeta temporal sobre la raíz.

## Verificar herramientas

```powershell
node --version
pnpm --version
git status --short --branch
```

Resultados esperados:

- Node: `v24.17.0`.
- pnpm: `11.12.0`.
- Rama: `sdd/add-api-foundation`.
- Sin cambios ajenos.

Si pnpm no coincide:

```powershell
corepack enable
corepack prepare pnpm@11.12.0 --activate
pnpm --version
```

## Crear el starter temporal

Desde la raíz de NexusCRM API:

```powershell
$projectRoot = (Get-Location).Path
$parentRoot = Split-Path -Parent $projectRoot
$scaffoldRoot = Join-Path $parentRoot 'NexusCRM-Api-Scaffold'
Test-Path -LiteralPath $scaffoldRoot
pnpm dlx @nestjs/cli@11.0.24 new nexuscrm-api --directory $scaffoldRoot --package-manager pnpm --skip-git
```

`Test-Path` debe devolver `False`. Si devuelve `True`, no reutilices esa carpeta
sin revisar su contenido. El flag `--skip-git` evita un repositorio anidado.

No uses `@latest`: `11.0.24` es la CLI fijada por el proyecto.

## Inspeccionar antes de copiar

En el starter temporal identifica:

- `src/` y `test/`.
- `package.json` y `pnpm-lock.yaml`.
- `nest-cli.json`.
- `tsconfig.json` y `tsconfig.build.json`.
- `eslint.config.mjs` y `.prettierrc`.
- `.gitignore` y `README.md`, que solo sirven como referencia.

Comprueba en la raíz que cada destino no exista. Si existe, compara y fusiona
conscientemente; no uses `-Force`.

## Allowlist de integración

Copia a la raíz únicamente:

```text
src/
test/
package.json
pnpm-lock.yaml
nest-cli.json
tsconfig.json
tsconfig.build.json
eslint.config.mjs
.prettierrc
```

No copies:

```text
.git/
README.md
.gitignore completo
docs/
AGENTS.md
```

Del `.gitignore` temporal, agrega manualmente solo reglas faltantes. Antes de
guardar, confirma que `.env`, `.env.*` y la carpeta temporal no puedan
versionarse; más adelante se permitirán expresamente `.env.example` y
`.env.test.example`.

## Fijar el gestor y versiones

Crea `.npmrc` con estas políticas, sin rangos:

- Guardar dependencias exactas.
- Exigir engines compatibles.
- Tratar peer dependencies incompatibles como error.

En `package.json` registra:

- Node `24.17.0`.
- pnpm `11.12.0`.
- `packageManager` con pnpm `11.12.0`.

La CLI puede generar dependencias con `^`. Normalízalas usando los comandos de
las fases 1 y 2 de
[`../../../project/STACK-AND-VERSIONS.md`](../../../project/STACK-AND-VERSIONS.md),
sin instalar todavía TypeORM, Joi, Faker o seguridad.

Después confirma:

```powershell
pnpm install
pnpm list --depth 0
Select-String -Path package.json -Pattern '"[~^]'
```

La última búsqueda no debe encontrar rangos de versiones.

## Scripts base

Conserva los scripts del starter y agrega nombres que usarán todas las guías:

- `format:check`: verifica formato sin escribir archivos.
- `typecheck`: ejecuta TypeScript sin emitir archivos.
- `test`: unit tests.
- `test:watch`: unit tests durante aprendizaje.
- `test:cov`: reporte de coverage.
- `test:integration`: configuración separada para PostgreSQL test.
- `test:e2e`: configuración E2E.
- `test:migrations`: ciclo de migraciones en test.
- `test:all`: secuencia de suites, sin incluir build.

En esta tarea solo define los scripts que el starter ya puede ejecutar. Los
targets de Integration y migrations se completan en `FND-007`; no los hagas
apuntar silenciosamente a unit tests para simular que funcionan.

## Starter mínimo

Conserva temporalmente el controller, service y prueba generados. Su propósito
es comprobar que el scaffold funciona antes de agregar infraestructura. No los
conviertas todavía en un módulo de negocio.

Ejecuta:

```powershell
pnpm start:dev
```

En otra terminal comprueba el endpoint generado y detén el servidor. Después:

```powershell
pnpm lint
pnpm typecheck
pnpm test
```

No ejecutes build en esta tarea.

## Qué debes entender antes de seguir

- `package.json` declara dependencias y scripts.
- `pnpm-lock.yaml` fija el árbol resuelto y sí se versiona.
- `nest-cli.json` configura el compiler de NestJS.
- `tsconfig.json` define el contrato TypeScript.
- `src/main.ts` es el entrypoint HTTP.
- `src/app.module.ts` es el composition root de módulos.
- `test/` aloja suites que arrancan la aplicación completa.

## Errores frecuentes

- Generar en `.` y aceptar sobrescrituras.
- Copiar el `.git` temporal.
- Reemplazar el README de planeación por el README genérico.
- Conservar `^` o `~` en `package.json`.
- Mezclar `package-lock.json` con `pnpm-lock.yaml`.
- Instalar globalmente una CLI sin versión.
- Borrar el lockfile para ocultar una incompatibilidad.

## Preguntas de comprensión

1. ¿Qué riesgo elimina generar el starter en una carpeta temporal?
2. ¿Qué diferencia existe entre `package.json` y `pnpm-lock.yaml`?
3. ¿Por qué `@nestjs/common`, `core`, `platform-express` y `testing` deben estar
   alineados?
4. ¿Por qué no se copia el `.gitignore` completo sin revisarlo?

## Definition of Done

- [x] El starter se generó fuera de la raíz con CLI `11.0.24`.
- [x] Solo se integró la allowlist.
- [x] `README.md`, `AGENTS.md` y `docs/` permanecen intactos.
- [x] `.gitignore` protege archivos de entorno.
- [x] No existe un `.git` anidado.
- [x] Todas las versiones de `package.json` son exactas.
- [x] Solo existe `pnpm-lock.yaml`.
- [x] `pnpm start:dev`, lint, typecheck y unit test inicial funcionan.
- [x] La carpeta temporal no aparece en `git status`.

## Regreso

Vuelve a [`../LEARNING-PATH.md`](../LEARNING-PATH.md), checkpoint `FND-001`, y
haz el commit indicado antes de abrir la siguiente tarea.
