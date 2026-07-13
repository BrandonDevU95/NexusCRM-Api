# Seed task 001: clientes

## Navegación

- **Código:** SEED-CUST-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 3.
- **Regresa a:** `../LEARNING-PATH.md`, paso 4.
- **No continúes hasta:** segunda ejecución conserve conteos, IDs e histories.

## Dataset

Por cada organización demo crea clientes de cada type y status, con responsables distintos, ciudades/industrias variadas, clientes sin email y algunos archivados. Añade notas, status histories y entre cero y tres tags.

Usa una cantidad moderada y documentada que permita entender el dataset; no miles de filas en el seed pedagógico.

## Dependencia e instalación

Este es el primer punto autorizado para Faker. Antes confirma que no apareció en
commits de Foundation, Platform, Security u Organizations; si ya aparece,
detente y corrige ese desvío. Instálalo ahora:

    pnpm add -D -E @faker-js/faker@10.5.0

Confirma versión exacta y lockfile. Los seeds posteriores reutilizan este paquete; no instalan otra librería de datos falsos.

## Orden

1. Verifica organizations, memberships y permisos.
2. Tags por `organization_id + code`.
3. Customers por una clave seed estable. Los tax IDs controlados son únicos entre customers activos del tenant y se guardan también normalizados.
4. Status histories cronológicamente coherentes.
5. Notes.
6. Customer tags.

## Faker reproducible

Fija una semilla numérica. Genera nombres, teléfonos y direcciones con locale adecuado; construye claves de idempotencia deterministas en lugar de intentar localizar por un nombre aleatorio.

## Idempotencia y transacción

El `SeedExecutorService` abre **una sola transacción** para todo el grafo solicitado y entrega el mismo `EntityManager` al seeder de Customers. Este seeder no abre, confirma ni revierte una transacción propia y no usa repositories ligados a otro manager. Upsert de roots por clave estable y puentes por PK compuesta. Segunda ejecución conserva IDs, conteos e histories: no agregues un nuevo status history en cada corrida.

## Entorno

Solo desarrollo/test explícito. No borra clientes ajenos al dataset ni ejecuta en producción.
