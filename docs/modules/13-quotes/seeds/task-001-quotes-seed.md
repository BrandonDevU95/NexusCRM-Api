# Seed task 001: cotizaciones

**Código:** `SEED-QUOTE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 4.
**Regresa a:** `../LEARNING-PATH.md`, paso 5.
**No continúes hasta:** segunda ejecución sin quotes/items/history duplicados.

## Dataset

Por tenant, con customers/deals/products/prices existentes:

- Quote draft con product y service.
- Quote pending approval con approval pending.
- Quote approved con approval decidido.
- Quote sent válida.
- Quote accepted que Orders convertirá después.
- Quote rejected con reason.
- Quote expired con validUntil anterior y history coherente.
- Metadato de un PDF demo sin binario real, claramente marcado como fixture.
- Al menos dos revisions inmutables para una quote corregida; acceptance y PDF
  apuntan a la revision correcta.
- Un draft item MANUAL con override reason y overridden membership.

Usa folios reservados del namespace demo de `number_sequences`, no UUID/título
Faker como clave. Faker seeded genera notes/terms; money, currency, dates y
snapshots son deterministas y se calculan con la misma calculadora de dominio,
no se copian totales arbitrarios.

## Idempotencia y transacción

Upsert quote por `(organization_id, quote_number)`; después draft items,
revisions/revision items, approval y histories por claves fixture controladas. El
runner abre una única transacción y pasa su `EntityManager` a todos los seeders;
este seeder no abre transacciones anidadas ni usa repositories globales. No
reescribas una revision existente ni un documento manual que colisione.

## Verificación

Totales de cada revision = suma de sus líneas, timestamps corresponden a status,
acceptedRevision/PDF/approval apuntan a la misma revision, snapshots siguen
válidos aunque cambie product/customer y segunda ejecución conserva conteos.
