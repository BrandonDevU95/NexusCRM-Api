# Development task 002: conversión del lead

## Navegación

- **Código:** DEV-LEAD-002
- **Vienes de:** `../LEARNING-PATH.md`, parte B paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, parte B paso 3.
- **No continúes hasta:** probar transacción completa, rollback e idempotencia.

## Caso de uso

Convertir un lead QUALIFIED en customer obligatorio, contact opcional y deal opcional. Solo reutiliza un customer cuando el request envía `existingCustomerId` de forma explícita; si no lo envía, crea uno nuevo. Email, tax ID, nombre o similitud nunca activan una reutilización automática.

## Contrato tenant

`POST /leads/:id/convert` exige `X-Organization-Id`. La transacción recibe el tenant context validado y busca cada referencia junto con ese ID; no confía en organization del body ni en una claim tenant del JWT.

## Endpoint

`POST /leads/:id/convert`

El DTO exige exactamente una intención: `existingCustomerId` o datos para crear customer, nunca ambas. También define si crea contact y datos del deal/pipeline/stage. No acepta IDs de tenant ni campos calculados. Valida que el contacto pertenezca al customer y que stage pertenezca al pipeline. El header `Idempotency-Key` es obligatorio, no vacío y tiene máximo 100 caracteres.

## Transacción completa

1. Carga y bloquea el lead dentro del tenant.
2. Confirma QUALIFIED, no archivado y sin `lead_conversions`.
3. Si existe `existingCustomerId`, carga ese customer dentro del tenant; si no, crea uno. No ejecuta búsqueda automática de duplicados para decidir.
4. Crea contact si se solicitó.
5. Crea deal si se solicitó, con etapa inicial válida.
6. Inserta `lead_conversions`.
7. Cambia lead a CONVERTED y crea status history.
8. Registra outbox/auditoría dentro de la misma transacción.
9. Publica efectos secundarios después del commit.

## Idempotencia

Normaliza la intención completa y calcula un fingerprint SHA-256 que incluye organization ID, lead ID y payload semántico. La key y fingerprint se persisten con la conversión dentro de la misma transacción.

- Misma key + mismo fingerprint: devuelve exactamente los IDs/resultados persistidos.
- Misma key + fingerprint diferente: `409 IDEMPOTENCY_KEY_REUSED`.
- Key distinta + mismo fingerprint: devuelve el resultado ya persistido gracias al unique por tenant/fingerprint.
- Lead ya convertido con otra intención: `409 LEAD_ALREADY_CONVERTED`.

Los constraints de key, fingerprint y lead protegen los requests concurrentes; no basta revisar primero y después insertar.

## Permisos y eventos

Requiere `leads:convert` y permisos para crear customer/contact/deal según política acordada. Emite un solo evento principal `lead.converted` con IDs, no cuatro notificaciones descoordinadas.

## Errores

Lead no calificado `409`; referencias ajenas `404`; datos incompletos `400`; conflicto concurrente `409`; fallo de cualquier creación provoca rollback total.
