# Development task 001: procesamiento de files y jobs

## Navegación

- Código: `DEV-IO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 2.
- Regresas a: paso 3.

## Dependencias exactas

```powershell
pnpm add -E exceljs@4.4.0 csv-parse@7.0.1 csv-stringify@6.8.1
```

Reutiliza `multer@2.2.0` y `@types/multer@2.2.0`, instalados desde el primer
adjunto real; confirma sus versiones, no los reinstales ni agregues otro upload
stack. No agregues otro parser CSV/XLSX. PDF se delega a los generators de
Quotes/Orders; si no existen, detén esa variante y complétala en su owner, no en
un repository genérico.

Joi valida `FILE_STORAGE_DRIVER`, `FILE_STORAGE_LOCAL_ROOT` solo en dev/test,
`IMPORT_MAX_FILE_BYTES`, `IMPORT_MAX_ROWS`, `IMPORT_BATCH_SIZE`,
`EXPORT_MAX_SYNC_ROWS`, `JOB_FILE_RETENTION_HOURS` y worker batch/retry.

## Upload y preview

1. Autenticar, membership, `X-Organization-Id` y permission por resource.
2. Limitar bytes antes de mantener el file completo en memoria.
3. Validar nombre, extensión, MIME y firma/formato real.
4. Calcular SHA-256 y storage key server-side.
5. Guardar `import_job` UPLOADED.
6. Parsear por streaming, normalizar headers y rechazar duplicados.
7. Aplicar mapping allowlisted y validators de DTO/domain owner.
8. Crear rows VALID/INVALID en batches.
9. Actualizar conteos y PREVIEWED.

Preview nunca crea customer/contact/lead/product. XLSX solo procesa worksheets
permitidas, límites de filas/celdas y no evalúa fórmulas/macros.

## Confirm y procesamiento

`ConfirmImportDto` selecciona política de duplicado `REJECT`, `SKIP` o `UPDATE`
solo cuando el owner define identidad estable. Confirm usa idempotency y cambio
de estado atómico; dos requests no arrancan dos workers.

El worker reclama jobs con lock. Procesa batches pequeños en transacciones:

- Llama batch port del owner que reutiliza validación y tenant rules.
- Registra target ID o error por row.
- Un batch fallido revierte sus entities y rows; otros batches confirmados
  permanecen, dando status PARTIAL.
- No mantiene una transacción sobre todo un file grande.
- Retry retoma rows no terminales sin duplicar targets.

Contact requiere customer resoluble del mismo tenant; Product conserva reglas
de SKU; Lead valida pipeline/source; Customer valida identidad/duplicates.

## Export

El job guarda filters/columns/sort ya validados. El worker vuelve a verificar
organization y que el requester siga autorizado antes de leer. Usa owner read
ports o Reporting executors; no acepta table name.

CSV/XLSX neutraliza valores que inician con `=`, `+`, `-` o `@` para evitar
formula injection. Fechas, timezone, currency y decimal tienen formato
documentado. Files grandes usan streaming.

PDF quote/order solicita el snapshot por ID al owner y requiere permission del
documento. Report PDF/Excel usa Reporting; el job nunca recalcula reglas
financieras.

Download usa autorización actual, URL/stream temporal y audit. Expiry devuelve
410/estado expirado sin revelar storage path.

## Endpoints y permisos

Todos requieren header. Import usa `imports:create` para crear/confirmar y
`imports:read` para consultar. Export usa `exports:create` y `exports:read`;
además se aplica la policy de filas/campos del resource propietario.

| Método/path | Permission | Uso |
| --- | --- | --- |
| `POST /api/v1/import-jobs` | `imports:create` | Multipart y resource type |
| `PUT /api/v1/import-jobs/:id/mapping` | `imports:create` | Mapping antes de preview |
| `POST /api/v1/import-jobs/:id/preview` | `imports:create` | Parsear/validar |
| `POST /api/v1/import-jobs/:id/confirm` | `imports:create` | Confirmar una vez |
| `GET /api/v1/import-jobs/:id` | `imports:read` | Estado/conteos |
| `GET /api/v1/import-jobs/:id/rows` | `imports:read` | Filtros/paginación de errors |
| `POST /api/v1/import-jobs/:id/cancel` | `imports:create` | Solo estado permitido |
| `POST /api/v1/export-jobs` | `exports:create` | Crear export validado |
| `GET /api/v1/export-jobs/:id` | `exports:read` | Estado |
| `GET /api/v1/export-jobs/:id/download` | `exports:read` | Descargar con reautorización |

## Audit y transacciones

Audit: upload, preview, confirm, cancel, complete summary, export request y
download. No guarda raw rows/files. Job transitions y audit crítico comparten
transacción. Storage es externo a DB: si write file falla, no marques completed;
si DB falla después, elimina/expira el orphan mediante compensación.

## Definition of Done

- [ ] Parser y upload tienen límites y no confían en nombre/MIME.
- [ ] Preview y confirm están separados.
- [ ] Owner ports protegen business/tenant rules.
- [ ] Batches/retries son idempotentes.
- [ ] Export neutraliza formula injection.
- [ ] Download revalida permission y no expone path.
- [ ] Audit y compensación de storage están definidos.
