# Development task 001: precio efectivo

**Código:** `DEV-PRICE-001`
**Vienes de:** `../LEARNING-PATH.md`, paso 2.
**Regresa a:** `../LEARNING-PATH.md`, paso 3.
**No continúes hasta:** resolver precio de forma determinista y tenant-scoped.

## Dependencia que se instala aquí

Este es el primer módulo que calcula porcentajes y precios comerciales. Instala:

```powershell
pnpm add -E decimal.js@10.6.0
```

`decimal.js` evita operaciones monetarias con `Number`/float y conserva precisión
antes de persistir `numeric(19,4)`. El paquete incluye tipos: no instales
`@types/decimal.js`. Quotes y Orders reutilizarán esta dependencia sin repetir el
comando. Revisa la versión exacta y `pnpm-lock.yaml` antes de continuar.

## Contrato tenant

Todos los endpoints exigen `X-Organization-Id`; guard valida membership activa y
crea tenant context. Service filtra en cada query. No aceptes `organizationId` en
body ni fijes tenant en JWT.

## Endpoints y permisos

- CRUD/archive `price-lists` con `price-lists:manage`; lectura con
  `price-lists:read`.
- `POST/PATCH /price-lists/:id/items` con `price-lists:manage`; cerrar un item usa
  la acción explícita `POST /price-lists/:id/items/:itemId/close` y fija
  `valid_to`, nunca depende de un DELETE inexistente.
- `POST /customers/:customerId/price-lists` y revocación con
  `price-lists:assign`.
- `GET /customers/:customerId/price-lists` con `price-lists:read`.
- `POST /prices/resolve` con `products:read` y `price-lists:read`; recibe
  customerId, productId, quantity, currency y `effectiveAt` opcional autorizado.

DTOs validan money/cantidad decimal, currency, intervalos, prioridad, porcentaje,
status y exactamente un método de item.

## Algoritmo de resolución

1. Carga customer y product por tenant; exige product `ACTIVE`.
2. Define instante efectivo y currency solicitada.
3. Obtén assignments del customer vigentes, no revocados, cuya list esté ACTIVE,
   vigente y con currency correcta.
4. Si no hay, usa la lista default ACTIVE del tenant/currency.
5. Ordena por `priority_override` si existe, después `price_lists.priority`.
6. Si dos candidatas empatan en la prioridad efectiva máxima, devuelve conflicto
   de configuración `409`; no desempates por UUID o fecha accidentalmente.
7. Busca items vigentes del producto con `minimum_quantity <= quantity` y elige
   la mayor minimum quantity.
8. Aplica fixed price; o descuento del item sobre product base price; si no hay
   item, aplica base discount de la lista; si no hay lista, usa base price.
9. Redondea solo en el límite definido por currency/documento y devuelve decimal,
   `priceListId`, `priceListItemId`, método, base, descuento y precio final.

El resolver no modifica datos. Quotes copiará el resultado y snapshots; nunca
recalculará una cotización histórica al consultar.

## Reglas de escritura y transacciones

- Activar una nueva default bloquea la default activa de la misma currency, la
  cambia a `INACTIVE` y activa la nueva dentro de una sola transacción. Si falla
  cualquier paso, la anterior permanece activa.
- Cerrar un item fija `valid_to` y conserva su historial; no existe DELETE físico.
- Activate/inactivate y close item reciben idempotencyKey, persisten fingerprint
  en status history/campos de cierre y rechazan una misma key con payload distinto.
- Assign customer list persiste también key+fingerprint en la asignación.
- No permitas fixed price con currency distinta a la lista.
- Inactivar/revocar afecta resoluciones futuras, no quotes existentes.
- Detecta solapamiento ambiguo de la misma lista/product/tier y rechaza.
- Audita creación, activación, item, assignment, revocación y prioridad.

## Orden de implementación

1. CRUD de lists y máquina DRAFT/ACTIVE/INACTIVE.
2. Items/tier validation.
3. Customer assignments y revocación.
4. Query service puro de resolución.
5. Permisos/CASL, auditoría, Swagger y métricas de consulta.

Emite `price_list.activated`, `price_list.item_changed`,
`customer.price_list_assigned` y `customer.price_list_revoked` después de commit.
