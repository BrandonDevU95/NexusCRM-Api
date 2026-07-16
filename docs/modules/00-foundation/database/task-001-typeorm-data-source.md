# Database task 001: TypeORM DataSource

## Navegación

| Dato          | Valor                                       |
| ------------- | ------------------------------------------- |
| Código        | `DB-FND-001`                                |
| Vienes de     | `../LEARNING-PATH.md`, checkpoint `FND-003` |
| Regresas a    | `../LEARNING-PATH.md`, checkpoint `FND-003` |
| Rama esperada | `sdd/add-api-foundation`                    |

No continúes hasta que NestJS y la CLI obtengan la misma configuración,
`migration:show` conecte con PostgreSQL y ninguna tabla de dominio se cree por
sincronización.

## Objetivo

Configurar TypeORM `0.3.28` con PostgreSQL mediante un `DataSource` explícito.
Aprenderás por qué el servidor NestJS y la CLI tienen puntos de entrada
distintos, y cómo impedir que su configuración diverja.

## Dependencias

Instala las versiones fijadas:

```powershell
pnpm add -E @nestjs/typeorm@11.0.3 typeorm@0.3.28 pg@8.22.0
```

`ts-node@10.9.2` y `tsconfig-paths@4.2.0` deben existir desde el scaffold. No
instales un paquete adicional llamado `typeorm-cli`; TypeORM incluye los
executables necesarios.

## Dos entradas, un solo contrato

### Runtime NestJS

NestJS ya tiene dependency injection y `ConfigModule`. `AppModule` registra
TypeORM de manera asíncrona y construye las options desde el objeto validado.
Los feature modules registrarán sus repositories conforme aparezcan.

### CLI TypeORM

La CLI se ejecuta sin iniciar NestJS ni abrir el servidor HTTP. Necesita un
archivo que exporte un `DataSource` y cargue el mismo environment loader. No
puede depender de `ConfigService`, pero tampoco debe copiar defaults, paths o
credenciales en otro objeto independiente.

### Contrato compartido

El loader creado en `FND-002` debe poder:

1. Leer environment variables.
2. Ejecutar la validación Joi.
3. Normalizar port, booleans, SSL y pool size.
4. Entregar la sección database tanto al runtime como a la CLI.

La diferencia entre ambos consumidores es cómo reciben el objeto, no qué reglas
contiene.

## Estructura de archivos

```text
src/
├── config/
│   ├── env.validation.ts
│   ├── env.loader.ts
│   └── env.types.ts
└── database/
    ├── data-source.ts
    ├── typeorm-options.ts
    └── migrations/
```

- `typeorm-options.ts` traduce la sección database a options comunes.
- `data-source.ts` crea y exporta la instancia usada por la CLI.
- `migrations/` contiene únicamente la historia versionada del schema.

No pongas lógica de negocio ni repositories de módulos en `database/`.

## Opciones obligatorias

| Opción                               | Decisión                                              | Motivo                           |
| ------------------------------------ | ----------------------------------------------------- | -------------------------------- |
| Type                                 | PostgreSQL                                            | Motor oficial del proyecto       |
| Host, port, database, user, password | Environment validado                                  | Nada hardcodeado                 |
| SSL                                  | Environment con regla por entorno                     | Desarrollo y producción difieren |
| Logging                              | Environment                                           | Diagnóstico controlado           |
| Pool size                            | Environment validado                                  | Evitar un default invisible      |
| `synchronize`                        | `false`                                               | Schema solo por migraciones      |
| `migrationsRun`                      | `false`                                               | Acción explícita                 |
| Entities                             | Source en CLI y compiled en runtime productivo        | Mismo inventario lógico          |
| Migrations                           | Source para CLI y compiled para runtime de despliegue | Historia única                   |
| Migration table                      | nombre explícito y estable                            | Facilitar inspección             |

No uses `autoLoadEntities` como sustituto de pensar qué carga la CLI. Puede ser
útil en runtime, pero el `DataSource` debe conocer las mismas entities para
generar un diff correcto.

## Paths y ejecución

Durante desarrollo, la CLI carga archivos TypeScript desde `src`. En una imagen
compilada, la aplicación carga JavaScript desde `dist`. Diseña los globs para
que no intenten cargar a la vez `*.ts` y `*.js` del mismo árbol, porque eso puede
registrar una entity dos veces.

Foundation todavía no tiene entities. Que el arreglo esté vacío en este punto
es válido; el módulo de plataforma registrará las primeras y comprobará el
primer diff generado.

## Scripts de migración

Configura wrappers que oculten solamente la repetición de `DataSource`, no el
nombre del cambio:

| Script               | Responsabilidad                           |
| -------------------- | ----------------------------------------- |
| `migration:create`   | Crear archivo vacío para cambios manuales |
| `migration:generate` | Comparar entities contra schema actual    |
| `migration:show`     | Listar aplicadas y pendientes             |
| `migration:run`      | Aplicar pendientes en orden               |
| `migration:revert`   | Revertir únicamente la última aplicada    |

El proyecto NestJS usa el formato de módulos del starter, así que el wrapper de
CLI debe elegir el executable TypeORM compatible con ese formato y apuntar a
`src/database/data-source.ts`.

Verifica estos comandos:

```powershell
pnpm migration:show
pnpm migration:create src/database/migrations/TemporaryCommandCheck
```

El segundo comando solo comprueba el wrapper. Inspecciona el archivo temporal y
elimínalo antes de continuar; no lo confirmes ni lo conviertas en una migración
vacía. Después usa `git status` para confirmar que desapareció.

## Conexión correcta

Con PostgreSQL development healthy:

```powershell
docker compose --env-file .env up -d database
pnpm migration:show
```

Resultados esperados:

- La CLI conecta sin imprimir el password.
- No hay migraciones porque aún no se creó la primera.
- PostgreSQL no contiene tablas comerciales.
- Ejecutar `migration:show` no altera el schema.

Prueba después con un password incorrecto únicamente en una copia temporal de
la variable. Debe fallar como authentication error sin mostrar el valor.

## `synchronize` y `migrationsRun`

No basta con escribir `false` como default. Joi debe rechazar un intento de
activar `DATABASE_SYNCHRONIZE` y `DATABASE_MIGRATIONS_RUN`. El objeto de TypeORM
también fija ambas opciones en false para que una refactorización del loader no
active comportamiento destructivo.

La duplicación intencional aquí es una defensa: environment no puede
habilitarlo y la configuración de TypeORM tampoco lo delega a una variable
ambigua.

## Errores frecuentes

- Crear un `DataSource` para CLI con credentials literales.
- Cargar `.env` en un archivo y `.env.test` de forma implícita en otro.
- Mantener listas diferentes de entities.
- Usar un glob que registra source y compiled al mismo tiempo.
- Permitir `synchronize=true` en test “para avanzar más rápido”.
- Ejecutar migraciones automáticamente al arrancar producción.
- Confundir “la CLI conectó” con “el schema fue validado”.

## Preguntas de comprensión

1. ¿Por qué la CLI no puede inyectar `ConfigService` de la misma forma que
   NestJS?
2. ¿Qué parte debe compartir runtime con CLI?
3. ¿Qué error puede producir cargar una entity dos veces?
4. ¿Por qué `migration:show` no debe modificar la base?
5. ¿Qué diferencia existe entre `synchronize` y `migration:run`?

## Definition of Done

- [x] Las tres dependencias tienen versión exacta.
- [x] Runtime y CLI derivan options del mismo loader validado.
- [x] No existen credentials ni paths operativos hardcodeados.
- [x] `synchronize` y `migrationsRun` son false y no activables por env.
- [x] Los paths distinguen source de compiled.
- [x] Los cinco scripts de migración están definidos.
- [x] `migration:show` conecta y no crea schema.
- [x] El archivo temporal de prueba fue eliminado.
- [x] Un password incorrecto falla sin revelar el secreto.

## Regreso

Vuelve a [`../LEARNING-PATH.md`](../LEARNING-PATH.md), checkpoint `FND-003`, y
haz el commit indicado antes de crear la primera migración.
