# Test task 001: currículo inicial de pruebas

## Navegación

| Dato          | Valor                                       |
| ------------- | ------------------------------------------- |
| Código        | `TEST-FND-001`                              |
| Vienes de     | `../LEARNING-PATH.md`, checkpoint `FND-007` |
| Regresas a    | `../LEARNING-PATH.md`, checkpoint `FND-007` |
| Rama esperada | `sdd/add-api-foundation`                    |

No continúes hasta que unit, integration, migration y smoke E2E pasen por
separado y puedas explicar qué diferencia existe entre ellas.

## Objetivo

Aprender pruebas en una escalera corta. No se busca coverage alto ni probar
NestJS o TypeORM internamente. Se busca comprobar cuatro decisiones de
Foundation:

1. Joi rechaza configuración inválida.
2. El `DataSource` conecta exclusivamente a PostgreSQL test.
3. La historia de migraciones construye y revierte infraestructura.
4. El contrato HTTP versionado puede iniciar, responder y propagar correlation
   ID de forma consistente.

## Dependencias y versiones

El scaffold ya debe contener:

- `@nestjs/testing@11.1.28`.
- `jest@29.7.0`.
- `ts-jest@29.4.11`.
- `@types/jest@29.5.14`.
- `supertest@7.2.2`.
- `@types/supertest@7.2.0`.

Si falta alguna, instala la fase 2 exacta de
[`../../../project/STACK-AND-VERSIONS.md`](../../../project/STACK-AND-VERSIONS.md).
No mezcles Jest 29 con tipos 30 ni agregues Vitest.

## Archivos de configuración

```text
src/config/env.validation.spec.ts
test/
├── helpers/
│   ├── test-env.helper.ts
│   └── test-database.helper.ts
├── integration/
│   └── foundation/
│       └── data-source.integration-spec.ts
├── migrations/
│   └── foundation.migration-spec.ts
├── e2e/
│   └── foundation/
│       └── app-bootstrap.e2e-spec.ts
├── jest-integration.json
├── jest-migrations.json
└── jest-e2e.json
```

Puedes conservar el archivo E2E generado mientras migras su caso a la carpeta
indicada. No mantengas dos smoke tests idénticos al terminar.

Cada configuración incluye únicamente su patrón de archivos. Integration,
migrations y E2E usan ejecución serial al inicio para evitar que varias suites
compartan la misma database mientras todavía estás aprendiendo aislamiento.

## Ambiente de pruebas

Antes de cualquier suite con DB:

```powershell
docker compose --env-file .env.test --profile test up -d database_test
docker compose --profile test ps
```

El helper de seguridad debe confirmar:

- `NODE_ENV=test`.
- Database name igual a `DATABASE_TEST_NAME` validado.
- Host port correspondiente al servicio test.
- Database name distinto de development.
- `synchronize=false` y `migrationsRun=false`.

Si una condición falla, la suite se detiene antes de limpiar o migrar.

## Escalera de aprendizaje

### Nivel 1 — Unit: Joi sin NestJS

**System under test:** el schema/función de validación de environment.

No inicia NestJS, Docker ni TypeORM. Cada caso crea un objeto de variables
explícito y llama al validador.

Matriz mínima:

| ID           | Arrange                     | Act     | Assert                             | Bug que detecta                         |
| ------------ | --------------------------- | ------- | ---------------------------------- | --------------------------------------- |
| `FND-UT-001` | Environment dev completo    | Validar | Resultado normalizado              | Loader que rechaza configuración válida |
| `FND-UT-002` | Sin `DATABASE_PASSWORD`     | Validar | Error nombra la variable, no valor | Default inseguro                        |
| `FND-UT-003` | `APP_PORT=70000`            | Validar | Error de rango                     | Puerto inválido aceptado                |
| `FND-UT-004` | `DATABASE_SYNCHRONIZE=true` | Validar | Error explícito                    | Schema modificado automáticamente       |
| `FND-UT-005` | Prod sin SSL                | Validar | Error condicionado por entorno     | Conexión productiva insegura            |
| `FND-UT-006` | Prod con demo seed true     | Validar | Demo queda rechazado               | Faker habilitado en producción          |

En cada test distingue Arrange, Act y Assert. No reutilices y mutés el mismo
objeto entre casos; crea una copia limpia.

Ejecuta primero solo el archivo:

```powershell
pnpm test -- env.validation.spec.ts
pnpm test:watch -- env.validation.spec.ts
```

Detén watch antes de avanzar.

### Nivel 2 — Integration: DataSource

**System under test:** loader + options + `DataSource` contra PostgreSQL test.

No inicia HTTP. Usa credentials de `.env.test`, inicializa la conexión,
confirma database name y cierra el `DataSource` en cleanup aunque falle un
assert.

Matriz mínima:

| ID           | Arrange                    | Act                    | Assert                                             | Bug que detecta         |
| ------------ | -------------------------- | ---------------------- | -------------------------------------------------- | ----------------------- |
| `FND-IT-001` | PostgreSQL test healthy    | Inicializar DataSource | Conecta a test y no dev                            | Environment equivocado  |
| `FND-IT-002` | DataSource inicializado    | Consultar estado       | `synchronize` y auto migrations están desactivados | Configuración peligrosa |
| `FND-IT-003` | Password temporal inválido | Inicializar            | Falla sin filtrar password                         | Error inseguro          |
| `FND-IT-004` | Conexión válida            | Inicializar y destruir | Proceso termina sin handles abiertos               | Cleanup faltante        |

Ejecuta:

```powershell
pnpm test:integration -- data-source.integration-spec.ts
```

No simules `DataSource`: la integración existe para comprobar PostgreSQL real.

### Nivel 3 — Migration: historia ejecutable

**System under test:** todas las migraciones actuales sobre test database.

Esta suite es destructiva solo dentro de la base autorizada. Debe ejecutarse en
serie y restaurar el estado final aplicado.

Flujo:

1. Verificar guard de test.
2. Limpiar el schema autorizado mediante una estrategia explícita.
3. Confirmar cero migraciones aplicadas.
4. Aplicar todas.
5. Confirmar `EnableDatabaseExtensions` y `pgcrypto`.
6. Revertir la última.
7. Confirmar que queda pendiente y la extensión desaparece.
8. Aplicar de nuevo.
9. Confirmar estado final sin pendientes.
10. Cerrar conexión.

No llames `synchronize` ni copies SQL de las migraciones al test. El test debe
ejecutar la historia real.

```powershell
pnpm test:migrations
```

Si falla al limpiar, confirma primero `NODE_ENV` y database name; no debilites
el guard.

### Nivel 4 — E2E: smoke de arranque

**System under test:** módulo raíz, ConfigModule, TypeORM y adaptador HTTP.

Supertest inicia la aplicación en memoria; no necesita `pnpm start:dev` en otra
terminal. Usa `.env.test` y migrations ya aplicadas.

Matriz mínima:

| ID            | Arrange                 | Act                                  | Assert                                       | Bug que detecta                |
| ------------- | ----------------------- | ------------------------------------ | -------------------------------------------- | ------------------------------ |
| `FND-E2E-001` | App con env test válido | Inicializar                          | App arranca sin socket externo               | Wiring roto                    |
| `FND-E2E-002` | App inicializada        | `GET /api/v1/health`                 | Status, response y estado database esperados | Prefix, route o readiness roto |
| `FND-E2E-003` | App inicializada        | Request con correlation ID válido    | Mismo ID aparece en header y response        | Trazabilidad rota              |
| `FND-E2E-004` | App inicializada        | Request inválido o route inexistente | Error envelope sin stack ni secrets          | Filtro global roto             |
| `FND-E2E-005` | App inicializada        | Cerrar app                           | No quedan conexiones abiertas                | Lifecycle incompleto           |

El endpoint del starter ya no forma parte del contrato. La suite usa el health
endpoint permanente creado en `FND-005`.

```powershell
pnpm test:e2e -- app-bootstrap.e2e-spec.ts
```

## Seed tests en Foundation

Después de comprender los cuatro niveles, agrega unit tests pequeños para:

- Registry vacío produce una lista válida.
- Nombre desconocido falla antes de transacción.
- Un grafo simple ordena parents antes que children.
- Un ciclo se rechaza.
- Pending migration detiene ejecución.
- Demo en prod se rechaza aunque el flag sea true.

No necesitas Integration de seed hasta que exista el primer seeder real. El
módulo de plataforma probará idempotencia y rollback con filas.

## Scripts finales

Completa los wrappers para que apunten a configuraciones distintas:

```powershell
pnpm test
pnpm test:integration
pnpm test:migrations
pnpm test:e2e
```

Después define `test:all` en este orden: unit, integration, migrations y E2E.
No incluyas `--passWithNoTests`; una suite vacía debe ser una señal de
configuración incompleta.

## Aislamiento y cleanup

- Unit no toca estado global.
- Integration cierra cada `DataSource` que abre.
- Migration usa exclusivamente database test allowlisted.
- E2E cierra la app en `afterAll`, incluso ante errores.
- Ninguna suite depende de `seed:run`.
- Ninguna suite inicia o detiene el contenedor de desarrollo.
- No se crea un endpoint de cleanup.

## Cómo leer fallos de esta tarea

### Timeout

Busca primero un `DataSource` o app sin cerrar. No aumentes el timeout sin
evidencia.

### Authentication failed

Confirma `.env.test`, host port y container health. No imprimas el password.

### Migration already applied o missing extension

La base no comenzó en el estado esperado. Revisa guard y cleanup; no habilites
`synchronize`.

### Suite E2E usa development

Detén la suite. Corrige selección de env antes de ejecutar cleanup o requests.

### Test pasa solo

Existe estado compartido u orden implícito. Revisa variables mutables, cleanup
y database antes de aceptar el resultado.

## Preguntas de comprensión

1. ¿Por qué Joi se prueba sin iniciar NestJS?
2. ¿Qué demuestra Integration que un mock de repository no demuestra?
3. ¿Por qué la suite de migraciones empieza en un schema limpio?
4. ¿Qué capas atraviesa el smoke E2E?
5. ¿Por qué demo seed no es un prerrequisito de estas suites?
6. ¿Qué recurso debe cerrarse para evitar un Jest con handles abiertos?

## Definition of Done

- [x] Unit cubre seis reglas Joi.
- [x] Integration conecta únicamente a PostgreSQL test.
- [x] Migration aplica, revierte y reaplica la historia real.
- [x] E2E inicia, consulta y cierra la app.
- [x] Seed registry tiene unit tests de orden y guards.
- [x] Ninguna suite usa SQLite, development database o demo seed.
- [x] Los scripts apuntan a patrones distintos.
- [x] No se usa `--passWithNoTests`.
- [x] Cada suite pequeña pasa por separado.
- [x] Puedes explicar qué bug detecta cada caso.

## Regreso

Vuelve a [`../LEARNING-PATH.md`](../LEARNING-PATH.md), checkpoint `FND-007`,
registra el commit y ejecuta el quality gate completo.
