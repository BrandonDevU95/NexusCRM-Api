# Seed task 001: actividades

**Código:** `SEED-ACT-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 5.
**Regresa a:** `../LEARNING-PATH.md`, paso 6.
**No continúes hasta:** ejecutar dos veces y conservar IDs, conteos y relaciones.

## Dataset y orden

Usa la semilla Faker global documentada por Foundation. Por cada organización
demo crea, con claves naturales deterministas:

1. Una llamada `COMPLETED` para un lead con outcome.
2. Una reunión `SCHEDULED` para un deal/customer/contact coherentes.
3. Una nota `COMPLETED` para un customer.
4. Un seguimiento `IN_PROGRESS` asignado a otro miembro activo.
5. Una actividad `CANCELLED` con motivo.
6. Dos comentarios en una actividad y un attachment de metadatos ficticios.

No subas archivos reales ni uses URLs externas. El `storage_key` demo debe ser
estable y claramente no productivo.

## Idempotencia

Faker genera subject, outcome y fechas dentro de ventanas fijas, pero no se usa
como clave de búsqueda. Deriva una clave estable del slug de organización y un
code local del fixture. Upsert o busca por esa identidad controlada; no borres
actividades que no pertenecen al seed.

## Transacción y entorno

El runner abre una única transacción y pasa su `EntityManager` a este seeder para
activities, comments, attachments e histories. No abras nested transactions ni
uses repositories globales. Un fallo del hijo revierte el conjunto; conserva
entorno development/test, confirmación y advisory lock.

## Verificación

- Segunda ejecución: cero duplicados.
- Todos los usuarios tienen membership activa en el tenant.
- Relaciones contact/customer/deal son coherentes.
- Estados terminales tienen sus timestamps.
- Ningún registro de organización A apunta a un recurso de B.
