# Definición de terminado

Una tarea no termina cuando el endpoint “responde”. Debe superar las cuatro
pistas y el cierre Git indicado por su orquestador.

## Database

- [ ] Entity y nombres cumplen las convenciones.
- [ ] Cada relación identifica lado uno, lado muchos y foreign key.
- [ ] Nulabilidad, `onDelete`, unique, checks e índices son deliberados.
- [ ] La migración generada fue leída; no contiene cambios ajenos.
- [ ] `up` funciona sobre el esquema anterior.
- [ ] `down` revierte razonablemente el cambio.
- [ ] Se ejecutó `run → inspect → revert → inspect → run`.
- [ ] `synchronize` sigue en `false`.

## Development

- [ ] DTOs rechazan entradas inválidas y desconocidas según la política global.
- [ ] Controller delega; service conserva la regla de negocio.
- [ ] Consulta y relaciones aplican tenant scope.
- [ ] Permiso y policy están declarados.
- [ ] Todo permission code usado por decorator/guard existe exactamente en el
  catálogo seed; el contract test del registry no reporta códigos faltantes.
- [ ] Operaciones múltiples son atómicas e idempotentes cuando corresponde.
- [ ] Errores usan status y mensajes coherentes sin filtrar secretos.
- [ ] Listados tienen búsqueda/filtros/paginación si aplica.
- [ ] Archivo lógico o historial respeta el dominio.
- [ ] Acción crítica produce audit event/log.
- [ ] Swagger refleja contrato y errores.

## Seed

- [ ] Reference data usa codes estables.
- [ ] Demo data usa Faker con random seed fijo.
- [ ] Padres se crean antes que hijos.
- [ ] La segunda ejecución no duplica datos.
- [ ] Un fallo intermedio revierte la transacción.
- [ ] El seeder puede ejecutarse individualmente y desde el maestro.
- [ ] No depende de valores hardcodeados sensibles.
- [ ] No puede ejecutarse accidentalmente en producción.

## Tests

- [ ] Happy path, validación, not found y conflicto están cubiertos.
- [ ] Falta de permiso y tenant distinto están cubiertos.
- [ ] Un insert directo cross-tenant es rechazado por FK compuesta cuando hay relación.
- [ ] Unit tests no requieren base de datos.
- [ ] Integration tests usan PostgreSQL real y migrado.
- [ ] E2E verifica el contrato HTTP cuando existe endpoint.
- [ ] Rollback, side effects y auditoría se comprueban cuando aplican.
- [ ] Los tests no dependen del seed global de desarrollo.

## Git y calidad

- [ ] No hay `.env`, secretos ni archivos ajenos staged.
- [ ] `git diff --check` no reporta problemas.
- [ ] Lint, typecheck y suites requeridas pasan.
- [ ] Los commits siguen el orden database/development/seed/tests/docs.
- [ ] El Pull Request explica migración, verificación y limitaciones.
- [ ] El `LEARNING-PATH` quedó marcado hasta el siguiente checkpoint.
