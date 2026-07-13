# Plantilla: tarea de pruebas

> Reemplaza todos los valores `{{...}}`. Cada caso debe explicar qué bug o regla
> protege; no entregar el test ya implementado.

# Test task {{task_number}}: {{task_name}}

## Navegación

| Dato | Valor |
| --- | --- |
| Código | `TEST-{{MODULE}}-{{task_number}}` |
| Vienes de | `../LEARNING-PATH.md`, checkpoint {{entry_checkpoint}} |
| Regresas a | `../LEARNING-PATH.md`, checkpoint {{return_checkpoint}} |
| Rama esperada | `sdd/{{exact_branch}}` |

No continúes hasta que {{observable_test_gate}}.

## Concepto nuevo

Explica la técnica de prueba nueva y relaciónala con una regla implementada en
esta misma tarea.

## System under test

- Unidad o flujo: {{sut}}.
- Dependencias reales: {{real_collaborators}}.
- Dependencias simuladas: {{test_doubles_and_why}}.
- Lo que deliberadamente no se prueba aquí: {{out_of_scope}}.

## Ambiente y aislamiento

- Environment: `{{dev_or_test}}`.
- Database: {{none_or_exact_test_database}}.
- Migraciones requeridas: {{migration_names}}.
- Datos preparados por la suite: {{fixtures}}.
- Estrategia de cleanup: {{strategy_and_safety_guard}}.

## Matriz de casos

| ID | Tipo | Escenario | Arrange | Act | Assert | Regla protegida |
| --- | --- | --- | --- | --- | --- | --- |
| `{{MODULE}}-UT-001` | Unit | {{scenario}} | {{setup}} | {{single_action}} | {{observable_result}} | `BR-{{MODULE}}-001` |
| `{{MODULE}}-IT-001` | Integration | {{scenario}} | {{database_setup}} | {{action}} | {{constraint_or_state}} | {{rule}} |
| `{{MODULE}}-E2E-001` | E2E | {{scenario}} | {{actor_and_data}} | {{request}} | {{status_shape_side_effect}} | {{contract}} |

Incluir happy path, validation, not found, conflict, permission, tenant
isolation, transaction y side effects cuando apliquen. No duplicar el mismo
detalle en los tres niveles.

## Orden de implementación

1. Crear el archivo de la suite más pequeña.
2. Implementar un happy path con Arrange–Act–Assert visible.
3. Ejecutar solo ese archivo.
4. Agregar un error relevante a la vez.
5. Preparar PostgreSQL test antes de Integration.
6. Preparar actor y app antes de E2E.
7. Ejecutar suite pequeña y después quality gate.

Describe qué construir y qué observar; no escribas las funciones de test.

## Comandos

Incluye:

- Suite o archivo exacto.
- Modo watch cuando ayude a aprender.
- Integration o E2E del módulo.
- Quality gate final.

## Cómo leer fallos de esta tarea

Enumera los fallos probables: mock incompleto, migration pending, constraint,
wrong database, cleanup o expectativa incorrecta. Indica cómo distinguirlos.

## Preguntas de comprensión

1. ¿Por qué este caso es Unit, Integration o E2E?
2. ¿Qué bug dejaría pasar si se eliminara el Assert principal?
3. ¿La prueba puede ejecutarse sola y en otro orden?
4. ¿Cómo se garantiza que nunca limpia desarrollo?

## Definition of Done

- [ ] Los nombres describen comportamiento.
- [ ] Arrange, Act y Assert se distinguen.
- [ ] Cada suite usa el nivel adecuado.
- [ ] PostgreSQL test proviene de migraciones.
- [ ] No existe dependencia del demo seed ni del orden.
- [ ] Tenant isolation y permissions están cubiertos cuando aplican.
- [ ] Suite pequeña y quality gate pasan.
- [ ] El estudiante puede explicar qué protege cada test.

## Regreso

Vuelve al archivo `../LEARNING-PATH.md` del módulo, checkpoint
{{return_checkpoint}} para cerrar Git. No avances directamente al siguiente
módulo.
