# Seed task 001: oportunidades

## Navegación

- **Código:** SEED-DEAL-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 3.
- **Regresa a:** `../LEARNING-PATH.md`, paso 4.
- **No continúes hasta:** dos ejecuciones conserven IDs, histories y totales.

## Dataset

Crea deals en todas las stages, owners y rangos de amount; incluye OPEN vencidas, ON_HOLD, WON y LOST con razones distintas. Incluye deals MANUAL, deals PRODUCTS cuyo amount coincide con sus renglones y deals sin contact para probar opcionalidad.

## Coherencia temporal y comercial

History avanza en orden real; expected close y won/lost date tienen sentido; WON usa stage WON y LOST stage LOST; contact pertenece al customer; owner, pipeline y products al mismo tenant.

## Orden

Loss reasons → deals → deal products → stage histories. Preferiblemente usa los servicios de transición para generar estados terminales. Semilla Faker fija; clave seed determinista por tenant/deal.

## Idempotencia, transacción y entorno

Upsert roots y puentes por clave estable; no agregues history duplicada en segunda corrida. El `SeedExecutorService` abre una sola transacción para el grafo solicitado y entrega el mismo `EntityManager`; Deals no abre transacciones anidadas ni confirma por deal/tenant. Solo desarrollo/test; no borra oportunidades del usuario.
