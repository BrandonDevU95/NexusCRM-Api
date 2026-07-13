# Development task 001: configuración del pipeline

## Navegación

- **Código:** DEV-PIPE-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, paso 3.
- **No continúes hasta:** crear, reordenar y archivar stages conservando un pipeline válido.

## Casos de uso

Crear/listar/editar/archivar pipeline; establecer default; crear/editar/archivar etapa; reordenar todas las etapas; consultar resumen de configuración. Los montos por etapa se agregan después desde Deals.

## Contrato tenant

Las rutas `/pipelines` exigen `X-Organization-Id`. El guard valida membresía activa, crea tenant context y services filtran pipeline/stages por ese ID. Body y JWT no deciden tenant.

## Endpoints orientativos

- `POST /pipelines`, `GET /pipelines`, `GET /pipelines/:id`, `PATCH /pipelines/:id`, `DELETE /pipelines/:id`
- `POST /pipelines/:id/stages`
- `PATCH /pipelines/:id/stages/:stageId`
- `PUT /pipelines/:id/stages/order`
- `DELETE /pipelines/:id/stages/:stageId`
- `PUT /pipelines/:id/default`

## DTO validation

Códigos y nombres no vacíos, probability decimal 0–100, sort order entero, stale days positivo, IDs UUID y lista de reordenamiento sin duplicados ni faltantes. No acepta `organization_id`, history ni timestamps.

## Reordenamiento transaccional

Bloquea stages activas del pipeline; valida que el DTO contiene exactamente sus IDs; asigna posiciones temporales si el unique lo requiere; aplica orden final; registra history por cambio y outbox/audit; commit único. Una falla conserva el orden anterior completo.

## Permisos, auditoría y eventos

Usa `pipelines:read` y `pipelines:manage`, agregándolos al catálogo explícito. Audita create/update/default/archive/reorder. Emite `pipeline.created`, `pipeline.updated`, `pipeline.stages_reordered`, `pipeline.archived`.

## Errores

Otro tenant `404`; code/default duplicado `409`; configuración sin etapa abierta o terminal `422`; stage usada por deals no se borra, se archiva o responde `409`.
