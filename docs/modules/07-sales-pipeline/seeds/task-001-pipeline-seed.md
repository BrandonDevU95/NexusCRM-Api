# Seed task 001: pipeline comercial

## Navegación

- **Código:** SEED-PIPE-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 3.
- **Regresa a:** `../LEARNING-PATH.md`, paso 4.
- **No continúes hasta:** dos ejecuciones produzcan exactamente los mismos pipelines, stages y órdenes.

## Dataset

Por organización crea un pipeline default con stages: New, Contacted, Meeting Scheduled, Proposal Sent, Negotiation, Won y Lost. Usa probabilidades crecientes razonadas, WON=100 y LOST=0. Puede existir un segundo pipeline demo para otra línea comercial.

## Orden

1. Pipelines por `organization_id + code`.
2. Stages por `pipeline_id + code`.
3. Ajuste final de posiciones usando el `EntityManager` recibido.
4. History solo si el seed realmente cambia configuración; no agregues history idéntica en cada corrida.

## Faker, idempotencia y entorno

Los datos base son deterministas y no necesitan Faker. El `SeedExecutorService` abre una sola transacción para todo el grafo solicitado y entrega el mismo `EntityManager`; Pipelines no abre transacciones anidadas ni confirma por tenant. No borra stages creadas por el usuario. Solo desarrollo/test autorizado.
