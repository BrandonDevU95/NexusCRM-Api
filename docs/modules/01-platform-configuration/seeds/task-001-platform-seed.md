# Seed task 001: datos base de plataforma

## Navegación

- **Código:** SEED-PLAT-001
- **Etapa A viene de:** `../LEARNING-PATH.md`, registro `PLAT-005`.
- **Etapa A regresa a:** `../LEARNING-PATH.md`, registro `PLAT-005`.
- **Etapa B la invoca:** módulo 03, registro `ORG-004`; después regresa a la
  ruta de Organizaciones.
- **No continúes hasta:** la etapa ejecutada sea idempotente, use el manager
  recibido y una falla revierta toda la corrida coordinada.

## Responsabilidad y frontera

Platform es dueño de los dos seeders porque conoce sus invariantes:

- `PlatformReferenceSeeder` — etapa A, reference data global.
- `PlatformOrganizationSeeder` — etapa B, configuración para organization IDs
  que ya existen.

El módulo Organizations es dueño del momento en que invoca la etapa B. No
copies inserts de Platform a un `OrganizationsSeeder` y no hagas que Platform
cree organizations prematuramente.

## Etapa A: reference data global

Registra y ejecuta `PlatformReferenceSeeder` después de que la migración de
Platform esté aplicada. Inserta únicamente:

1. Settings globales conocidos de idioma, moneda, zona horaria y formato de
   fecha, usando las cuatro keys y contratos definidos en
   `../development/task-002-settings-catalogs-numbering.md`; las cuatro filas
   se marcan como públicas.
2. Catálogos técnicos globales.
3. Opciones estables de esos catálogos.

Usa `key`, `code` y `catalog_id + code` como claves naturales. Una segunda
corrida puede actualizar textos administrados por el seed, pero no cambia IDs
ni crea duplicados.

No instala ni usa Faker. Los módulos 01, 02 y 03 trabajan con reference data y
constantes de bootstrap; el primer dataset Faker llega en Customers.

## Etapa B: configuración organizacional

`PlatformOrganizationSeeder` recibe el mismo `EntityManager` transaccional y
una lista explícita de organization IDs ya persistidos. Por cada organización
hace upsert de:

- Secuencias `QUOTE`, `ORDER` y `TICKET` por
  `organization_id + document_type`.
- Tasas conocidas por `organization_id + code`, con un solo default activo.
- Catálogos organizacionales mínimos por `organization_id + code` y sus
  opciones.

El seeder no crea la organización, no busca tenants por nombres de presentación
y no abre una transacción propia.

## Una sola transacción

El `SeedExecutorService` de Foundation es el único dueño de la transacción y
del advisory lock. Resuelve dependencias, abre una transacción, entrega el
mismo `EntityManager` a `OrganizationsSeeder` y a ambos seeders de Platform, y
confirma o revierte el conjunto.

Ningún seeder llama `dataSource.transaction`, crea un `QueryRunner` ni usa un
repository inyectado fuera del manager recibido. “Una transacción por bloque”
o “una transacción por organización” viola el rollback global.

## Seguridad por entorno

- Reference data en producción requiere modo explícito de despliegue.
- Ningún seed se ejecuta al arrancar la API.
- No existe endpoint HTTP de seed.
- Nunca se imprimen secretos ni el objeto de configuración completo.

## Verificación

1. Ejecuta etapa A dos veces y compara IDs/conteos.
2. Tras el módulo 03, ejecuta Organizations dos veces; su dependencia invoca la
   etapa B.
3. Provoca una falla en una tasa de la segunda organización y comprueba que no
   quede ningún cambio de esa corrida, ni siquiera de módulos padre ejecutados
   en la misma transacción.
4. Confirma que las métricas distingan inserted, updated y skipped.

## Definition of Done

- [ ] Ambos seeders pertenecen a Platform y están registrados una sola vez.
- [ ] Etapa A no depende de organizations.
- [ ] Etapa B recibe organization IDs existentes.
- [ ] Organizations invoca etapa B sin duplicar su lógica.
- [ ] No se instaló ni usó Faker.
- [ ] Todos los seeders usan el mismo `EntityManager` recibido.
- [ ] Ningún seeder abre transacciones anidadas.
- [ ] Dos corridas conservan IDs, conteos y relaciones.
- [ ] Una falla deliberada revierte la corrida completa.
