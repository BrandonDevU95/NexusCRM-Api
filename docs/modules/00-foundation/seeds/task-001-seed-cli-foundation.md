# Seed task 001: foundation del SeedModule por CLI

## Navegación

| Dato          | Valor                                       |
| ------------- | ------------------------------------------- |
| Código        | `SEED-FND-001`                              |
| Vienes de     | `../LEARNING-PATH.md`, checkpoint `FND-006` |
| Regresas a    | `../LEARNING-PATH.md`, checkpoint `FND-006` |
| Rama esperada | `sdd/add-api-foundation`                    |

No continúes hasta que puedas listar módulos, ejecutar un registry vacío de
forma segura, rechazar un nombre inexistente y bloquear demo data en `prod`.

## Objetivo

Construir la infraestructura del seed antes de agregar datos de un dominio. El
primer seeder real se implementa en el módulo de plataforma, cuando sus tablas,
endpoints y migraciones sean estables.

Separar la infraestructura del primer dataset permite aprender:

- Cómo abrir un Nest application context sin servidor HTTP.
- Cómo registrar seeders modulares y dependencias.
- Cómo verificar migraciones antes de insertar.
- Cómo compartir una transacción y un advisory lock.
- Cómo bloquear operaciones por entorno.

## Referencia previa

Lee únicamente las secciones **Forma de ejecución**, **Transacción y
concurrencia** y **Seeds y migraciones** de
[`../../../project/SEED-STRATEGY.md`](../../../project/SEED-STRATEGY.md). Regresa
aquí después; este archivo contiene las decisiones específicas de Foundation.

## Dependencias

Foundation no instala un paquete nuevo para el runner: NestJS y TypeORM ya
aportan application context, `DataSource`, transacciones y acceso a PostgreSQL.

La versión aprobada de Faker es `@faker-js/faker@10.5.0`, pero se instala como
devDependency hasta que el primer demo dataset realmente la utilice. Los datos
de referencia del módulo de plataforma pueden no necesitar Faker. Esta decisión
mantiene la regla de no instalar paquetes “por si acaso”.

## Qué se construye ahora

```text
src/seed/
├── services/
│   └── seed-executor.service.ts
├── seed.module.ts
├── seed.registry.ts
├── seed.runner.ts
├── seed.types.ts
└── main.seed.ts
```

Responsabilidades:

- `main.seed.ts`: entrypoint CLI; crea el application context, delega y lo
  cierra incluso si ocurre un error.
- `seed.runner.ts`: interpreta `list`, `run`, `--module` y el modo de datos.
- `seed.registry.ts`: catálogo cerrado de módulos, inicialmente vacío.
- `seed.types.ts`: contratos de módulo, dependencia, context y métricas.
- `seed-executor.service.ts`: environment guard, pending migration check,
  dependency order, advisory lock, transaction y resultado.
- `seed.module.ts`: composición de providers de seed y database.

No crees controller ni endpoint `/seed`. La CLI es deliberadamente manual.

## Scripts

Define wrappers con nombres estables:

```powershell
pnpm seed:list
pnpm seed:run -- --module all
```

El primer script inicia el context, imprime registry y termina sin conectar o
modificar más de lo necesario. El segundo ejecuta el flujo completo.

El separador `--` indica a pnpm que los argumentos siguientes pertenecen al
runner. Documenta y prueba esta forma en Windows PowerShell.

## Contrato de argumentos

### `seed:list`

Muestra por módulo:

- Nombre estable.
- Tipo de datos permitido.
- Dependencias.
- Estado de registro.

En Foundation el resultado esperado es una lista vacía con mensaje explícito,
no un error ni `undefined`.

### `seed:run -- --module <name>`

- `all`: ejecuta todos los módulos registrados en dependency order.
- Nombre conocido: ejecuta el módulo y sus dependencias.
- Nombre desconocido: falla antes de abrir la transacción y lista nombres
  válidos.
- Sin `--module`: falla con ayuda de uso; no asume `all` para evitar una acción
  accidental.

### `--env-file`

El runner procesa `--env-file .env` o `--env-file .env.test` antes de crear el
Nest application context. Rechaza rutas absolutas, traversal y nombres fuera de
la allowlist. Esto permite verificar releases sobre la base test desechable sin
copiar archivos ni apuntar accidentalmente a development. Si se omite, usa
`.env`; siempre imprime environment/database name, nunca credenciales, antes de
abrir la transacción.

### Modo de datos

Distingue `reference` de `demo`. Foundation puede modelar ambos modos aunque el
registry esté vacío. `demo` solo se permite en `dev/test` y requiere
`SEED_ALLOW_DEMO_DATA=true`. `reference` en producción sigue siendo una acción
explícita de despliegue, nunca automática.

## Variables de entorno

Completa Joi, loader y examples:

| Variable               | Tipo    | Regla                                           |
| ---------------------- | ------- | ----------------------------------------------- |
| `SEED_RANDOM_SEED`     | integer | requerido para demo; rango positivo documentado |
| `SEED_BATCH_SIZE`      | integer | mínimo 1, máximo conservador                    |
| `SEED_ALLOW_DEMO_DATA` | boolean | default false; siempre false efectivo en prod   |

No agregues todavía `SEED_USERS_COUNT` o cantidades de módulos inexistentes.
Cada módulo incorpora sus variables cuando construye su dataset.

## Contrato de registry

Cada entrada futura debe declarar:

- `name`: identificador técnico único.
- `dataKind`: reference, demo o ambos.
- `dependencies`: nombres de parent modules.
- `execute`: operación que recibe context transaccional.
- Métricas que puede reportar.

El registry es cerrado y tipado. No importa archivos a partir de un nombre
enviado por terminal y no acepta nombres de tabla arbitrarios.

## Dependency order

El executor debe resolver un orden topológico:

1. Validar que cada dependencia esté registrada.
2. Detectar ciclos.
3. Incluir dependencias transitivas de un módulo solicitado.
4. Ejecutar padres antes que hijos.
5. Evitar ejecutar dos veces el mismo módulo.

En Foundation prueba este algoritmo con registros ficticios dentro de unit
tests; no agregues seeders falsos al registry de runtime.

## Verificar migraciones

Antes de abrir una transacción, el executor consulta al `DataSource` si existen
migraciones pendientes. Si encuentra una:

- No ejecuta ningún seeder.
- No intenta crear la estructura faltante.
- Informa que debe correrse `pnpm migration:run`.
- Cierra el application context y devuelve un exit code de error.

El schema siempre precede a los datos.

## Environment guard

El runner muestra environment y database name, pero nunca user password ni
otros secrets.

Reglas:

- `demo` + `dev` + autorización true: permitido.
- `demo` + `test` + autorización true: permitido para una prueba específica.
- `demo` + `prod`: rechazado sin importar la variable.
- Database name vacío o inesperado: rechazado.
- Reference data en prod: solo modo explícito; no se ejecuta desde el arranque.

## Transacción y advisory lock

Para `seed:run`, el executor:

1. Valida argumentos, environment y migraciones.
2. Resuelve dependency order.
3. Prepara datasets y validaciones que no requieren DB.
4. Abre una sola transacción.
5. Obtiene un advisory lock con un identificador constante del proyecto.
6. Entrega el mismo `EntityManager` a cada módulo.
7. Acumula métricas.
8. Confirma o revierte el conjunto completo.

No abras una transacción por seeder. No inyectes repositories externos a la
transacción para persistir.

En Foundation, ejecutar `all` con registry vacío confirma el flujo con cero
registros. No insertes una tabla `seed_runs` solo para demostrar actividad.

## Resultado y exit codes

Una ejecución correcta reporta:

- Environment y database name.
- Random seed si el modo es demo.
- Módulos en orden.
- `inserted`, `updated`, `skipped` y total.
- Duración.
- Estado committed.

Registry vacío reporta totales cero. Un error reporta la fase y estado rolled
back sin stack trace completo en salida normal; el detalle técnico puede ir al
logger de desarrollo sin secrets.

Define exit code `0` para éxito y distinto de cero para argumentos inválidos,
environment prohibido, migration pending o rollback.

## Verificación manual

### Listar registry vacío

```powershell
pnpm seed:list
```

Debe terminar correctamente y explicar que el primer módulo se registrará más
adelante.

### Ejecutar `all` sin módulos

```powershell
pnpm migration:show
pnpm seed:run -- --env-file .env.test --module all --data-kind demo
```

Con `dev`, autorización true y migraciones aplicadas, debe confirmar cero
registros sin crear tablas ni filas.

### Nombre inválido

```powershell
pnpm seed:run -- --module users --data-kind demo
```

`users` aún no está registrado. Debe fallar antes de la transacción.

### Producción bloqueada

Usa un environment temporal con `NODE_ENV=prod` y solicita demo. Debe fallar
aunque `SEED_ALLOW_DEMO_DATA=true`. No apuntes esta prueba manual a una database
de producción real.

## Qué se agrega en cada módulo futuro

1. Tipo de dataset del dominio.
2. Factory determinística y domain offset.
3. Validator previo.
4. Seeder con el manager recibido.
5. Entrada y dependencias en registry.
6. Variables `SEED_<DOMAIN>_COUNT` cuando correspondan.
7. Métricas.
8. Unit, integration e idempotence tests.

## Errores frecuentes

- Agregar un controller porque era la forma conocida del POS.
- Ejecutar seed automáticamente en `main.ts`.
- Hacer que `--module` opcional signifique `all`.
- Aceptar un table name arbitrario.
- Insertar antes de verificar pending migrations.
- Abrir una transacción dentro de cada seeder.
- Crear datos falsos en Foundation para “ver algo”.
- Registrar Faker como dependency de producción sin necesidad.

## Preguntas de comprensión

1. ¿Por qué el SeedModule no necesita un controller?
2. ¿Qué diferencia existe entre registry y dependency order?
3. ¿Por qué se revisan migraciones antes de la transacción?
4. ¿Qué garantiza compartir un solo `EntityManager`?
5. ¿Por qué registry vacío es un resultado válido en Foundation?

## Definition of Done

- [x] Faker no se instaló antes de que exista un dataset que lo utilice.
- [x] SeedModule se ejecuta sin servidor HTTP.
- [x] No existe endpoint de seed.
- [x] `seed:list` maneja registry vacío.
- [x] `seed:run` exige module explícito.
- [x] Nombre desconocido falla antes de la transacción.
- [x] Pending migrations impiden ejecución.
- [x] Demo data está bloqueado en prod.
- [x] Executor define una transacción y advisory lock compartidos.
- [x] Registry vacío produce métricas cero sin crear datos artificiales.

## Regreso

Vuelve a [`../LEARNING-PATH.md`](../LEARNING-PATH.md), checkpoint `FND-006`, y
haz el commit antes de abrir Tests.
