# Development task 002: `.env`, Joi y Docker Compose

## Navegación

| Dato          | Valor                                       |
| ------------- | ------------------------------------------- |
| Código        | `DEV-FND-002`                               |
| Vienes de     | `../LEARNING-PATH.md`, checkpoint `FND-002` |
| Regresas a    | `../LEARNING-PATH.md`, checkpoint `FND-002` |
| Rama esperada | `sdd/add-api-foundation`                    |

No continúes hasta que Joi detenga el arranque con configuración inválida y
PostgreSQL alcance estado healthy usando únicamente valores del environment.

## Objetivo

Construir un contrato de configuración único y validado. `.env` proporciona
valores locales; Joi comprueba que sean válidos; el loader transforma esos
valores; NestJS y la CLI consumen el resultado. Docker Compose usa el mismo
archivo para imágenes, credenciales, puertos y nombres operativos.

## Separación de responsabilidades

### Environment variables

Guardan configuración de despliegue y secretos: host, port, credentials, SSL,
logging, imágenes y límites de seed. Cambian por entorno y no se persisten como
settings editables del CRM.

### Joi

Valida presencia, tipo, rango, formato y reglas condicionadas por
`NODE_ENV`. La aplicación falla antes de abrir el puerto o conectarse a un
servicio cuando el contrato es inválido.

### DTO validation

`class-validator` y `class-transformer` validarán requests HTTP. No sustituyen
a Joi y no deben leer `process.env`.

### Settings del CRM

Configuración que un administrador podrá editar se almacenará en las tablas del
módulo de plataforma. No guardar database passwords, JWT secrets o Docker
images en esas tablas.

## Dependencias de esta tarea

Instala únicamente configuración y validación base con versiones exactas:

```powershell
pnpm add -E @nestjs/config@4.0.4 joi@18.2.3 class-validator@0.15.1 class-transformer@0.5.1
```

Revisa `package.json` y `pnpm-lock.yaml`; no debe aparecer `^`, `~` ni un segundo
lockfile.

## Archivos y responsabilidades

```text
src/config/
├── env.validation.ts
├── env.loader.ts
├── env.types.ts
└── config.module.ts
```

- `env.validation.ts`: schema Joi y validaciones cruzadas.
- `env.loader.ts`: conversión a un objeto tipado por secciones; es el único
  lugar que traduce strings del environment.
- `env.types.ts`: contrato que consumen runtime, CLI y tests.
- `config.module.ts`: integra ConfigModule globalmente sin exponer secretos.

Puedes ajustar nombres si el stack global ya fijó otros, pero runtime y CLI
deben compartir el mismo validad y loader; no dupliques un schema para
migraciones.

## Inventario de variables

### Aplicación

| Variable                      | Regla                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| `NODE_ENV`                    | `dev`, `test` o `prod`; requerida                                     |
| `APP_HOST`                    | hostname válido; requerida                                            |
| `APP_PORT`                    | integer entre 1 y 65535; requerida                                    |
| `APP_VERSION`                 | versión SemVer; requerida y expuesta por el health endpoint           |
| `CORS_ORIGINS`                | lista explícita; wildcard rechazado en `prod`                         |
| `COMPRESSION_ENABLED`         | boolean; `false` cuando un proxy o CDN comprime la respuesta          |
| `COMPRESSION_THRESHOLD_BYTES` | entero entre 1024 y 1048576; tamaño mínimo para considerar compresión |
| `COMPRESSION_LEVEL`           | entero entre 1 y 6; balance entre CPU y tamaño de respuesta           |

### PostgreSQL runtime

| Variable                  | Regla                                                |
| ------------------------- | ---------------------------------------------------- |
| `DATABASE_HOST`           | requerida                                            |
| `DATABASE_PORT`           | integer entre 1 y 65535                              |
| `DATABASE_NAME`           | requerida, sin whitespace                            |
| `DATABASE_USER`           | requerida                                            |
| `DATABASE_PASSWORD`       | requerida, sin default inseguro                      |
| `DATABASE_SSL`            | boolean con formatos admitidos explícitamente        |
| `DATABASE_LOGGING`        | boolean; default documentado                         |
| `DATABASE_POOL_SIZE`      | integer positivo con máximo razonable                |
| `DATABASE_MIGRATIONS_RUN` | debe permanecer `false` en esta arquitectura         |
| `DATABASE_SYNCHRONIZE`    | debe aceptar únicamente `false`; un valor true falla |

### Docker Compose

| Variable                  | Uso                                 |
| ------------------------- | ----------------------------------- |
| `POSTGRES_IMAGE`          | tag y digest exactos                |
| `POSTGRES_CONTAINER_NAME` | nombre local del contenedor dev     |
| `POSTGRES_HOST_PORT`      | puerto publicado al host            |
| `POSTGRES_CONTAINER_PORT` | puerto interno documentado          |
| `POSTGRES_DB`             | database inicial de desarrollo      |
| `POSTGRES_USER`           | usuario del contenedor              |
| `POSTGRES_PASSWORD`       | password local no versionado        |
| `POSTGRES_VOLUME_NAME`    | nombre real del volumen persistente |

### PostgreSQL test

Usa un servicio o perfil separado y variables con prefijo `TEST_POSTGRES_` para
container name, host port, database, user, password y volume name. La imagen y
container port deben coincidir con desarrollo. `DATABASE_TEST_NAME` identifica
la base que las suites están autorizadas a limpiar.

### pgAdmin opcional

`PGADMIN_IMAGE`, `PGADMIN_CONTAINER_NAME`, `PGADMIN_HOST_PORT`,
`PGADMIN_DEFAULT_EMAIL`, `PGADMIN_DEFAULT_PASSWORD` y
`PGADMIN_VOLUME_NAME`. El servicio pertenece al profile `devtools`; la API y
PostgreSQL no dependen de él.

### Seed foundation

`SEED_RANDOM_SEED`, `SEED_BATCH_SIZE` y `SEED_ALLOW_DEMO_DATA`. Sus reglas
detalladas se implementan en `FND-006`, pero se reservan ahora en los ejemplos.

## `.env` y ejemplos

Archivos locales ignorados:

```text
.env
.env.test
```

Archivos versionados:

```text
.env.example
.env.test.example
```

Los ejemplos contienen todas las claves y valores locales no secretos o
marcadores claros. Las imágenes exactas provienen de
[`../../../project/STACK-AND-VERSIONS.md`](../../../project/STACK-AND-VERSIONS.md):

- Node `24.17.0-bookworm-slim` con digest fijado.
- PostgreSQL `17.10-bookworm` con digest fijado.
- pgAdmin `9.16` con digest fijado.

No inventes passwords como defaults en el loader. Un valor de ejemplo no se
convierte automáticamente en credencial real.

Verifica ignore rules:

```powershell
git check-ignore .env .env.test
git check-ignore .env.example .env.test.example
```

Los dos primeros deben estar ignorados. Los examples no deben estar ignorados;
si el segundo comando no imprime nada, ese es el resultado esperado.

## Joi: reglas de diseño

- Usar `required` para credenciales y nombres operativos.
- Convertir integers y booleans una sola vez.
- Permitir variables desconocidas en el objeto de proceso porque Windows,
  terminal, Docker y CI agregan muchas que no pertenecen a la aplicación; el
  loader devuelve únicamente la allowlist declarada por NexusCRM. Una variable
  desconocida nunca se vuelve configuración accesible por accidente.
- En `prod`, exigir SSL y rechazar CORS wildcard.
- Rechazar `DATABASE_SYNCHRONIZE=true` en cualquier entorno.
- Rechazar `DATABASE_MIGRATIONS_RUN=true`; el despliegue ejecuta migraciones de
  forma explícita.
- Validar que demo seed no se habilite en `prod`.
- Mensajes de error nombran la variable, nunca su secret value.

No ocultar una variable ausente con un default inseguro. Defaults apropiados
son límites no secretos como pool size o logging apagado, siempre documentados.

## `compose.yaml`

Diseña tres services:

1. `database`: PostgreSQL de desarrollo.
2. `database_test`: PostgreSQL de pruebas bajo profile `test`.
3. `pgadmin`: herramienta opcional bajo profile `devtools`.

Cada service consume variables para image, container name, puertos,
credentials y volume name. Los nombres lógicos de services pueden ser fijos
porque forman parte de la topología declarada; sus valores operativos no.

El healthcheck de PostgreSQL debe usar user y database del environment. La API
no debe depender de `pgadmin`. Los volumes declaran un logical key y obtienen su
nombre real desde environment.

Para PostgreSQL 17, monta el volumen en `/var/lib/postgresql/data`. No cambies
esa ruta sin una migración de almacenamiento.

## Conectividad host contra contenedor

- NestJS ejecutado en Windows usa `DATABASE_HOST=localhost` y el host port
  publicado.
- NestJS dentro de Compose usa el service name `database` y el container port.
- `localhost` dentro de un contenedor apunta al mismo contenedor, no a
  PostgreSQL.

Documenta ambas variantes; no codifiques un host alternativo en la aplicación.

## Verificación manual

### Compose interpolation

```powershell
docker compose --env-file .env config
```

Revisa la salida sin compartirla: contiene valores resueltos. Confirma que no
aparezca `${VARIABLE}` sin resolver.

### PostgreSQL development

```powershell
docker compose --env-file .env up -d database
docker compose ps
docker compose logs database
```

El estado debe llegar a healthy y los logs no deben indicar authentication
failure.

### PostgreSQL test

```powershell
docker compose --env-file .env.test --profile test up -d database_test
docker compose --profile test ps
```

Confirma que development y test tienen container, host port, database y volume
distintos.

### Fallos deliberados de Joi

Prueba por separado:

1. Eliminar `DATABASE_PASSWORD`.
2. Usar `APP_PORT=70000`.
3. Usar `DATABASE_SYNCHRONIZE=true`.
4. Usar `NODE_ENV=prod` con `DATABASE_SSL=false`.

Cada cambio debe detener el arranque con la variable identificada y sin abrir
el puerto. Restaura `.env` después de cada caso.

## Errores frecuentes

- Definir credenciales tanto en Compose como en NestJS con valores diferentes.
- Usar `latest` o un tag mayor flotante.
- Versionar `.env` porque “solo es local”.
- Permitir un default de password en source code.
- Convertir cualquier string no vacío a boolean true.
- Usar la database de desarrollo en Integration.
- Iniciar pgAdmin como dependencia de la API.
- Imprimir el objeto de configuración completo en logs.

## Preguntas de comprensión

1. ¿Por qué `.env.example` se versiona y `.env` no?
2. ¿Qué problema resuelve Joi antes de crear el servidor HTTP?
3. ¿Por qué runtime y CLI deben compartir el mismo loader?
4. ¿Por qué `localhost` cambia de significado dentro de un contenedor?
5. ¿Qué riesgo evita separar el volumen de test?

## Definition of Done

- [x] Dependencias instaladas con versiones exactas.
- [x] `.env` y `.env.test` están ignorados.
- [x] Ambos example files documentan todas las variables.
- [x] Joi valida tipos, rangos y reglas por entorno.
- [x] `synchronize` y `migrationsRun` no pueden activarse accidentalmente.
- [x] Compose obtiene imágenes, credenciales, puertos y nombres desde env.
- [x] PostgreSQL development y test usan volumes distintos y llegan a healthy.
- [x] pgAdmin es opcional.
- [x] Cuatro fallos deliberados detienen el arranque sin filtrar secretos.

## Regreso

Vuelve a [`../LEARNING-PATH.md`](../LEARNING-PATH.md), checkpoint `FND-002`, y
haz el commit indicado antes de abrir DataSource.
