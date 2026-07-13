# Development task 001: catálogo vendible

**Código:** `DEV-PROD-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 2.
**Regresa a:** `../LEARNING-PATH.md`, paso 3.
**No continúes hasta:** asegurar tenant, permisos de costo y actualización atómica de precio.

## Contrato tenant

Todos los endpoints requieren `X-Organization-Id`. Guard valida membership activa
y crea tenant context; service filtra por ese ID desde el query. Rechaza
`organizationId` en DTO y no lo obtiene del JWT.

## Endpoints y permisos

| Endpoint                          | Permiso                  | Regla principal                                          |
| --------------------------------- | ------------------------ | -------------------------------------------------------- |
| `POST /product-categories`        | `products:create`        | Parent del tenant y sin cycle.                           |
| `GET/PATCH /product-categories`   | `products:read/update`   | Listado administrable.                                   |
| `POST /product-units`             | `products:create`        | Code estable.                                            |
| `GET/PATCH /product-units`        | `products:read/update`   | No inactivar si rompe política.                          |
| `POST /products`                  | `products:create`        | Crea precio actual en transacción.                       |
| `GET /products`                   | `products:read`          | Search, type, category, status, inventory.               |
| `GET /products/:id`               | `products:read`          | Cost oculto sin `products:read-cost`.                    |
| `PATCH /products/:id`             | `products:update`        | No cambia precio base silenciosamente.                   |
| `POST /products/:id/base-price`   | `products:manage-prices` | Cierra historial e inserta precio.                       |
| `POST /products/:id/archive`      | `products:delete`        | Archivo lógico.                                          |
| `GET /products/:id/price-history` | `products:read`          | Paginado; cost sigue protegido por `products:read-cost`. |

DTOs validan SKU, nombres, UUID, money decimal como string/transformación segura,
currency, type, status, límites y filtros. No aceptes floats como fuente de verdad.

## Reglas de negocio

- SKU se normaliza para comparar sin destruir el valor de presentación.
- Category, unit y tax rate deben pertenecer al tenant.
- `SERVICE + tracksInventory=true` se rechaza antes de llegar al check.
- Un product con movimientos/documentos no se elimina; se inactiva o archiva.
- Activar/inactivar/archivar recibe idempotencyKey, persiste fingerprint en
  product status history y devuelve el resultado previo ante retry idéntico.
- Cambiar `basePrice` requiere comando dedicado: bloquea/valida versión, cierra el
  `product_prices` vigente, inserta el nuevo y actualiza snapshot en `products`,
  todo en una transacción.
- Ese comando persiste idempotencyKey+fingerprint en el nuevo periodo; retry igual
  retorna el cambio previo y payload distinto bajo la misma key da `409`.
- Currency del precio base debe coincidir con product; una conversión monetaria
  futura no se inventa.
- Inactivar category/unit no cambia productos existentes, pero impide nuevas
  asignaciones según policy.

## Orden de implementación

1. Categories y units con validación anti-cycle.
2. DTOs/product queries y proyección sin costo.
3. Crear/editar/inactivar/archive.
4. Cambio atómico e historial de precio base.
5. Policies y control de campos sensibles.
6. Swagger, eventos y auditoría.

Audita creación, cambios de costo/precio, inventory flag, status y archivo. Emite
`product.created`, `product.updated`, `product.base_price_changed`,
`product.archived`. Inventory consumirá el flag; Quotes siempre tomará snapshots.
