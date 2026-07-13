# Database task 002: primera migración

## Navegación

| Dato          | Valor                                       |
| ------------- | ------------------------------------------- |
| Código        | `DB-FND-002`                                |
| Vienes de     | `../LEARNING-PATH.md`, checkpoint `FND-004` |
| Regresas a    | `../LEARNING-PATH.md`, checkpoint `FND-004` |
| Rama esperada | `sdd/add-api-foundation`                    |

No continúes hasta completar `show -> run -> inspect -> revert -> inspect ->
run` y explicar qué cambió en PostgreSQL en cada paso.

## Objetivo

Aprender el ciclo de una migración TypeORM con un cambio de infraestructura
pequeño y visible. La migración habilita la extensión PostgreSQL `pgcrypto`, que
el proyecto podrá usar para generación y funciones criptográficas de base.

No se crea todavía ninguna tabla comercial.

## Por qué la primera migración no crea tablas comerciales

Las tablas de configuración pertenecen al módulo de plataforma y requieren su
propio diseño, entities, seed y pruebas. Adelantarlas en Foundation duplicaría
decisiones y haría confuso el primer diff.

Una extensión de PostgreSQL es un buen cambio de infraestructura porque:

- No proviene de una entity.
- Obliga a usar `migration:create` en lugar de `migration:generate`.
- Se puede inspeccionar directamente.
- Permite practicar reversión antes de que existan foreign keys o datos.

## Estado previo esperado

```powershell
docker compose --env-file .env up -d database
pnpm migration:show
git status --short --branch
```

Debes estar en `sdd/add-api-foundation`, sin migraciones aplicadas ni archivos
temporales de `FND-003`.

Comprueba las extensiones actuales:

```powershell
docker compose --env-file .env exec database sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dx"'
```

Registra si `pgcrypto` ya aparece. Si existe por una ejecución anterior, usa una
base o volumen desechable limpio para aprender el cambio real; no finjas la
prueba sobre un estado desconocido.

## Crear la migración

```powershell
pnpm migration:create src/database/migrations/EnableDatabaseExtensions
```

TypeORM agrega un timestamp al archivo. No renombres ni elimines ese timestamp:
ordena la historia y evita nombres repetidos.

Esta tarea usa `create`, no `generate`, porque las extensiones no se deducen de
decorators de una entity.

## Diseñar `up`

El avance debe:

1. Solicitar la extensión `pgcrypto` solo si todavía no existe.
2. No crear tablas, usuarios, databases ni datos demo.
3. No depender de un schema local distinto al configurado.
4. Permitir que una base limpia y una base que ya tenga la extensión lleguen al
   mismo estado.

Escribe tú la operación usando la API de migraciones de TypeORM. Consulta la
documentación oficial para la sintaxis; esta guía define la intención y las
reglas, no el código literal.

## Diseñar `down`

La reversión debe retirar únicamente la extensión que esta migración administra
y solo será segura mientras ninguna tabla u objeto posterior dependa de ella.

La tarea se revierte ahora, antes de crear entities. En el futuro no se debe
revertir esta migración aislada por debajo de otras ya aplicadas. TypeORM
revierte la última migración en orden, no una seleccionada arbitrariamente.

Documenta en el archivo por qué retirar una extensión en una base con
dependencias podría fallar; no agregues `CASCADE` para forzar pérdida de objetos.

## Leer antes de ejecutar

Confirma en el archivo generado:

- Nombre de clase y archivo relacionados con `EnableDatabaseExtensions`.
- Un solo cambio de infraestructura.
- `up` idempotente respecto a la existencia de la extensión.
- `down` en sentido inverso y sin `CASCADE` indiscriminado.
- Ningún secret, hostname o database name.

Ejecuta typecheck antes de tocar la base:

```powershell
pnpm typecheck
pnpm migration:show
```

`migration:show` debe mostrar `EnableDatabaseExtensions` como pendiente.

## Ciclo obligatorio

### 1. Run

```powershell
pnpm migration:run
pnpm migration:show
```

TypeORM debe registrar la migración como aplicada.

### 2. Inspect

```powershell
docker compose --env-file .env exec database sh -lc 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\dx"'
```

Confirma que `pgcrypto` exista. Inspecciona también la tabla de control de
migraciones mediante pgAdmin o `psql`; debe contener una fila con el timestamp y
nombre de la migración.

### 3. Revert

```powershell
pnpm migration:revert
pnpm migration:show
```

La migración vuelve a pendiente.

### 4. Inspect después de revert

Ejecuta de nuevo `\dx`. `pgcrypto` ya no debe aparecer si Foundation es el único
owner y la base estaba limpia. La tabla de control no debe conservar la fila
como aplicada.

### 5. Run otra vez

```powershell
pnpm migration:run
pnpm migration:show
```

El estado final correcto es: migración aplicada y `pgcrypto` disponible.

## Probar desde estado limpio

La prueba completa no consiste en borrar al azar el volumen de desarrollo.
Utiliza el servicio PostgreSQL test y su volumen desechable:

1. Confirma en `docker compose config` el nombre exacto del volumen test.
2. Detén únicamente `database_test`.
3. Elimina únicamente ese volumen después de revisar el target.
4. Levanta de nuevo el profile test.
5. Apunta el environment de CLI a test.
6. Ejecuta `migration:run`.
7. Confirma la extensión y la tabla de control.

Este flujo se automatizará en `FND-007`; aquí debes comprender cada paso.

## Diferencia entre migration y seed

| Migración                                                 | Seed                                        |
| --------------------------------------------------------- | ------------------------------------------- |
| Cambia estructura o capacidad del schema                  | Inserta datos conocidos                     |
| Se ejecuta en todos los entornos como parte de despliegue | Demo data solo en dev/test                  |
| Tiene orden histórico y transformación `up/down`          | Tiene registry, dependencias e idempotencia |
| Habilita `pgcrypto`                                       | Nunca habilita extensiones                  |

## Errores frecuentes

- Usar `migration:generate` y esperar que detecte una extensión.
- Dejar una migración vacía solo porque el comando terminó correctamente.
- Ejecutar `revert` sin saber cuál es la última aplicada.
- Agregar `CASCADE` al drop para silenciar dependencias.
- Probar con `synchronize=true`.
- Editar el timestamp manualmente.
- Versionar una migración que no se ejecutó en PostgreSQL real.

## Preguntas de comprensión

1. ¿Por qué este cambio requiere `migration:create`?
2. ¿Qué registra la tabla de migraciones de TypeORM?
3. ¿Por qué `down` puede dejar de ser seguro después de otras migraciones?
4. ¿Qué demuestra `run -> revert -> run` que typecheck no demuestra?
5. ¿Por qué el seed no debe habilitar `pgcrypto`?

## Definition of Done

- [ ] Existe una sola migración `EnableDatabaseExtensions` con timestamp.
- [ ] `up` administra `pgcrypto` sin crear tablas ni datos.
- [ ] `down` no usa un cascade indiscriminado.
- [ ] Typecheck pasa.
- [ ] Se completó `show -> run -> inspect -> revert -> inspect -> run`.
- [ ] El estado final contiene `pgcrypto` y la migración aplicada.
- [ ] El ciclo funciona contra PostgreSQL test limpio.
- [ ] `synchronize` y `migrationsRun` siguen en false.

## Regreso

Vuelve a [`../LEARNING-PATH.md`](../LEARNING-PATH.md), checkpoint `FND-004`, y
confirma la migración antes de abrir Seed.
