# Database task 002: flujo de migraciones

## Navegación

- **Código:** DB-PLAT-002
- **Vienes de:** `../LEARNING-PATH.md`, paso 3.
- **Regresa a:** `../LEARNING-PATH.md`, paso 4.
- **No continúes hasta:** probar `up`, `down` y `up` otra vez en una base desechable.

## Propósito

Aprender a tratar una migración como una versión revisable del esquema, no como un comando mágico generado por TypeORM.

## Primera migración

1. Confirma que `synchronize` sea `false` y que la CLI use el mismo DataSource que la aplicación.
2. Crea una base de desarrollo vacía.
3. Genera o escribe la migración con un nombre descriptivo equivalente a `CreatePlatformConfiguration`.
4. Lee el método de avance: debe crear extensión UUID si hace falta, tablas, constraints e índices en un orden válido.
5. Lee el método de reversión: debe eliminar primero FKs e índices dependientes y después tablas en orden inverso.
6. Ejecuta la migración y consulta la tabla de control de migraciones.
7. Revisa el esquema real con una herramienta de PostgreSQL; no asumas que compilar equivale a migrar.
8. Revierte una vez, confirma que las tablas desaparecieron y vuelve a ejecutar.

Comandos del ciclo, usando los wrappers fijados en Foundation:

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreatePlatformConfiguration
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run

## Regla para cambios posteriores

Una migración aplicada y compartida no se edita para ocultar un error. Se crea otra migración que transforma el estado anterior al nuevo. La secuencia debe funcionar en una base existente y en una base completamente vacía.

## Datos contra esquema

- Migración: tablas, columnas, constraints, índices y transformaciones indispensables.
- Seed: datos de referencia globales de Platform; los datos dependientes de
  organización esperan al módulo 03.
- No mezcles datos de demostración en una migración.

## Lista de revisión

- Nombre expresa intención.
- No contiene secretos ni nombres de entorno.
- SQL destructivo está identificado y justificado.
- `up` y `down` son simétricos cuando hacerlo es seguro.
- Se probó en base vacía.
- Se probó revertir la última migración.
