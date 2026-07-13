# Development task 001: verificar el contrato de Foundation

## Navegación

- **Código:** DEV-PLAT-001
- **Vienes de:** `../LEARNING-PATH.md`, registro `PLAT-001`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `PLAT-001`.
- **No continúes hasta:** comprobar el contrato existente sin reconstruir
  configuración, Compose, DataSource ni el runner de seeds.

## Objetivo

Platform consume la Foundation publicada en `v0.1.0`. Esta tarea es un
preflight: verifica que el contrato técnico siga vigente antes de crear las
primeras entities de dominio. Si una comprobación falla, corrige Foundation en
una rama `fix/*`; no ocultes el desvío dentro del módulo Platform.

## Dependencias ya instaladas

Confirma en `package.json` y `pnpm-lock.yaml` las versiones exactas de
`@nestjs/config@4.0.4`, `joi@18.2.3`, `class-validator@0.15.1`,
`class-transformer@0.5.1`, `@nestjs/typeorm@11.0.3`, `typeorm@0.3.28` y
`pg@8.22.0`. No ejecutes `pnpm add` y no cambies package o lockfile en esta
tarea.

## Contrato que se consume

- `.env` y `.env.test` están ignorados; sus archivos example están
  versionados y no contienen secretos.
- `compose.yaml` declara `database`, `database_test` y `pgadmin` con imágenes,
  credenciales, puertos, nombres y volúmenes tomados del environment.
- Joi valida el environment antes de abrir HTTP o conectar TypeORM.
- Runtime y CLI consumen el mismo loader tipado.
- `synchronize` y `migrationsRun` permanecen en `false`.
- Los comandos `migration:*`, `seed:*` y las cuatro familias de test ya
  existen.

No vuelvas a definir aquí variables de aplicación, PostgreSQL, Compose o seed.
Platform solo agrega settings editables en base de datos; estos no sustituyen
configuración operativa ni secretos.

## Unknown keys y allowlist del loader

El schema Joi valida el objeto completo con `allowUnknown: true`. El proceso
recibe variables del sistema operativo, CI, pnpm y Docker que no pertenecen al
contrato de NexusCRM; rechazarlas haría el arranque dependiente del host.

Permitir unknown keys no significa propagarlas. `env.loader.ts` construye su
resultado mediante una allowlist explícita de claves conocidas y devuelve solo
las secciones tipadas de la aplicación. No usa spread de `process.env`, no
expone el objeto crudo y no copia una clave desconocida a `ConfigService`.

Comprueba ambos límites:

1. Una variable ajena como `CI_JOB_ID` no impide validar una configuración
   completa.
2. `CI_JOB_ID` no aparece en el objeto producido por el loader.
3. Un typo de una clave requerida, por ejemplo omitir `DATABASE_HOST` y enviar
   `DATABSE_HOST`, falla porque la clave requerida continúa ausente.
4. Un error no imprime el valor de password, token ni cookie.

## Preflight manual

```powershell
node --version
pnpm --version
pnpm install --frozen-lockfile
docker compose --env-file .env config
docker compose --env-file .env.test --profile test up -d database_test
docker compose --profile test ps
pnpm migration:show
pnpm seed:list
pnpm test -- env.validation.spec.ts
git status --short
```

No compartas la salida interpolada de Compose porque puede contener valores
locales. Al terminar, `git status` no debe mostrar cambios causados por este
preflight y `compose.yaml` debe conservar ese nombre exacto.

## Fallos deliberados que ya protege Foundation

- Variable requerida ausente.
- Puerto fuera de rango.
- `DATABASE_SYNCHRONIZE=true` o `DATABASE_MIGRATIONS_RUN=true`.
- Producción sin SSL o con demo seed habilitado.
- Base no disponible, sin imprimir password.

No repitas manualmente toda la tarea Foundation. Ejecuta su suite focalizada y
solo diagnostica si una regresión hace fallar un caso.

## Definition of Done

- [ ] Las dependencias existentes conservan versiones exactas.
- [ ] `compose.yaml` resuelve y PostgreSQL test llega a healthy.
- [ ] Joi usa `allowUnknown: true`.
- [ ] El loader usa una allowlist y no propaga unknown keys.
- [ ] Un typo de clave requerida falla sin revelar secretos.
- [ ] Runtime y CLI siguen compartiendo loader.
- [ ] `synchronize` y `migrationsRun` siguen desactivados.
- [ ] No se modificó ni staged ningún archivo durante el preflight.
