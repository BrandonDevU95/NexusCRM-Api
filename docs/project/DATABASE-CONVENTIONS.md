# Convenciones de base de datos

## Propósito

Este documento fija las decisiones que deben repetirse en todos los módulos de
NexusCRM API. No reemplaza las tareas de `database`; cada tarea debe volver a
explicar las tablas y relaciones que le corresponden con nombres concretos.

La regla principal es sencilla: las entities describen el modelo que usa la
aplicación, pero las migraciones son el historial ejecutable que transforma la
base. Una entity modificada sin su migración es un cambio incompleto.

## Reglas no negociables

- `synchronize` permanece en `false` en `dev`, `test` y `prod`.
- `migrationsRun` permanece en `false`; ejecutar migraciones es una acción
  explícita de desarrollo o despliegue.
- Una base vacía debe llegar al esquema actual aplicando las migraciones en
  orden.
- Una migración que ya llegó a `main` no se reescribe. Una corrección requiere
  otra migración.
- Una migración contiene un cambio cohesivo; no mezcla módulos sin relación.
- Las migraciones no contienen datos Faker ni credenciales.
- El seed no crea tablas, columnas, índices ni constraints.
- Toda información comercial queda delimitada por `organization_id`.
- No se usa SQLite para simular PostgreSQL en pruebas.

## Convenciones de nombres

### PostgreSQL

| Elemento                   | Convención              | Ejemplo             |
| -------------------------- | ----------------------- | ------------------- |
| Tabla                      | plural y `snake_case`   | `customer_contacts` |
| Columna                    | singular y `snake_case` | `organization_id`   |
| Primary key                | `id`                    | `id`                |
| Foreign key                | `<entidad_padre>_id`    | `customer_id`       |
| Tabla puente               | nombres de ambos lados  | `user_roles`        |
| Timestamp de creación      | `created_at`            | `created_at`        |
| Timestamp de actualización | `updated_at`            | `updated_at`        |
| Archivo lógico             | `archived_at`           | `archived_at`       |

No todas las tablas necesitan soft delete. Se usa cuando el negocio debe
ocultar un registro sin perder su identidad o referencias. Historiales,
movimientos, snapshots y audit logs normalmente no se “desactivan”: se
conservan y se protegen contra eliminación ordinaria.

### Constraints e índices

Usar nombres explícitos facilita leer una migración y diagnosticar PostgreSQL:

| Tipo        | Patrón                  | Ejemplo                       |
| ----------- | ----------------------- | ----------------------------- |
| Primary key | `PK_<table>_id`         | `PK_users_id`                 |
| Foreign key | `FK_<table>_<column>`   | `FK_users_organization_id`    |
| Unique      | `UQ_<table>_<columns>`  | `UQ_users_organization_email` |
| Index       | `IDX_<table>_<columns>` | `IDX_users_organization_id`   |
| Check       | `CK_<table>_<rule>`     | `CK_quotes_total_nonnegative` |

Los nombres pueden acortarse cuando se acercan al límite de PostgreSQL, pero
deben seguir siendo reconocibles y únicos.

### TypeScript

- Entities, clases y enums: `PascalCase`.
- Propiedades: `camelCase`.
- Archivos: `kebab-case` con sufijo técnico, por ejemplo
  `customer-contact.entity.ts`.
- TypeORM traduce explícitamente `camelCase` a columnas `snake_case`; no se
  debe depender de una traducción implícita que pueda cambiar.

## Columnas y tipos

### Identidad

Usar UUID para entidades expuestas entre módulos o por la API. La generación
debe ser consistente: PostgreSQL genera el UUID y la primera migración de
infraestructura habilita la capacidad requerida. No mezclar UUID generados por
la aplicación y por la base sin una razón documentada.

Catálogos internos muy pequeños pueden usar otra estrategia solo si su tarea
lo justifica. “Es más fácil” no es una justificación suficiente para romper la
convención.

### Texto

- Definir una longitud cuando el dominio tenga un límite real.
- Usar `text` para contenido de longitud abierta.
- Normalizar correos para comparar, pero conservar el valor necesario para
  presentación cuando aplique.
- No confiar únicamente en `unique` para reglas case-insensitive; la tarea debe
  explicar la normalización o índice utilizado.

### Dinero y cantidades

- Usar `numeric` con precisión y escala definidas.
- No usar `float` ni `double precision` para dinero.
- Documentar moneda y reglas de redondeo.
- Totales financieros importantes se conservan como snapshots; no se
  recalculan históricamente desde precios actuales.

### Fecha y hora

- Instantes del sistema usan `timestamptz` y se almacenan en UTC.
- Una fecha de calendario sin hora usa `date`.
- La zona horaria de presentación no se guarda como si fuera un instante.
- No usar la hora actual para datos Faker determinísticos.

### Booleanos, estados y JSON

- Un booleano solo se usa cuando realmente existen dos estados.
- Flujos como quote, order o ticket usan un estado explícito y reglas de
  transición.
- Un enum de PostgreSQL se usa cuando su estabilidad compensa el costo de
  migrarlo; de lo contrario se documenta otra estrategia.
- `jsonb` sirve para payloads flexibles o snapshots, no para evitar diseñar
  relaciones consultables.

## Diseño de relaciones

Cada tarea debe contestar estas cinco preguntas sin obligar al estudiante a
deducirlas:

1. ¿Cuál es el lado uno?
2. ¿Cuál es el lado muchos?
3. ¿En qué tabla vive la foreign key?
4. ¿La relación es obligatoria o nullable?
5. ¿Qué ocurre al intentar eliminar el padre?

### One-to-many

La foreign key vive en la tabla del lado muchos. Si una organization tiene
muchos customers, `organizations` es el lado uno, `customers` es el lado muchos
y `customers.organization_id` guarda la referencia. El índice de la foreign key
se declara porque filtrar por organization será una operación frecuente. Users
es una excepción deliberada: es identidad global y se relaciona con organizations
mediante `organization_members`.

### One-to-one

El lado que depende del otro guarda la foreign key y agrega un unique
constraint. La tarea debe explicar por qué el registro dependiente no puede
existir solo.

### Many-to-many

Usar una entity intermedia explícita cuando la asignación tenga metadatos,
auditoría, vigencia, estado o reglas. `user_roles` es preferible a una join table
oculta porque la asignación puede necesitar `assigned_at`, `assigned_by` y
restricciones por organization.

### Nulabilidad

Una foreign key es nullable solo si el negocio admite que el hijo exista sin
ese padre. No hacerla nullable únicamente para facilitar el orden de creación.
Si la relación se vuelve obligatoria sobre datos existentes, usar una secuencia
de migraciones y backfill.

## Reglas `onDelete`

| Regla                    | Cuándo usarla                                                         | Riesgo que evita   |
| ------------------------ | --------------------------------------------------------------------- | ------------------ |
| `RESTRICT` o `NO ACTION` | El hijo conserva historial o impide borrar al padre                   | Pérdida silenciosa |
| `CASCADE`                | El hijo no tiene significado sin el padre y no es historial comercial | Filas huérfanas    |
| `SET NULL`               | La relación es opcional y el hijo debe sobrevivir                     | Borrado del hijo   |

No elegir `CASCADE` para hacer que una prueba pase. Quotes, orders, inventory
movements, ticket history y audit logs requieren una decisión especialmente
conservadora.

## Multi-tenancy por organization

- Toda tabla comercial incluye `organization_id` obligatorio cuando la tabla
  `organizations` ya existe.
- Todo padre tenant-scoped declara `UQ_<table>_organization_id_id` sobre
  `(organization_id, id)`, aunque `id` ya sea primary key. Esa clave candidata
  permite que un hijo compruebe tenant y parent en la misma foreign key.
- Todo hijo tenant-scoped usa una foreign key compuesta
  `(organization_id, parent_id) → parent(organization_id, id)`. Una FK simple a
  `parent.id` más una validación posterior en el service no es suficiente:
  permitiría insertar directamente una relación entre dos organizaciones.
- Las tablas puente también incluyen `organization_id` y dos FKs compuestas.
- Unicidad de negocio suele ser compuesta. Por ejemplo, un correo puede ser
  único dentro de una organization sin ser globalmente único.
- Toda consulta recibe el organization context y lo incluye en filtros.
- Conocer un UUID no autoriza a consultar datos de otra organization.
- Tablas verdaderamente globales deben estar marcadas como tales y justificar
  por qué no contienen `organization_id`.
- Cada integration task intenta insertar directamente una relación cross-tenant
  y espera que PostgreSQL la rechace, además del E2E que prueba el service.

## Identidad, membresías y actores

`users` es identidad global. Cualquier owner, assignee, approver, author o actor
dentro de un registro tenant-scoped referencia `organization_members`, no
`users`. La columna se llama `owner_member_id`, `assigned_member_id`,
`created_by_member_id` o equivalente y participa en una FK compuesta con
`organization_id`.

Los procesos automáticos no inventan un “system user”. Un historial que acepte
acciones automáticas guarda `actor_type` (`USER` o `SYSTEM`) y
`changed_by_member_id` nullable. Si `actor_type=USER`, la membresía es obligatoria;
si es `SYSTEM`, debe ser null y se conserva source/correlation.

## Idempotencia persistida

Una operación no es idempotente solo porque exista un unique natural. Cuando el
contrato acepta `Idempotency-Key`, el modelo conserva:

- `idempotency_key` dentro de la organización y operación.
- `request_fingerprint` del intento normalizado.
- resultado o identificador creado.
- timestamps y estado necesarios para reintento.

Repetir key y fingerprint devuelve el mismo resultado. Repetir la key con otra
intención produce `409`. Conversiones, fulfillments, returns y acciones de estado
que prometen idempotencia deben mostrar estas columnas o una tabla técnica común
en su database task.

## Índices y constraints

Crear constraints para invariantes que la base puede proteger aunque también
se validen en DTOs o services:

- Foreign keys.
- Unicidad simple o compuesta.
- Valores no negativos.
- Rangos válidos.
- Combinaciones de columnas obligatorias.

Agregar índices para:

- Foreign keys usadas en joins o tenant scope.
- Filtros y ordenamientos frecuentes.
- Búsquedas justificadas por casos de uso.
- Unicidad case-insensitive cuando aplique.

No crear un índice por cada columna. Cada índice aumenta almacenamiento y el
costo de escritura; la tarea debe relacionarlo con una consulta concreta.

## `DataSource` y configuración

La aplicación NestJS y la CLI de TypeORM tienen puntos de entrada distintos,
pero deben derivar host, port, database, user, password, SSL, logging,
entities y migrations del mismo contrato validado.

La CLI no puede depender de que el servidor HTTP esté levantado. Tampoco debe
mantener una segunda lista divergente de entities o variables.

Los scripts estándar del proyecto serán:

```powershell
pnpm migration:create src/database/migrations/EnableDatabaseExtensions
pnpm migration:generate src/database/migrations/CreateOrganizationsTable
pnpm migration:show
pnpm migration:run
pnpm migration:revert
```

La foundation debe verificar la sintaxis real de estos wrappers una sola vez.
Las tareas posteriores usan los mismos nombres y no vuelven a improvisar el
comando completo de TypeORM.

## Ciclo obligatorio de una migración

1. Actualizar `main` y la base local con migraciones anteriores.
2. Confirmar que no existen migraciones pendientes.
3. Diseñar el cambio antes de tocar la entity.
4. Modificar entities de un solo cambio cohesivo.
5. Generar la migración con nombre descriptivo, o crearla manualmente cuando el
   cambio no provenga de una entity.
6. Leer todo el avance y la reversión.
7. Confirmar nombres, tipos, defaults, foreign keys, constraints e índices.
8. Ejecutar la migración.
9. Inspeccionar el esquema real.
10. Revertir la última migración.
11. Confirmar que el estado anterior quedó íntegro.
12. Ejecutar de nuevo la migración.
13. Probar la secuencia completa desde una base vacía cuando se cierre el
    módulo.
14. Versionar entities y migración en el mismo commit.

## Cambios destructivos

En una base con datos, renombrar, convertir o volver obligatoria una columna
puede requerir varias versiones:

1. **Expand:** agregar la nueva estructura de forma compatible.
2. **Migrate:** copiar o transformar los datos con validaciones.
3. **Switch:** hacer que la aplicación use la estructura nueva.
4. **Contract:** retirar la estructura anterior en una versión posterior.

No comprimir estas fases en una sola migración si existe riesgo de bloqueo,
pérdida de datos o incompatibilidad durante el despliegue.

## Checklist de revisión

- [ ] `synchronize` sigue en `false`.
- [ ] El nombre de la migración expresa intención.
- [ ] El cambio pertenece a una sola tarea.
- [ ] Las tablas y columnas siguen las convenciones.
- [ ] Cada relación documenta lados, foreign key, nulabilidad y `onDelete`.
- [ ] Las foreign keys consultadas tienen índice.
- [ ] Las invariantes importantes están protegidas por constraints.
- [ ] `up` transforma el estado anterior esperado.
- [ ] `down` se probó y no oculta pérdida de datos.
- [ ] Se ejecutó `run -> revert -> run`.
- [ ] Una base vacía puede aplicar toda la historia.
- [ ] No hay datos Faker, secretos ni configuración local en la migración.
