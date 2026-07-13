# Development task 001: casos de uso de clientes

## Navegación

- **Código:** DEV-CUST-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, paso 3.
- **No continúes hasta:** CRUD, owner, status, notes y tags usen services delimitados por tenant.

## Casos de uso

- Crear, consultar, actualizar y archivar cliente.
- Buscar y filtrar por status, type, industry, owner, ciudad y fechas.
- Asignar o retirar responsable.
- Cambiar estado con razón e historial.
- Agregar/archivar nota interna.
- Asignar/retirar tags.
- Consultar detalle con contactos, deals, ventas, tickets y timeline conforme existan esos módulos.

## Contrato tenant

Las rutas permanecen cortas, como `/customers`. Cada request exige `X-Organization-Id`; el guard valida membresía activa, crea tenant context y el service filtra por ese organization ID. Body y JWT no pueden seleccionar ni reemplazar tenant.

## Endpoints orientativos

- `POST /customers`
- `GET /customers`
- `GET /customers/:id`
- `PATCH /customers/:id`
- `DELETE /customers/:id` debe archivar, no hard delete
- `PUT /customers/:id/owner`
- `POST /customers/:id/status-transitions`
- `GET /customers/:id/status-history`
- `POST /customers/:id/notes`
- `DELETE /customers/:id/notes/:noteId`
- `PUT /customers/:id/tags`

## DTO validation

Longitudes y formatos de email, URL, país, tax ID y UUID; enums de status/type; fechas ISO; paginación con máximo; sort solo en columnas permitidas. El service deriva `normalizedTaxId` con una única normalización antes de consultar o persistir. No aceptes `organization_id`, `normalizedTaxId`, timestamps, history ni campos de auditoría desde body. Un update vacío debe fallar.

## Orden de implementación

1. Repositorio: siempre recibe `organizationId` y excluye archivados por defecto.
2. Crear y consultar detalle.
3. Update de campos simples.
4. Owner validando membresía del mismo tenant.
5. Transición de status + history + event en una transacción.
6. Notas y tags.
7. Lista con filtros/paginación.
8. Archivo lógico y endpoints.

## Permisos

`customers:create`, `customers:read`, `customers:update`, `customers:delete`, `customers:assign`. CASL puede limitar vendedores a clientes propios mientras managers ven el tenant.

## Auditoría y eventos

Audita create, update relevante, archive, owner y status. Emite `customer.created`, `customer.updated`, `customer.owner_assigned`, `customer.status_changed`, `customer.archived`; payload con IDs y cambios permitidos, nunca datos sensibles innecesarios.

## Errores

`404` para ID ausente, archivado u otro tenant; `409` para tax ID activo duplicado dentro del tenant; `422` para transición o owner inválido; `403` para política CASL.
