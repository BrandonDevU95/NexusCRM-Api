# Seed task 001: jobs demo de Import/Export

## Navegación

- Código: `SEED-IO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 3.
- Regresas a: paso 4.

Registra `import-export` después de customers, contacts, leads, products,
quotes, orders y reports. Usa un `FileStoragePort` local de demo bajo directorio
validado; nunca escribe fuera del root configurado.

Crea files pequeños determinísticos: CSV válido, CSV con errores y XLSX de
products. Crea jobs PREVIEWED/PARTIAL/COMPLETED y export COMPLETED con checksum,
keys estables y expiry futura basada en fecha base fija. No importa nuevamente
entidades de dominio al ejecutar el seed: los jobs son historial demo.

Upsert por organization/idempotency key; si el file ya existe verifica checksum
antes de reutilizar. Segunda ejecución conserva job IDs y no multiplica rows.
Cleanup de demo elimina únicamente keys que el dataset conoce.

## Definition of Done

- [ ] Files son pequeños, determinísticos y dentro del storage demo.
- [ ] Jobs/rows tienen keys y conteos coherentes.
- [ ] Segunda ejecución conserva IDs/checksums.
- [ ] No llama providers externos ni importa datos reales.
- [ ] Prod rechaza demo storage/seed.
