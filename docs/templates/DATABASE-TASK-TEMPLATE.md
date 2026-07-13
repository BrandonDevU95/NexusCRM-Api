# Plantilla: tarea de base de datos

> Reemplaza todos los valores `{{...}}`. El archivo final debe ser
> autocontenido para el cambio de schema de esta tarea.

# Database task {{task_number}}: {{task_name}}

## Navegación

| Dato | Valor |
| --- | --- |
| Código | `DB-{{MODULE}}-{{task_number}}` |
| Vienes de | `../LEARNING-PATH.md`, checkpoint {{entry_checkpoint}} |
| Regresas a | `../LEARNING-PATH.md`, checkpoint {{return_checkpoint}} |
| Rama esperada | `sdd/{{exact_branch}}` |

No continúes hasta que {{observable_exit_condition}}.

## Objetivo

Explica qué regla de negocio protegerá el schema y qué concepto de PostgreSQL o
TypeORM se aprenderá.

## Estado previo esperado

- Última migración aplicada: `{{exact_migration}}`.
- Tablas que ya deben existir: {{tables}}.
- Comando para confirmarlo: {{exact_command}}.

## Modelo mental

Explica primero el problema en lenguaje de negocio. Después tradúcelo a tablas,
constraints e índices. No comenzar por decorators de TypeORM.

## Tablas afectadas

Para cada tabla incluye propósito, owner del dato y si es global o pertenece a
una organization.

### `{{table_name}}`

| Columna | Tipo PostgreSQL | Nullable | Default | Restricción | Motivo |
| --- | --- | --- | --- | --- | --- |
| `id` | `uuid` | No | generado por PostgreSQL | `PK_...` | {{reason}} |
| {{column}} | {{type}} | {{yes_no}} | {{default_or_none}} | {{constraint}} | {{reason}} |

Agrega ejemplos válidos e inválidos cuando ayuden a entender una regla.

## Relaciones

### {{relationship_name}}

- Lado uno: `{{parent_table}}`.
- Lado muchos: `{{child_table}}`.
- Foreign key: `{{child_table}}.{{parent}}_id`.
- Nulabilidad: {{required_or_optional_and_why}}.
- `onDelete`: `{{rule}}` porque {{business_reason}}.
- Índice: `{{exact_index_name}}` porque {{query_it_supports}}.
- Relación inversa en TypeORM: {{needed_or_not_and_why}}.

Para many-to-many explica por qué se usa una entity intermedia, sus dos lados
one-to-many y cualquier metadata de asignación.

## Constraints e índices

| Nombre exacto | Tipo | Columnas | Regla o consulta que protege |
| --- | --- | --- | --- |
| `{{constraint_name}}` | {{type}} | {{columns}} | {{reason}} |

No agregar índices sin una consulta concreta.

## Orden de implementación

1. {{first_entity_or_enum_change}}.
2. {{second_change}}.
3. Registrar entities sin duplicar la lista de runtime y CLI.
4. Confirmar typecheck antes de generar la migración.

Explica qué debe construir el estudiante, sin entregar el código TypeScript.

## Migración

- Tipo: `create` manual o `generate` por diff.
- Nombre exacto: `{{MigrationName}}`.
- Razón del tipo elegido: {{reason}}.

### Antes de crearla

Incluye comandos para aplicar historia anterior y confirmar que no haya
pendientes.

### Revisión de `up`

Enumera en orden qué operaciones deben aparecer. Indica columnas, constraints,
índices y riesgos; no escribas el método por el estudiante.

### Revisión de `down`

Enumera el orden inverso y explica cualquier dato que no pueda recuperarse.

### Ciclo obligatorio

Incluye comandos exactos para `show -> run -> inspect -> revert -> inspect ->
run`. Una compilación correcta no sustituye inspeccionar PostgreSQL.

## Casos límite y errores frecuentes

- {{edge_case_and_expected_database_behavior}}.
- {{common_relationship_mistake}}.
- {{migration_risk}}.

## Preguntas de comprensión

1. ¿Por qué la foreign key vive en {{child_table}}?
2. ¿Qué información se perdería con otro `onDelete`?
3. ¿Qué consulta justifica el índice?
4. ¿Qué diferencia existe entre modificar la entity y migrar la base?

## Definition of Done

- [ ] El schema coincide con el diccionario de tablas.
- [ ] Cada relación tiene lados, foreign key, nulabilidad y `onDelete`
  explicados.
- [ ] `synchronize` permanece en `false`.
- [ ] Se completó `run -> revert -> run`.
- [ ] La migración funciona desde el estado previo esperado.
- [ ] No contiene demo data ni secretos.

## Regreso

Vuelve al archivo `../LEARNING-PATH.md` del módulo, checkpoint
{{return_checkpoint}}. No abras Development antes de registrar el checkpoint y
commit indicados ahí.
