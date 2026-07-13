# Test task 002: conversión de leads

## Navegación

- **Código:** TEST-LEAD-002
- **Vienes de:** `../LEARNING-PATH.md`, parte B paso 4.
- **Regresa a:** `../LEARNING-PATH.md`, cierre de parte B.
- **No continúes hasta:** pasar rollback, concurrencia, idempotencia y regresiones.

## Unitarias

- Plan de conversión exige customer y valida combinaciones opcionales.
- Reutilizar customer exige `existingCustomerId`; coincidencias de email, tax ID o nombre nunca lo seleccionan automáticamente.
- Stage pertenece al pipeline.
- Mapeo lead→customer/contact conserva campos acordados, no todos ciegamente.

## Rollback e idempotencia

### Integración

- Conversión completa crea cinco efectos coherentes: customer, contact opcional, deal opcional, conversion y history.
- Error al crear contact/deal revierte customer y status.
- Unique `lead_id` impide doble conversión concurrente.
- Misma key/fingerprint devuelve mismos IDs; misma key con fingerprint distinto falla; key distinta con fingerprint ya procesado devuelve el resultado previo.
- Todas las entidades comparten organization.
- Inserts directos que mezclan lead/customer/contact/deal de tenants distintos fallan por sus FKs compuestas.
- Un customer puede aparecer en varias conversiones de leads diferentes; un lead solo puede tener una.

### E2E

- QUALIFIED con permiso se convierte.
- NEW, LOST o ya convertido obtiene conflicto.
- Customer existente de otro tenant responde `404`.
- Sin permiso `leads:convert` obtiene `403`.
- Conversión produce auditoría/evento una sola vez.
- El resultado aparece en Customers, Contacts y Deals.

## Regresión

Ejecuta suites completas de los cuatro módulos tocados; la conversión es una integración, no una prueba aislada.
