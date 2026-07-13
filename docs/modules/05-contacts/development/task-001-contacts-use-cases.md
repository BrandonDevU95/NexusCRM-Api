# Development task 001: casos de uso de contactos

## Navegación

- **Código:** DEV-CONT-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, paso 3.
- **No continúes hasta:** el cambio de principal sea transaccional y tenant-safe.

## Casos de uso

- Crear, consultar, actualizar y archivar contacto dentro de customer.
- Marcar contacto principal.
- Actualizar preferencias y `do_not_contact`.
- Listar y buscar por customer, nombre, email, cargo o departamento.
- Consultar interacciones cuando Activities exista.

## Contrato tenant

Cada request usa `X-Organization-Id`. El guard valida membresía activa y el service filtra contact y customer con el mismo organization ID. El body/JWT no deciden tenant; un UUID válido de otra organización se trata como inexistente.

## Endpoints orientativos

- `POST /customers/:customerId/contacts`
- `GET /customers/:customerId/contacts`
- `GET /contacts/:id`
- `PATCH /contacts/:id`
- `DELETE /contacts/:id`
- `PUT /contacts/:id/primary`
- `GET/PATCH /contacts/:id/preferences`

## Cambio de principal

En una transacción bloquea los contactos activos del customer, desmarca el principal anterior y marca el nuevo. El índice parcial es la última defensa ante concurrencia. No aceptes customer ID de otro tenant y no marques archivados.

La regla es **cero o un principal activo**. Archivar al principal o desmarcarlo puede dejar cero; el sistema nunca elige automáticamente un reemplazo porque no conoce la preferencia comercial. Solo `PUT /contacts/:id/primary` establece uno de forma explícita.

## DTO validation

Nombres no vacíos, email, teléfonos, canal permitido, booleans reales y UUID. `organization_id`, `customer_id` interno, `is_primary` y timestamps no se actualizan por el DTO general; usa caso de uso específico para principal.

## Permisos, auditoría y eventos

Usa `contacts:create`, `contacts:read`, `contacts:update` y `contacts:delete`; hereda además policy de acceso al customer. Audita create, update, archive, primary y preferences sensibles. Emite `contact.created`, `contact.primary_changed`, `contact.preferences_changed`, `contact.archived`.

## Errores

Customer/contact ajeno o archivado: `404`; principal duplicado resuelto transaccionalmente o `409`; canal inválido: `400`; sin policy de customer: `403`.
