# Seed task 001: dataset de Knowledge Base

## Navegación

- Código: `SEED-KB-001`.
- Vienes de: Pasada A paso 5.
- Regresas a: Pasada A paso 6.
- Rama: `sdd/add-knowledge-base`.

## Dataset

Registra módulo `knowledge-base` con dependencias `organizations`,
`organization-members` y `products`. Usa `SEED_KNOWLEDGE_ARTICLES_COUNT` validado
con Joi; categories y tags tienen catálogos pequeños determinísticos.

Incluye categorías Guías de soporte, FAQ, Scripts de venta, Productos y
Políticas internas; articles draft/published, internal/public; tags compartidos.
Cada domain usa offset Faker propio y fecha base fija.

Keys: `knowledge-category-0001`, `knowledge-tag-0001` y
`knowledge-article-000001`. Slugs incluyen índice para garantizar unicidad. Las
asignaciones usan maps category/tag/member key a UUID.

El seeder hace upsert por `organization_id, slug`, reemplaza solo tags de sus
articles demo y usa el `EntityManager` global. No crea ticket links en Pasada A.
Tras Support Tickets, una extensión del mismo seeder crea links idempotentes por
ticket/article.

## Verificación

Ejecuta dos veces; IDs y conteos deben permanecer. Valida que search encuentre
contenido esperado, que no haya referencias cross-tenant y que una tag key
inválida provoque rollback antes de persistir.

## Definition of Done

- [ ] Counts, offset y keys son determinísticos.
- [ ] Category/tag/article relationships se validan antes de DB.
- [ ] Segunda ejecución no duplica.
- [ ] Ticket links se activan solo cuando su dependencia existe.
- [ ] Demo data está bloqueado en prod.
