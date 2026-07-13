# Database task 002: relaciones entre tickets y artículos

## Navegación

- Código: `DB-KB-002`.
- Vienes de: `../LEARNING-PATH.md`, Pasada B paso 1.
- Regresas a: Pasada B paso 2.
- Rama: `sdd/link-knowledge-to-tickets`.

## Prerrequisito

`tickets`, `knowledge_articles`, organizations y memberships deben existir. No
crees una FK hacia una tabla futura ni hagas nullable el ticket para adelantar
la migración.

## `ticket_knowledge_articles`

| Campo                 | Tipo         | Regla                   |
| --------------------- | ------------ | ----------------------- |
| `id`                  | uuid PK      | generado por PostgreSQL |
| `organization_id`     | uuid FK      | requerido               |
| `ticket_id`           | uuid FK      | requerido               |
| `article_id`          | uuid FK      | requerido               |
| `linked_by_member_id` | uuid FK      | requerido               |
| `note`                | varchar(500) | nullable                |
| `linked_at`           | timestamptz  | requerido               |

Unique `UQ_ticket_knowledge_articles_ticket_article` por `ticket_id, article_id`.
Índices por `organization_id, ticket_id` y `organization_id, article_id`.

Un ticket es lado uno y tiene muchos links; un article es lado uno y tiene
muchos links. `ticket_knowledge_articles` es lado muchos de ambas relaciones y
guarda las FKs. Ticket/article usan `RESTRICT`: el historial de soporte no debe
desaparecer por borrar contenido. Actor y organization también usan `RESTRICT`.

Usa FKs compuestas o constraints que garanticen que ticket, article y actor
pertenecen a la misma organization. Esta tabla no es una join table automática
porque conserva actor, fecha y nota.

## Migración

Nombre `LinkKnowledgeArticlesToTickets`. Ejecuta `show -> generate -> run ->
inspect -> revert -> run`. En reversión solo se elimina la asociación, no
tickets ni artículos.

## Definition of Done

- [ ] Duplicar el mismo link falla por unique.
- [ ] Cross-organization link falla.
- [ ] `onDelete` conserva historial.
- [ ] Ambos sentidos tienen índice.
- [ ] Migración se revirtió y reaplicó.

Regresa al `LEARNING-PATH`, Pasada B paso 2.
