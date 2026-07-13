# Database task 001: schema de Knowledge Base

## Navegación

- Código: `DB-KB-001`.
- Vienes de: `../LEARNING-PATH.md`, Pasada A paso 1.
- Regresas a: Pasada A paso 2.
- Rama: `sdd/add-knowledge-base`.

## Tablas

### `knowledge_categories`

| Campo | Tipo | Nulabilidad y regla |
| --- | --- | --- |
| `id` | uuid PK | generado por PostgreSQL |
| `organization_id` | uuid FK | requerido |
| `parent_category_id` | uuid FK self | nullable para categoría raíz |
| `name` | varchar(120) | requerido |
| `slug` | varchar(140) | requerido y normalizado |
| `description` | text | nullable |
| `sort_order` | integer | requerido, default 0, no negativo |
| `is_active` | boolean | requerido, default true |
| `created_at`, `updated_at` | timestamptz | requeridos |
| `archived_at` | timestamptz | nullable |

Unique `UQ_knowledge_categories_organization_slug` por
`organization_id, slug`. Índices por `organization_id, is_active, sort_order` y
`parent_category_id`.

Una organization es lado uno y tiene muchas categories. La FK vive en
`knowledge_categories.organization_id`, es obligatoria y usa `RESTRICT` para no
perder contenido. En la jerarquía, una parent category es lado uno y tiene
muchas children; `parent_category_id` usa `RESTRICT` para exigir reubicar hijos
antes de archivar/eliminar físicamente.

### `knowledge_articles`

| Campo | Tipo | Nulabilidad y regla |
| --- | --- | --- |
| `id` | uuid PK | generado por PostgreSQL |
| `organization_id` | uuid FK | requerido |
| `category_id` | uuid FK | requerido |
| `author_member_id` | uuid FK | requerido |
| `title` | varchar(200) | requerido |
| `slug` | varchar(220) | requerido |
| `summary` | varchar(500) | nullable |
| `content` | text | requerido |
| `status` | varchar(20) | `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `visibility` | varchar(20) | `INTERNAL` o `PUBLIC` |
| `search_vector` | tsvector | derivado de title, summary y content |
| `published_at` | timestamptz | nullable; requerido lógicamente al publicar |
| `archived_at` | timestamptz | nullable |
| `created_at`, `updated_at` | timestamptz | requeridos |

Unique `organization_id, slug`. Check de coherencia entre status y
`published_at`. Índices por organization/status/visibility, category y author;
GIN sobre `search_vector` para búsqueda full-text.

Organization, category y organization member son lado uno; articles es lado
muchos. Las tres FKs viven en articles y usan `RESTRICT`. Además de la FK simple,
el service confirma que category y author membership pertenecen a la misma
organization del header.

### `knowledge_tags`

Campos: `id`, `organization_id`, `name varchar(80)`, `slug varchar(100)`,
timestamps. Unique `organization_id, slug`; índice por organization y name.

Organization es lado uno, tags lado muchos, FK obligatoria con `RESTRICT`.

### `knowledge_article_tags`

Campos: `organization_id`, `article_id`, `tag_id`, `assigned_by_member_id` y
`assigned_at`. Primary key compuesta `article_id, tag_id` y unique adicional
tenant-safe cuando se necesite para FKs compuestas.

Un article tiene muchas asignaciones y un tag tiene muchas asignaciones. Cada
asignación pertenece a un article y un tag: son dos relaciones one-to-many que
materializan many-to-many. Las FKs de article/tag usan `CASCADE` solo sobre la
asignación, porque ésta no tiene significado sin ambos padres. Actor y
organization usan `RESTRICT`.

El diseño debe impedir enlazar article y tag de organizations distintas. Hazlo
con constraints compuestas o valida en transacción y agrega tests de DB; no
confíes solo en UUIDs.

## Extensión de búsqueda

La migración puede agregar la capacidad PostgreSQL requerida para normalización
y full-text si no existe. `search_vector` se mantiene en la base mediante una
expresión o trigger documentado; el service no debe recordar actualizarlo campo
por campo.

## Migración

Nombre: `CreateKnowledgeBaseSchema`.

Orden: categories, tags, articles y article_tags. En `down`, elimina primero la
tabla puente y después articles/tags/categories. Revisa funciones o triggers de
búsqueda antes de retirar la extensión.

```powershell
pnpm migration:show
pnpm migration:generate src/database/migrations/CreateKnowledgeBaseSchema
pnpm migration:run
pnpm migration:revert
pnpm migration:run
```

## Definition of Done

- [ ] Diccionario, uniques, checks e índices coinciden con PostgreSQL.
- [ ] Todas las relaciones identifican uno, muchos, FK y `onDelete`.
- [ ] Search tiene índice y se actualiza al modificar contenido.
- [ ] Tenant mismatch no puede crear una asociación válida.
- [ ] `synchronize` permanece false y se probó reversión.

Regresa al `LEARNING-PATH`, Pasada A paso 2.
