# Test task 001: listas y precio efectivo

**Código:** `TEST-PRICE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 4.
**Regresa a:** `../LEARNING-PATH.md`, cierre.
**No continúes hasta:** pasar unit, integration y E2E sin seed global.

## Matriz

### Unit

- Precedencia assignment override → list priority → default → base.
- Tier elige mayor minimum quantity aplicable.
- Fixed, item discount y base discount calculan decimal exacto.
- Empate máximo produce conflicto; intervalos usan `[from,to)`.
- Currency incompatible y métodos múltiples se rechazan.

### Integration

- Unique list code/default/item/assignment y checks de dinero/rangos.
- FKs RESTRICT evitan borrar list/product/customer usado.
- Activar default concurrente deja exactamente una o rechaza sin estado parcial.
- Activar una nueva default desactiva la anterior atómicamente; rollback conserva
  la anterior si falla la activación.
- Cerrar item fija `valid_to`, permite nueva versión del tier y conserva la previa.
- Retry activate/close idéntico no duplica history/cierre; fingerprint distinto `409`.
- Insert directo item/assignment con organization A y parent/member B falla por FK compuesta.
- Query efectiva filtra tenant, status, vigencia, revocación y quantity.

### E2E

- CRUD list/items, activate/inactivate, assign/revoke y resolve.
- Header ausente/inactivo, body con organizationId y acceso cross-tenant.
- Product/customer/list de otro tenant: `404`.
- Usuario de ventas puede resolver pero no administrar.
- Empate, duplicate default e intervalo inválido: `409/422` consistente.
- Resolución devuelve fuente explicable, no float.
- Cambios críticos generan auditoría; lectura no genera ruido de audit.

Usa reloj controlado y factories pequeñas para products/customers. No asumas la
fecha actual ni los datos del seed de desarrollo.
