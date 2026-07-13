# Development task 001: artículos, categorías, tags y búsqueda

## Navegación

- Código: `DEV-KB-001`.
- Vienes de: Pasada A paso 3.
- Regresas a: Pasada A paso 4.
- Rama: `sdd/add-knowledge-base`.

## Permisos

Usa únicamente el catálogo de Security: `knowledge-base:read`,
`knowledge-base:create`, `knowledge-base:update`, `knowledge-base:delete` y
`knowledge-base:publish`. Categorías y tags se administran con
`knowledge-base:update`; no inventes un resource distinto.

Todos los endpoints requieren identity, `X-Organization-Id`, membership activa
y permission, salvo que un futuro portal público defina otro contrato. El flag
`PUBLIC` no vuelve anónima la API interna.

## DTOs

- `CreateKnowledgeCategoryDto`: name, slug opcional derivado, description,
  parentCategoryId y sortOrder.
- `CreateKnowledgeTagDto`: name y slug opcional.
- `CreateKnowledgeArticleDto`: categoryId, title, slug opcional, summary,
  content, visibility y tagIds.
- `UpdateKnowledgeArticleDto`: solo campos editables mientras no esté archived.
- `KnowledgeArticleQueryDto`: search, categoryId, tagIds, status, visibility,
  authorMemberId, page, limit y sort.
- `PublishKnowledgeArticleDto`: confirmación y fecha opcional no pasada.

`organizationId`, author y actor nunca vienen confiados del body; se obtienen
del request context.

## Endpoints

| Método y path | Permission | Resultado |
| --- | --- | --- |
| `POST /api/v1/knowledge/categories` | `knowledge-base:update` | Crear categoría |
| `GET /api/v1/knowledge/categories` | `knowledge-base:read` | Árbol/lista tenant-safe |
| `PATCH /api/v1/knowledge/categories/:id` | `knowledge-base:update` | Editar/reubicar |
| `DELETE /api/v1/knowledge/categories/:id` | `knowledge-base:delete` | Archivar si no deja hijos inválidos |
| `POST /api/v1/knowledge/tags` | `knowledge-base:update` | Crear tag |
| `GET /api/v1/knowledge/tags` | `knowledge-base:read` | Buscar tags |
| `POST /api/v1/knowledge/articles` | `knowledge-base:create` | Crear draft |
| `GET /api/v1/knowledge/articles` | `knowledge-base:read` | Buscar y paginar |
| `GET /api/v1/knowledge/articles/:id` | `knowledge-base:read` | Obtener article del tenant |
| `PATCH /api/v1/knowledge/articles/:id` | `knowledge-base:update` | Editar contenido/metadata |
| `POST /api/v1/knowledge/articles/:id/publish` | `knowledge-base:publish` | Publicar atómicamente |
| `POST /api/v1/knowledge/articles/:id/archive` | `knowledge-base:delete` | Archivar sin hard delete |

## Reglas y transacciones

- Slug único dentro de organization; conflicto devuelve 409.
- Category, tags y author membership deben ser del tenant actual.
- Publish requiere title, contenido no vacío, categoría activa y al menos un
  author activo.
- Cambiar tags reemplaza asignaciones dentro de una transacción.
- Publish actualiza status/published_at y escribe audit en la misma transacción.
- Archive conserva contenido y associations; no ejecuta hard delete.
- Search filtra organization antes de ranking/paginación.
- Drafts solo aparecen a actors con permiso de edición; readers ordinarios ven
  published.

Audit actions: `KNOWLEDGE_ARTICLE_CREATED`, `UPDATED`, `PUBLISHED`, `ARCHIVED`,
`VISIBILITY_CHANGED`, `CATEGORY_ARCHIVED` y `TAGS_CHANGED` con old/new values
redactados si el contenido fuera sensible.

## Orden de implementación

Categories service/controller, Tags, Articles draft/edit, transacción de tags,
publish/archive, search, permissions, audit y response DTOs. Controllers no
acceden repositories y search no concatena SQL del cliente.

## Definition of Done

- [ ] Header, membership y permissions protegen todas las rutas.
- [ ] Search, filtros, sort y paginación usan allowlists.
- [ ] Draft/public/internal tienen semántica explícita.
- [ ] Tags y publish son transaccionales.
- [ ] Archive conserva historial.
- [ ] Audit crítico comparte transacción.

Regresa al `LEARNING-PATH`, Pasada A paso 4.
