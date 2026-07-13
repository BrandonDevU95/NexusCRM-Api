# Stack tecnológico y versiones fijadas

## Propósito

Este documento define la combinación oficial de tecnologías para `NexusCRM-Api`.
Su objetivo es que cualquier instalación local, ejecución de pruebas o construcción
de una imagen use la misma base técnica y no cambie de comportamiento porque una
dependencia publicó una versión nueva.

La selección tiene fecha de corte **2026-07-12**. Todas las versiones son exactas:
en `package.json` no se deben anteponer `^` ni `~`, y en Docker no se deben usar
etiquetas flotantes como `latest`, `17`, `18` o `9`.

La regla general del proyecto es conservadora: se prefiere una versión estable,
probada por el ecosistema de NestJS y con documentación madura sobre la versión
más reciente si esta última introduce una frontera mayor innecesaria.

## Decisiones principales

- El runtime oficial es Node.js `24.17.0` LTS.
- El gestor oficial es pnpm `11.12.0` y `pnpm-lock.yaml` forma parte del código.
- El framework es NestJS `11.1.28` sobre Express 5.
- El lenguaje se fija en TypeScript `5.9.3`.
- La persistencia usa PostgreSQL `17.10`, TypeORM `0.3.28` y migraciones.
- Joi valida la configuración y `class-validator` valida los DTO.
- Argon2id protege contraseñas; Passport y JWT resuelven autenticación.
- CASL complementa el modelo persistente de roles y permisos.
- Cookie Parser, Helmet, Throttler y Terminus cubren cookies, headers defensivos,
  límites de solicitudes y health checks; Compression se usa solo cuando la API
  sirve directamente respuestas textuales comprimibles.
- Multer gestiona `multipart/form-data` y Luxon concentra cálculos con zonas IANA.
- Decimal.js realiza cálculos monetarios; PDFKit genera documentos comerciales.
- Event Emitter y Schedule coordinan eventos y tareas locales, mientras Nodemailer
  entrega correo mediante SMTP. Ninguno reemplaza el outbox ni la idempotencia.
- ExcelJS y los paquetes separados de CSV cubren importación/exportación sin
  instalar el metapaquete `csv` completo.
- Jest y Supertest son el camino oficial para pruebas.
- Faker se usa únicamente para seeds y datos de prueba reproducibles.
- pgAdmin es una herramienta opcional de desarrollo; no es parte de producción.

## Matriz de versiones

### Herramientas locales verificadas

Estas herramientas no forman parte de `package.json`, pero la guía Git/Docker se
validó en Windows con esta línea base exacta. En otro sistema operativo puede
usarse un build equivalente de la misma versión si sus comandos producen el
mismo contrato.

| Herramienta | Versión verificada | Uso | Fuente oficial |
| --- | ---: | --- | --- |
| Git for Windows | `2.51.2.windows.1` | Branches, commits, tags y merges. | [Git for Windows](https://gitforwindows.org/) |
| GitHub CLI | `2.96.0` | Auth, Pull Requests y releases. | [Release 2.96.0](https://github.com/cli/cli/releases/tag/v2.96.0) |
| Docker Engine | `29.6.1` | Runtime de contenedores local. | [Docker Engine](https://docs.docker.com/engine/release-notes/) |
| Docker Compose | `5.3.0` | PostgreSQL, test database y pgAdmin profiles. | [Docker Compose](https://docs.docker.com/compose/releases/) |

Antes de Foundation ejecuta `git --version`, `gh --version`, `docker version` y
`docker compose version`. Una diferencia no se “arregla” usando `latest`: se
revisa compatibilidad y se documenta si la línea base cambia.

### Plataforma y framework

| Componente | Versión exacta | Motivo y compatibilidad | Fuente oficial |
|---|---:|---|---|
| Node.js | `24.17.0` LTS | Es una versión LTS vigente. Cumple los requisitos de NestJS, pnpm, Joi y Faker. Node 26 permanece en la línea Current en la fecha de corte. | [Node.js 24.17.0](https://nodejs.org/en/blog/release/v24.17.0), [ciclo de versiones](https://nodejs.org/en/about/previous-releases) |
| pnpm | `11.12.0` | Requiere Node `>=22.13`; Node 24.17.0 lo satisface. Se fija también mediante `packageManager`. | [pnpm 11.12.0](https://www.npmjs.com/package/pnpm/v/11.12.0), [instalación oficial](https://pnpm.io/installation) |
| `@nestjs/common` | `11.1.28` | Debe permanecer alineado con `core`, `platform-express` y `testing`. | [paquete oficial](https://www.npmjs.com/package/@nestjs/common/v/11.1.28) |
| `@nestjs/core` | `11.1.28` | Requiere Node `>=20`; Node 24.17.0 lo satisface. | [paquete oficial](https://www.npmjs.com/package/@nestjs/core/v/11.1.28), [releases de NestJS](https://github.com/nestjs/nest/releases) |
| `@nestjs/platform-express` | `11.1.28` | Adaptador HTTP oficial y familiar para el proyecto; NestJS 11 trabaja sobre Express 5. | [paquete oficial](https://www.npmjs.com/package/@nestjs/platform-express/v/11.1.28) |
| `@nestjs/testing` | `11.1.28` | Debe coincidir con el núcleo para crear módulos de prueba con el mismo contenedor de inyección. | [paquete oficial](https://www.npmjs.com/package/@nestjs/testing/v/11.1.28) |
| `@nestjs/cli` | `11.0.24` | CLI de la misma línea mayor; requiere Node `>=20.11`. | [paquete oficial](https://www.npmjs.com/package/@nestjs/cli/v/11.0.24), [repositorio oficial](https://github.com/nestjs/nest-cli) |
| `@nestjs/schematics` | `11.1.0` | Proporciona los generadores usados por la CLI 11. | [paquete oficial](https://www.npmjs.com/package/@nestjs/schematics/v/11.1.0) |
| TypeScript | `5.9.3` | Es la versión utilizada por el propio repositorio de NestJS. TypeScript 7 se excluye por ahora porque todavía queda fuera del rango soportado por el tooling elegido. | [TypeScript 5.9](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html), [dependencias de NestJS](https://github.com/nestjs/nest/blob/master/package.json) |
| `reflect-metadata` | `0.2.2` | Cumple el peer `^0.2.0` de NestJS 11 y habilita metadatos de decoradores. | [paquete oficial](https://www.npmjs.com/package/reflect-metadata/v/0.2.2) |
| `rxjs` | `7.8.2` | Cumple el peer `^7.1.0` del núcleo de NestJS. | [paquete oficial](https://www.npmjs.com/package/rxjs/v/7.8.2) |

### Configuración, validación y documentación HTTP

| Componente | Versión exacta | Motivo y compatibilidad | Fuente oficial |
|---|---:|---|---|
| `@nestjs/config` | `4.0.4` | Compatible con NestJS 10 y 11. Carga `.env` y delega a Joi la validación temprana. | [paquete oficial](https://www.npmjs.com/package/@nestjs/config/v/4.0.4), [configuración en NestJS](https://docs.nestjs.com/techniques/configuration) |
| `joi` | `18.2.3` | Requiere Node `>=20`, incluye tipos y conserva el enfoque utilizado en POS-Manager. Se usa para variables de entorno, no para DTO. | [paquete oficial](https://www.npmjs.com/package/joi/v/18.2.3), [documentación oficial](https://joi.dev/api/) |
| `class-validator` | `0.15.1` | Satisface el peer de NestJS y permite expresar las reglas de entrada en los DTO. | [paquete oficial](https://www.npmjs.com/package/class-validator/v/0.15.1), [repositorio oficial](https://github.com/typestack/class-validator) |
| `class-transformer` | `0.5.1` | Convierte objetos planos en instancias antes de validar DTO y satisface el peer de NestJS. | [paquete oficial](https://www.npmjs.com/package/class-transformer/v/0.5.1), [repositorio oficial](https://github.com/typestack/class-transformer) |
| `@nestjs/swagger` | `11.4.5` | Su peer exige NestJS `^11.0.1`. Incluye la distribución de Swagger UI; no se instalará `swagger-ui-express` por separado. | [paquete oficial](https://www.npmjs.com/package/@nestjs/swagger/v/11.4.5), [OpenAPI en NestJS](https://docs.nestjs.com/openapi/introduction) |

### Persistencia

| Componente | Versión exacta | Motivo y compatibilidad | Fuente oficial |
|---|---:|---|---|
| `@nestjs/typeorm` | `11.0.3` | Su rango admite NestJS 11 y TypeORM `^0.3.0`. | [paquete oficial](https://www.npmjs.com/package/@nestjs/typeorm/v/11.0.3), [integración en NestJS](https://docs.nestjs.com/techniques/database) |
| `typeorm` | `0.3.28` | La rama `0.3` usa `DataSource` y tiene un flujo de migraciones ampliamente documentado. El propio repositorio de NestJS aún fija esta versión. | [paquete oficial](https://www.npmjs.com/package/typeorm/v/0.3.28), [migraciones](https://typeorm.io/docs/advanced-topics/migrations/), [CLI](https://typeorm.io/docs/advanced-topics/using-cli/) |
| `pg` | `8.22.0` | Driver PostgreSQL aceptado por los peer dependencies de TypeORM. | [paquete oficial](https://www.npmjs.com/package/pg/v/8.22.0), [node-postgres](https://node-postgres.com/) |
| PostgreSQL | `17.10` | Minor estable actual de la línea 17 y soportado hasta noviembre de 2029. La imagen 17 conserva la ruta de datos más conocida mientras se aprende Docker y migraciones. | [política de versiones](https://www.postgresql.org/support/versioning/), [imagen oficial](https://hub.docker.com/_/postgres) |
| pgAdmin | `9.16` | Compatible con PostgreSQL 17. Se habilita únicamente como herramienta visual opcional de desarrollo. | [notas de pgAdmin 9.16](https://www.pgadmin.org/docs/pgadmin4/9.16/release_notes_9_16.html), [imagen oficial](https://hub.docker.com/r/dpage/pgadmin4/tags) |

### Seguridad y autorización

| Componente | Versión exacta | Motivo y compatibilidad | Fuente oficial |
|---|---:|---|---|
| `argon2` | `0.44.0` | Compatible con Node `>=16.17`; incluye tipos y binarios precompilados. El proyecto usará la variante Argon2id. | [paquete oficial](https://www.npmjs.com/package/argon2/v/0.44.0), [repositorio oficial](https://github.com/ranisalt/node-argon2) |
| `@nestjs/passport` | `11.0.5` | Compatible con NestJS 10/11 y Passport 0.5 a 0.7. | [paquete oficial](https://www.npmjs.com/package/@nestjs/passport/v/11.0.5), [autenticación en NestJS](https://docs.nestjs.com/security/authentication) |
| `passport` | `0.7.0` | Núcleo de estrategias aceptado por el adaptador de NestJS. | [paquete oficial](https://www.npmjs.com/package/passport/v/0.7.0), [sitio oficial](https://www.passportjs.org/) |
| `@nestjs/jwt` | `11.0.2` | Compatible con NestJS 8 a 11. Integra `jsonwebtoken` sin requerir una instalación directa adicional. | [paquete oficial](https://www.npmjs.com/package/@nestjs/jwt/v/11.0.2), [repositorio oficial](https://github.com/nestjs/jwt) |
| `passport-jwt` | `4.0.1` | Estrategia JWT estable para Passport. | [paquete oficial](https://www.npmjs.com/package/passport-jwt/v/4.0.1), [repositorio oficial](https://github.com/mikenicholson/passport-jwt) |
| `@types/passport` | `1.0.17` | Tipos de desarrollo para Passport. | [paquete oficial](https://www.npmjs.com/package/@types/passport/v/1.0.17) |
| `@types/passport-jwt` | `4.0.1` | Tipos de desarrollo para la estrategia JWT. | [paquete oficial](https://www.npmjs.com/package/@types/passport-jwt/v/4.0.1) |
| `@casl/ability` | `7.0.1` | Expresa habilidades y condiciones en la capa de aplicación. Complementa, pero no reemplaza, las tablas persistentes de roles y permisos. | [paquete oficial](https://www.npmjs.com/package/@casl/ability/v/7.0.1), [documentación oficial](https://casl.js.org/) |

### Seeds, pruebas y herramientas

| Componente | Versión exacta | Motivo y compatibilidad | Fuente oficial |
|---|---:|---|---|
| `@faker-js/faker` | `10.5.0` | Su rango admite Node `>=24`. Se ejecutará con una semilla fija para producir datos repetibles. | [paquete oficial](https://www.npmjs.com/package/@faker-js/faker/v/10.5.0), [guía oficial](https://fakerjs.dev/guide/) |
| `jest` | `29.7.0` | Es el camino probado y documentado por el starter oficial de NestJS. Jest 30 no aporta una ventaja pedagógica necesaria en esta fase. | [Jest 29.7](https://jestjs.io/docs/29.7/getting-started), [pruebas en NestJS](https://docs.nestjs.com/fundamentals/testing), [starter oficial](https://github.com/nestjs/typescript-starter/blob/master/package.json) |
| `ts-jest` | `29.4.11` | Admite Jest 29/30 y TypeScript `>=4.3 <7`; por tanto cubre la selección del proyecto. | [paquete oficial](https://www.npmjs.com/package/ts-jest/v/29.4.11), [documentación oficial](https://kulshekhar.github.io/ts-jest/) |
| `@types/jest` | `29.5.14` | Tipos alineados con la línea mayor de Jest elegida. | [paquete oficial](https://www.npmjs.com/package/@types/jest/v/29.5.14) |
| `supertest` | `7.2.2` | Permite verificar endpoints HTTP E2E sin levantar un servidor externo. | [paquete oficial](https://www.npmjs.com/package/supertest/v/7.2.2), [repositorio oficial](https://github.com/ladjs/supertest) |
| `@types/supertest` | `7.2.0` | Tipos de desarrollo alineados con Supertest 7. | [paquete oficial](https://www.npmjs.com/package/@types/supertest/v/7.2.0) |
| `ts-node` | `10.9.2` | Permite ejecutar el `DataSource` y comandos de migración desde TypeScript. | [paquete oficial](https://www.npmjs.com/package/ts-node/v/10.9.2) |
| `tsconfig-paths` | `4.2.0` | Resuelve aliases de `tsconfig` en scripts y pruebas cuando sea necesario. | [paquete oficial](https://www.npmjs.com/package/tsconfig-paths/v/4.2.0) |
| `source-map-support` | `0.5.21` | Mejora los stack traces generados desde TypeScript compilado. | [paquete oficial](https://www.npmjs.com/package/source-map-support/v/0.5.21) |
| `@types/node` | `24.13.3` | Tipos de la misma línea mayor que el runtime oficial. | [paquete oficial](https://www.npmjs.com/package/@types/node/v/24.13.3) |
| `@types/express` | `5.0.6` | Tipos de Express 5, que es la base del adaptador HTTP de NestJS 11. | [paquete oficial](https://www.npmjs.com/package/@types/express/v/5.0.6) |

### Middleware HTTP, archivos y capacidades de negocio

| Componente | Versión exacta | Motivo y compatibilidad | Fuente oficial |
|---|---:|---|---|
| `cookie-parser` | `1.4.7` | Lee la cookie HttpOnly que transporta el refresh token opaco. No valida ni rota el token; esa responsabilidad permanece en Auth. | [paquete oficial](https://www.npmjs.com/package/cookie-parser/v/1.4.7), [cookies en NestJS](https://docs.nestjs.com/techniques/cookies) |
| `@types/cookie-parser` | `1.4.10` | Tipos de desarrollo; su peer abierto de `@types/express` queda satisfecho por `5.0.6`. | [paquete oficial](https://www.npmjs.com/package/@types/cookie-parser/v/1.4.10) |
| `helmet` | `8.3.0` | Incluye tipos y requiere Node `>=18`; Node 24 lo satisface. Agrega headers defensivos, pero cada política se revisa para Swagger y futuras descargas. | [paquete oficial](https://www.npmjs.com/package/helmet/v/8.3.0), [Helmet en NestJS](https://docs.nestjs.com/security/helmet) |
| `compression` | `1.8.1` | Comprime JSON y texto cuando la API se sirve sin proxy que ya comprima. Se desactiva para PDF/XLSX y donde exista `Cache-Control: no-transform`; no se duplica en el proxy. | [paquete oficial](https://www.npmjs.com/package/compression/v/1.8.1), [compresión en NestJS](https://docs.nestjs.com/techniques/compression) |
| `@types/compression` | `1.8.1` | Tipos de desarrollo para el middleware Express. | [paquete oficial](https://www.npmjs.com/package/@types/compression/v/1.8.1) |
| `@nestjs/throttler` | `6.5.0` | Sus peers admiten NestJS 11 y `reflect-metadata` 0.2. Protege especialmente login, recuperación, refresh e importaciones. El storage en memoria solo sirve para una réplica. | [paquete oficial](https://www.npmjs.com/package/@nestjs/throttler/v/6.5.0), [rate limiting en NestJS](https://docs.nestjs.com/security/rate-limiting) |
| `@nestjs/terminus` | `11.1.1` | Sus peers admiten NestJS 11, `@nestjs/typeorm` 11, TypeORM 0.3 y RxJS 7. Expone health/readiness de API y PostgreSQL para Docker y operación. | [paquete oficial](https://www.npmjs.com/package/@nestjs/terminus/v/11.1.1), [Terminus en NestJS](https://docs.nestjs.com/recipes/terminus) |
| `multer` | `2.2.0` | Maneja `multipart/form-data`. Coincide con la dependencia de `@nestjs/platform-express@11.1.28`; se declara directa porque la aplicación configura límites y almacenamiento. | [paquete oficial](https://www.npmjs.com/package/multer/v/2.2.0), [upload en NestJS](https://docs.nestjs.com/techniques/file-upload) |
| `@types/multer` | `2.2.0` | Tipos de desarrollo de la misma línea de Multer y compatibles con `@types/express`. | [paquete oficial](https://www.npmjs.com/package/@types/multer/v/2.2.0) |
| `luxon` | `3.7.2` | Centraliza zonas IANA, intervalos y conversiones para actividades, calendario, recordatorios y reportes. Requiere Node `>=12`; Node 24 lo satisface. | [paquete oficial](https://www.npmjs.com/package/luxon/v/3.7.2), [documentación oficial](https://moment.github.io/luxon/) |
| `@types/luxon` | `3.7.2` | Luxon no publica declaraciones en el paquete; estos tipos coinciden con su línea exacta. | [paquete oficial](https://www.npmjs.com/package/@types/luxon/v/3.7.2) |
| `decimal.js` | `10.6.0` | Incluye tipos y evita `Number`/float en subtotal, descuentos, impuestos y totales. Complementa `numeric(19,4)` de PostgreSQL. | [paquete oficial](https://www.npmjs.com/package/decimal.js/v/10.6.0), [repositorio oficial](https://github.com/MikeMcl/decimal.js) |
| `pdfkit` | `0.17.2` | Genera PDF de quotes y orders mediante streams. Se conserva la línea 0.17 porque sus tipos publicados siguen esa API y el proyecto no necesita los cambios recientes de 0.18/0.19. | [paquete oficial](https://www.npmjs.com/package/pdfkit/v/0.17.2), [documentación oficial](https://pdfkit.org/) |
| `@types/pdfkit` | `0.17.6` | Definiciones más recientes de la línea 0.17; PDFKit no declara un entrypoint de tipos propio. Deben validarse con un smoke test de documento. | [paquete oficial](https://www.npmjs.com/package/@types/pdfkit/v/0.17.6) |
| `@nestjs/event-emitter` | `3.1.0` | Sus peers admiten NestJS 10/11. Desacopla eventos locales entre módulos; no garantiza entrega después de un crash y no sustituye `outbox_events`. | [paquete oficial](https://www.npmjs.com/package/@nestjs/event-emitter/v/3.1.0), [eventos en NestJS](https://docs.nestjs.com/techniques/events) |
| `@nestjs/schedule` | `6.1.3` | Sus peers admiten NestJS 10/11. Ejecuta recordatorios, expiraciones y evaluaciones periódicas; los jobs deben ser idempotentes y coordinados si hay varias réplicas. | [paquete oficial](https://www.npmjs.com/package/@nestjs/schedule/v/6.1.3), [scheduling en NestJS](https://docs.nestjs.com/techniques/task-scheduling) |
| `nodemailer` | `8.0.1` | Cliente SMTP sin dependencias runtime y compatible con Node 24. Se elige la línea 8 para mantenerla alineada con los tipos disponibles; credenciales y TLS vienen de configuración validada. | [paquete oficial](https://www.npmjs.com/package/nodemailer/v/8.0.1), [documentación oficial](https://nodemailer.com/) |
| `@types/nodemailer` | `8.0.1` | Tipos de desarrollo de la misma línea mayor que Nodemailer. | [paquete oficial](https://www.npmjs.com/package/@types/nodemailer/v/8.0.1) |
| `exceljs` | `4.4.0` | Incluye tipos y permite leer/escribir XLSX para los jobs de importación/exportación. Node 24 supera su requisito mínimo. | [paquete oficial](https://www.npmjs.com/package/exceljs/v/4.4.0), [repositorio oficial](https://github.com/exceljs/exceljs) |
| `csv-parse` | `7.0.1` | Incluye tipos y API de streams para validar CSV sin cargar archivos completos en memoria. | [paquete oficial](https://www.npmjs.com/package/csv-parse/v/7.0.1), [documentación oficial](https://csv.js.org/parse/) |
| `csv-stringify` | `6.8.1` | Incluye tipos y API de streams para exportar CSV. Se instala separado para no arrastrar utilidades del metapaquete `csv` que no usa el CRM. | [paquete oficial](https://www.npmjs.com/package/csv-stringify/v/6.8.1), [documentación oficial](https://csv.js.org/stringify/) |

### Calidad de código

| Componente | Versión exacta | Motivo y compatibilidad | Fuente oficial |
|---|---:|---|---|
| `eslint` | `9.39.5` | ESLint 9 conserva el flujo del starter oficial de NestJS. | [paquete oficial](https://www.npmjs.com/package/eslint/v/9.39.5), [documentación oficial](https://eslint.org/docs/latest/) |
| `@eslint/js` | `9.39.5` | Configuración JavaScript alineada con el mismo patch de ESLint. | [paquete oficial](https://www.npmjs.com/package/@eslint/js/v/9.39.5) |
| `typescript-eslint` | `8.63.0` | Soporta ESLint 9 y TypeScript 5.9; su rango de TypeScript declarado es `<6.1`. | [paquete oficial](https://www.npmjs.com/package/typescript-eslint/v/8.63.0), [versiones compatibles](https://typescript-eslint.io/users/dependency-versions/) |
| `prettier` | `3.9.5` | Formateador estable independiente del análisis semántico. | [paquete oficial](https://www.npmjs.com/package/prettier/v/3.9.5), [documentación oficial](https://prettier.io/docs/) |
| `eslint-config-prettier` | `10.1.8` | Desactiva reglas de ESLint que entrarían en conflicto con Prettier. | [paquete oficial](https://www.npmjs.com/package/eslint-config-prettier/v/10.1.8) |
| `eslint-plugin-prettier` | `5.5.6` | Integra la comprobación de formato al flujo de lint definido por el starter. | [paquete oficial](https://www.npmjs.com/package/eslint-plugin-prettier/v/5.5.6) |

## Compatibilidad de la combinación

La versión de Node.js seleccionada satisface los mínimos más restrictivos:

- NestJS Core exige Node `>=20`.
- NestJS CLI exige Node `>=20.11`.
- pnpm 11.12.0 exige Node `>=22.13`.
- Joi 18.2.3 exige Node `>=20`.
- Faker 10.5.0 admite Node `>=24`.
- TypeORM 0.3.28 exige Node `>=16.13`.
- Argon2 0.44.0 exige Node `>=16.17`.
- Helmet 8.3.0 exige Node `>=18`.
- Multer 2.2.0 exige Node `>=10.16`.
- Luxon 3.7.2 exige Node `>=12`.

Node `24.17.0` cumple todos estos rangos sin depender de una versión Current.

Los paquetes principales de NestJS se fijan en `11.1.28` como una unidad. No se
debe actualizar solamente `@nestjs/core`, porque un desfase con `common`,
`platform-express` o `testing` puede provocar errores de tipos, metadatos o
inyección de dependencias.

Los peers también son coherentes:

- `@nestjs/throttler@6.5.0` admite NestJS 7–11 y `reflect-metadata` 0.2.
- `@nestjs/terminus@11.1.1` admite NestJS 10/11, `@nestjs/typeorm` 10/11,
  TypeORM y RxJS 7. Sus peers para otros ORMs y transports son opcionales; no se
  instalan si NexusCRM no los usa.
- `@nestjs/event-emitter@3.1.0` y `@nestjs/schedule@6.1.3` admiten NestJS 10/11.
- `@nestjs/platform-express@11.1.28` ya depende de Multer 2.2.0. Declararlo como
  dependencia directa evita importar una dependencia transitiva y permite fijar
  exactamente la versión que configura la aplicación.
- Cookie Parser, Compression y Multer reciben tipos mediante paquetes `@types` de
  desarrollo. Helmet, Decimal.js, ExcelJS, `csv-parse` y `csv-stringify` ya
  publican sus declaraciones y no deben recibir paquetes `@types` inventados.
- Nodemailer y sus tipos se mantienen juntos en 8.0.1. PDFKit y sus tipos se
  mantienen en la línea de API 0.17 y requieren un smoke test porque los publica
  un proyecto distinto.

Event Emitter y Schedule son procesos locales. En despliegues con varias réplicas,
un evento crítico sigue el patrón outbox y un job periódico necesita coordinación
por base de datos o un scheduler externo; instalar estos paquetes no resuelve por
sí solo entrega única o recuperación después de un crash.

## Versiones nuevas que no se adoptan todavía

### TypeORM 1.0

TypeORM `1.0.0` ya existe como versión estable, pero no se adopta al comenzar el
proyecto. Es una frontera mayor reciente y el repositorio principal de NestJS
continúa probando TypeORM `0.3.28`. La rama `0.3` ofrece todo lo necesario para
entidades, relaciones, transacciones y migraciones con `DataSource`.

Adoptar TypeORM 1 en el futuro será una migración deliberada, no una actualización
automática del lockfile.

### TypeScript 7

TypeScript `7.0.2` fue publicado pocos días antes de la fecha de corte. El tooling
`typescript-eslint` elegido declara soporte para TypeScript menor que `6.1`; por
eso el proyecto conserva `5.9.3`, que además coincide con NestJS.

### Jest 30 y Vitest

El proyecto usa Jest 29 porque NestJS lo documenta y su starter oficial conserva
ese flujo. `ts-jest@29.4.11` es compatible con la combinación. No se introduce
Vitest porque obligaría a aprender una integración adicional sin mejorar los
objetivos del proyecto.

### PostgreSQL 18

PostgreSQL 18 es estable, pero su imagen oficial modificó la organización de
`PGDATA` y los puntos de montaje. PostgreSQL `17.10` tiene soporte vigente,
madurez suficiente y mantiene el esquema de volumen conocido en
`/var/lib/postgresql/data`. Un cambio mayor de PostgreSQL exigirá un plan de
respaldo, restauración y verificación separado.

### Nodemailer 9

Nodemailer `9.0.3` es la versión runtime más nueva al corte, pero fue publicada
pocos días antes y `@types/nodemailer` continúa en `8.0.1`. NexusCRM fija ambos
paquetes en `8.0.1` para que implementación y contrato TypeScript describan la
misma línea mayor. La versión 9 se evaluará cuando existan tipos alineados y se
prueben SMTP, TLS, adjuntos y errores de transporte.

### PDFKit 0.18 y 0.19

PDFKit `0.19.1` es la versión runtime más reciente, mientras
`@types/pdfkit@0.17.6` documenta la línea 0.17. Como PDFKit sigue en versión 0.x,
un salto de minor puede contener cambios incompatibles. Para cotizaciones y
órdenes se fija `pdfkit@0.17.2`; no se actualizará hasta contar con tipos
alineados y comparar PDFs mediante pruebas de contenido y render.

### Paquetes que no se agregan

- No se instala el metapaquete `csv`; solo `csv-parse` y `csv-stringify`.
- No se instalan `@types/helmet`, `@types/decimal.js`, `@types/exceljs` ni tipos
  para los paquetes CSV porque estos runtimes ya incluyen declaraciones.
- No se instala otro parser de cookies, otra biblioteca decimal, Moment ni
  Moment Timezone: duplicar responsabilidades crea reglas divergentes.
- No se instala un storage distribuido para Throttler mientras exista una sola
  réplica. Antes de escalar se elige uno deliberadamente y se prueba su fallo.
- No se instalan transports SMTP adicionales: Nodemailer cubre SMTP estándar y
  cualquier proveedor futuro requiere su propia decisión.

## Política de instalación con pnpm

### Archivos que fijan el entorno

Después de crear el proyecto, `package.json` debe declarar el runtime y el gestor:

```json
{
  "engines": {
    "node": "24.17.0",
    "pnpm": "11.12.0"
  },
  "packageManager": "pnpm@11.12.0"
}
```

El archivo `.npmrc` debe contener:

```ini
save-exact=true
engine-strict=true
strict-peer-dependencies=true
```

Estas reglas producen los siguientes efectos:

- `save-exact=true` evita que pnpm agregue `^` al instalar un paquete.
- `engine-strict=true` impide instalar con un Node incompatible.
- `strict-peer-dependencies=true` convierte incompatibilidades de peers en un
  error visible en vez de ocultarlas.

Aunque exista `save-exact=true`, los comandos de esta guía incluyen `-E` para que
la intención sea explícita. `-D` indica una dependencia requerida para desarrollo,
pruebas, compilación o scripts, pero no para ejecutar la API compilada.

### Reglas del lockfile

- `pnpm-lock.yaml` siempre se versiona en Git.
- No se edita manualmente.
- No se elimina para resolver un conflicto o una instalación fallida.
- Un cambio en el lockfile debe corresponder a una tarea deliberada.
- CI debe instalar con `pnpm install --frozen-lockfile`.
- Si `package.json` y el lockfile no coinciden, se corrige la causa; no se desactiva
  `--frozen-lockfile`.
- No se mezclan npm, Yarn y pnpm. No deben aparecer `package-lock.json` ni
  `yarn.lock`.
- No se ejecuta `pnpm update --latest` sobre todo el proyecto.

## Instalación por fases

No se instalarán todas las dependencias en el primer minuto. Cada grupo se agrega
cuando existe una tarea que lo utiliza; así, el usuario entiende qué problema
resuelve cada paquete y el historial de Git conserva esa decisión.

### Fase 0: preparar Node.js y pnpm

1. Instalar Node.js `24.17.0` mediante el administrador de versiones elegido.
2. Activar exactamente pnpm `11.12.0`.
3. Verificar que las versiones mostradas sean las declaradas en este documento.

```powershell
corepack enable
corepack prepare pnpm@11.12.0 --activate
node --version
pnpm --version
```

Resultado esperado: Node informa `v24.17.0` y pnpm informa `11.12.0`.

### Fase 1: fundación de NestJS

El proyecto se puede generar con la CLI exacta y después normalizar sus paquetes.
No se debe instalar la CLI global sin versión.

```powershell
# No ejecutes `nest new` directamente sobre la raíz existente: chocaría con
# README.md y la documentación. La ruta Foundation usa un directorio temporal,
# conserva los archivos pedagógicos y mueve únicamente el scaffold aprobado.
pnpm add -E @nestjs/common@11.1.28 @nestjs/core@11.1.28 @nestjs/platform-express@11.1.28 reflect-metadata@0.2.2 rxjs@7.8.2
pnpm add -D -E @nestjs/cli@11.0.24 @nestjs/schematics@11.1.0 typescript@5.9.3 @types/node@24.13.3 @types/express@5.0.6 ts-node@10.9.2 tsconfig-paths@4.2.0 source-map-support@0.5.21
```

### Fase 2: pruebas base y calidad

Este grupo se instala durante la fundación porque cada módulo deberá aprender a
probarse desde el principio, no al terminar el proyecto.

```powershell
pnpm add -D -E @nestjs/testing@11.1.28 jest@29.7.0 ts-jest@29.4.11 @types/jest@29.5.14 supertest@7.2.2 @types/supertest@7.2.0
pnpm add -D -E eslint@9.39.5 @eslint/js@9.39.5 typescript-eslint@8.63.0 prettier@3.9.5 eslint-config-prettier@10.1.8 eslint-plugin-prettier@5.5.6
```

### Fase 3: configuración y validación

Se instala antes de conectar servicios externos. La aplicación debe fallar al
arrancar si falta una variable obligatoria o si tiene un formato inválido.

```powershell
pnpm add -E @nestjs/config@4.0.4 joi@18.2.3 class-validator@0.15.1 class-transformer@0.5.1
```

Joi validará variables de entorno. `class-validator` y `class-transformer` se
reservan para el `ValidationPipe` y los DTO HTTP.

### Fase 4: PostgreSQL, TypeORM y migraciones

Se instala al crear la infraestructura de persistencia. `synchronize` debe quedar
en `false` desde la primera conexión; todo cambio estructural usa una migración.

```powershell
pnpm add -E @nestjs/typeorm@11.0.3 typeorm@0.3.28 pg@8.22.0
```

`ts-node` y `tsconfig-paths` ya fueron instalados en la fundación para ejecutar el
`DataSource` de migraciones. No se requiere instalar otro paquete llamado
`typeorm-cli`: TypeORM ya aporta sus ejecutables.

### Fase 5: contrato HTTP y operación base

Se instala al construir el primer contrato HTTP. Swagger UI viene incluido por
la integración; no se agrega `swagger-ui-express` directamente. Terminus expone
health/readiness y Helmet/Compression establecen el baseline HTTP desde
Foundation, antes de crear endpoints de negocio.

```powershell
pnpm add -E @nestjs/swagger@11.4.5 @nestjs/terminus@11.1.1 helmet@8.3.0 compression@1.8.1
pnpm add -D -E @types/compression@1.8.1
```

### Fase 6: contraseñas y autenticación

Argon2 se instala cuando se implemente el almacenamiento seguro de contraseñas.
Passport y JWT se agregan al comenzar sesiones y tokens. Cookie Parser recibe el
refresh token HttpOnly y Throttler protege los endpoints expuestos a abuso.

```powershell
pnpm add -E argon2@0.44.0
pnpm add -E @nestjs/passport@11.0.5 passport@0.7.0 @nestjs/jwt@11.0.2 passport-jwt@4.0.1
pnpm add -E cookie-parser@1.4.7 @nestjs/throttler@6.5.0
pnpm add -D -E @types/passport@1.0.17 @types/passport-jwt@4.0.1 @types/cookie-parser@1.4.10
```

Antes del commit comprueba cookie, CORS/CSRF, rate limits, proxy confiable y
redacción de secrets. Helmet, Compression y Terminus ya pertenecen a
Foundation; no se reinstalan en Security.

### Fase 7: autorización

CASL se instala después de comprender y crear el modelo persistente de roles,
permisos y asignaciones. No sustituye esas tablas.

```powershell
pnpm add -E @casl/ability@7.0.1
```

### Fase 8: seeds reproducibles

Faker se instala cuando el primer módulo tenga esquema, endpoints y migraciones
estables. Es dependencia de desarrollo porque no forma parte del arranque normal
de producción.

```powershell
pnpm add -D -E @faker-js/faker@10.5.0
```

Cada ejecutor de seed deberá fijar una semilla numérica antes de generar datos.
El valor se documentará en la guía de seeds para que dos ejecuciones limpias
produzcan el mismo conjunto lógico.

### Fase 9: listas de precios y dinero

Decimal.js se instala en Price Lists antes del primer cálculo monetario. Quotes,
Orders y Reports reutilizan la misma dependencia; ninguno vuelve a instalarla.

```powershell
pnpm add -E decimal.js@10.6.0
```

Las entradas monetarias pasan a Decimal desde strings; solo se serializan al
persistir o responder. PostgreSQL conserva los resultados con `numeric`, nunca
con `float` o `double precision`.

### Fase 10: Activities, Calendar, archivos y scheduling

Multer y Event Emitter entran con Activities. Luxon y Schedule entran después
con Calendar/Tasks. Se muestran en dos comandos porque pertenecen a checkpoints
distintos; no ejecutes ambos por adelantado.

```powershell
# Activities
pnpm add -E multer@2.2.0 @nestjs/event-emitter@3.1.0
pnpm add -D -E @types/multer@2.2.0

# Calendar and Tasks
pnpm add -E luxon@3.7.2 @nestjs/schedule@6.1.3
pnpm add -D -E @types/luxon@3.7.2
```

Multer debe limitar tamaño, cantidad y MIME antes de persistir metadatos. La base
guarda referencias y metadata, no un archivo arbitrario sin estrategia. Luxon
convierte desde/hacia UTC usando la zona IANA validada de la organization; no se
deben mezclar `Date`, strings locales y Luxon sin una frontera documentada.

### Fase 11: Notifications y Automations

Event Emitter y Schedule ya fueron instalados por Activities y Calendar. Al
llegar a Notifications confirma sus versiones y agrega únicamente Nodemailer;
Automations reutiliza los tres paquetes sin volver a instalarlos.

```powershell
pnpm add -E nodemailer@8.0.1
pnpm add -D -E @types/nodemailer@8.0.1
```

Los handlers deben ser idempotentes. Un evento crítico se persiste en outbox en
la misma transacción del agregado y se publica después; Event Emitter por sí solo
no es durable. Los jobs de Schedule no asumen una única ejecución si mañana hay
varias réplicas. Nodemailer obtiene host, port, secure, user, password, sender y
timeouts desde variables Joi, exige TLS válido y registra resultado sin contenido
sensible.

### Fase 12: Quotes y documentos comerciales

Decimal.js ya está disponible desde Price Lists. PDFKit se instala al agregar
la exportación PDF de quote; Orders reutiliza el mismo renderer base sin
recalcular snapshots desde precios actuales.

```powershell
pnpm add -E pdfkit@0.17.2
pnpm add -D -E @types/pdfkit@0.17.6
```

Después de instalar PDFKit se crea un smoke test que abra el stream, genere más
de una página, incruste la fuente aprobada y verifique texto, totales y cierre
del stream. No se compara un PDF binario completo byte por byte.

### Fase 13: Import y Export

ExcelJS cubre XLSX. Los dos paquetes CSV separados permiten leer y escribir por
streams sin instalar el metapaquete completo.

```powershell
pnpm add -E exceljs@4.4.0 csv-parse@7.0.1 csv-stringify@6.8.1
```

La tarea debe imponer límites de archivo/filas, encabezados permitidos, preview,
validación por fila y protección contra CSV formula injection. Los exports grandes
se transmiten o procesan como job; no se convierten completos a un único string o
Buffer. ExcelJS y ambos paquetes CSV ya incluyen tipos.

## Imágenes Docker fijadas desde `.env`

### Regla

El nombre de imagen no se escribe directamente en `compose.yaml`. Se obtiene de
variables definidas en `.env` y documentadas sin secretos en `.env.example`.
Cada valor contiene una etiqueta legible y el digest inmutable del índice
multi-arquitectura verificado en la fecha de corte.

```dotenv
NODE_IMAGE=node:24.17.0-bookworm-slim@sha256:862263c612aa437e3037674b85419622a9d93bff80aa1eee5398dfe686375532
POSTGRES_IMAGE=postgres:17.10-bookworm@sha256:5530681ea5d3e2ed4ce396f9b5cb443efbac6baf2a8a19c0c0635e40ae7eadce
PGADMIN_IMAGE=dpage/pgadmin4:9.16@sha256:40fa840c5bb7c8463957f1255b01283732c2d8c9396a956d180f8e6c296753b3
```

Los digests anteriores fueron comprobados el **2026-07-12**. El tag explica a una
persona qué versión se usa y el digest garantiza que Docker no descargue otro
contenido si el publicador reconstruye la etiqueta.

El archivo Compose deberá consumirlas mediante interpolación:

```yaml
services:
  database:
    image: ${POSTGRES_IMAGE}
  pgadmin:
    image: ${PGADMIN_IMAGE}
```

pgAdmin debe pertenecer a un perfil opcional como `devtools`. La API no puede
depender de pgAdmin para iniciar o funcionar. Todas las credenciales, puertos,
nombres de base de datos, nombres de volumen y configuración de salud también se
obtienen de variables de entorno; los valores secretos reales nunca se versionan.

Para PostgreSQL 17, el volumen persistente se monta en
`/var/lib/postgresql/data`. No se cambiará esta ruta sin estudiar primero las
reglas de la imagen oficial y la estrategia de respaldo.

## Comprobación después de instalar una fase

Después de cada grupo de dependencias:

1. Revisar que `package.json` contenga números exactos, sin `^` ni `~`.
2. Revisar el diff de `package.json` y `pnpm-lock.yaml`.
3. Ejecutar `pnpm install --frozen-lockfile` para comprobar reproducibilidad.
4. Ejecutar el lint y las pruebas que ya existan en esa etapa.
5. Revisar las advertencias de peer dependencies; no silenciarlas.
6. Registrar el cambio en el commit indicado por la tarea correspondiente.

No se instala un paquete alternativo para ocultar un error sin entender primero
la incompatibilidad original.

## Proceso deliberado de actualización

Ninguna versión de esta matriz cambia porque un comando indique que existe una
nueva. Una actualización debe seguir este flujo:

1. **Definir el alcance.** Crear una tarea concreta que indique qué paquete o
   imagen se desea actualizar y qué problema resuelve.
2. **Crear una rama permitida.** Usar, por ejemplo,
   `sdd/upgrade-nestjs-11-1-29` o `fix/upgrade-pg-security-release`, de acuerdo
   con el motivo real.
3. **Leer fuentes primarias.** Revisar release notes, migration guide, motores
   soportados y peer dependencies. No basar la decisión únicamente en el resultado
   de `pnpm outdated`.
4. **Clasificar el cambio.** Distinguir patch, minor y major. Un major requiere un
   plan de migración explícito; no se agrupa con otras actualizaciones.
5. **Actualizar una familia coherente.** Los paquetes núcleo de NestJS se mueven
   juntos. TypeScript y `typescript-eslint` se evalúan juntos. Jest, sus tipos y
   `ts-jest` se comprueban como una familia.
6. **Usar una versión exacta.** Ejecutar `pnpm add -E` o `pnpm add -D -E` con la nueva
   versión concreta. Nunca usar `@latest`.
7. **Revisar el lockfile.** Confirmar que no se introdujeron cambios transitivos
   ajenos o duplicados inesperados.
8. **Verificar por nivel.** Ejecutar lint, comprobación de tipos, pruebas unitarias,
   pruebas de integración y E2E aplicables. El build se ejecuta cuando la guía de
   la tarea lo indique o al cerrar el hito.
9. **Probar migraciones.** Si la actualización toca TypeORM, `pg` o PostgreSQL,
   crear una base limpia, aplicar todas las migraciones desde cero, probar el
   rollback permitido y verificar una base con datos de prueba.
10. **Actualizar Docker con respaldo.** Obtener la imagen, comprobar el digest
    nuevo y ensayar sobre datos desechables. Un cambio mayor de PostgreSQL requiere
    respaldo y restauración comprobados antes de tocar datos persistentes.
11. **Actualizar este documento.** Cambiar la versión, digest, fecha de revisión,
    motivo y enlaces de release notes en el mismo cambio.
12. **Hacer commit intencional.** Usar Conventional Commits, por ejemplo
    `chore(deps): upgrade pg to 8.22.1`.

No se habilita auto-merge para actualizaciones de dependencias o imágenes. Una
herramienta automática puede abrir una propuesta, pero una persona debe revisar la
compatibilidad y ejecutar las verificaciones antes de integrarla.

## Cuándo revisar esta matriz

La matriz se revisa únicamente cuando ocurra al menos una de estas condiciones:

- una versión fijada llega a fin de soporte;
- se publica una corrección de seguridad aplicable;
- una dependencia bloquea un módulo requerido del CRM;
- se cierra un hito y se decide evaluar actualizaciones;
- una plataforma de despliegue deja de soportar la versión actual.

Que exista una versión más nueva no es, por sí solo, una razón suficiente para
actualizar.
