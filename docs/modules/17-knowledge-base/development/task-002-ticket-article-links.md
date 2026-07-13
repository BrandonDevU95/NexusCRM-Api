# Development task 002: asociar artículos a tickets

## Navegación

- Código: `DEV-KB-002`.
- Vienes de: Pasada B paso 2.
- Regresas a: Pasada B paso 3.
- Rama: `sdd/link-knowledge-to-tickets`.

## Contrato

Vincular o quitar exige `tickets:update` más `knowledge-base:read`. Listar exige
`tickets:read` más `knowledge-base:read`. `X-Organization-Id` es obligatorio y
no existe un permission code especial para la tabla puente.

| Método y path | Acción |
| --- | --- |
| `POST /api/v1/tickets/:ticketId/knowledge-articles/:articleId` | Vincular con note opcional |
| `DELETE /api/v1/tickets/:ticketId/knowledge-articles/:articleId` | Quitar vínculo, no borrar padres |
| `GET /api/v1/tickets/:ticketId/knowledge-articles` | Listar artículos visibles vinculados |

El Knowledge service no escribe la tabla `tickets`; solicita al Tickets service
confirmar existencia y organization. Tickets tampoco edita articles. La
transacción de link obtiene ambos registros tenant-scoped, evita duplicado,
inserta la asociación y registra `TICKET_KNOWLEDGE_LINKED`.

Unlink registra audit antes de retirar solo la association. Un article archived
permanece relacionado para historial, aunque la respuesta ordinaria lo marca
archived. Un UUID de otro tenant responde como not found.

## Definition of Done

- [ ] Owner services colaboran sin controllers ni acceso cruzado a tablas.
- [ ] Link valida mismo tenant en una transacción.
- [ ] Duplicado devuelve conflicto estable.
- [ ] Unlink no borra ticket/article.
- [ ] Audit conserva actor, ticket, article y correlation ID.

Regresa al `LEARNING-PATH`, Pasada B paso 3.
