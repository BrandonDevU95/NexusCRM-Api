# Plantilla: tarea de seed

> Reemplaza todos los valores `{{...}}`. El documento final explica datos,
> dependencias, idempotencia y transacción sin entregar código literal.

# Seed task {{task_number}}: {{task_name}}

## Navegación

| Dato | Valor |
| --- | --- |
| Código | `SEED-{{MODULE}}-{{task_number}}` |
| Vienes de | `../LEARNING-PATH.md`, checkpoint {{entry_checkpoint}} |
| Regresas a | `../LEARNING-PATH.md`, checkpoint {{return_checkpoint}} |
| Rama esperada | `sdd/{{exact_branch}}` |

No continúes hasta que `migration:show` no tenga pendientes y {{endpoint_or_use_case}}
funcione con datos creados manualmente.

## Objetivo

Explica qué escenarios permitirá explorar el dataset y qué tablas no se
poblarán todavía.

## Tipo de datos

| Conjunto | Tipo | Cantidad | Identidad estable | Motivo |
| --- | --- | --- | --- | --- |
| {{dataset}} | reference/demo | {{count_or_env}} | {{code_or_synthetic_key}} | {{reason}} |

No usar Faker para reference data.

## Configuración

| Variable | Tipo Joi | Default | Mínimo/máximo | Secreto | Uso |
| --- | --- | --- | --- | --- | --- |
| `SEED_{{DOMAIN}}_COUNT` | integer | {{default}} | {{range}} | No | {{purpose}} |

Indica cambios coordinados en `.env.example`, schema Joi y loader tipado.

## Dependencias y orden

- Módulo padre: `{{parent_module}}`.
- Razón: {{foreign_key_or_business_dependency}}.
- Orden de inserción: {{parents_to_children}}.
- Orden de cleanup explícito, si aplica: {{children_to_parents}}.

Si el registry puede resolver la dependencia automáticamente, explica cómo se
verifica; no asumas que los parents existen.

## Dataset determinístico

- Domain offset: {{unique_integer}}.
- Fecha base: {{fixed_date_when_needed}}.
- Formato de seed keys: `{{domain}}-000001`.
- Campos únicos: {{fields_with_index_component}}.
- Estrategia para evitar colisiones Faker: {{index_based_rule}}.

## Relaciones

Para cada relación describe parent key, child field, mapa `seedKey -> id` y el
error esperado si la referencia no puede resolverse.

## Validación previa

Lista quantity, unique, value, state y referential checks que ocurren antes de
abrir la transacción.

## Persistencia e idempotencia

Explica:

- Clave de `upsert` o búsqueda estable.
- Campos administrados por el seed.
- Campos que el seed no sobrescribe.
- Uso del `EntityManager` compartido.
- Batch size.
- Métricas `inserted`, `updated` y `skipped`.

## Verificaciones obligatorias

1. Ejecutar el módulo una vez y registrar conteos.
2. Ejecutarlo de nuevo con la misma random seed.
3. Confirmar que no aumentan los totales lógicos.
4. Confirmar relaciones por endpoints o consultas controladas.
5. Provocar una referencia inválida en test y confirmar rollback.
6. Confirmar rechazo de demo data en `prod`.

Incluye comandos exactos.

## Errores frecuentes

- Usar nombre visible como identidad.
- Abrir una transacción dentro del seeder.
- Consultar la base desde la factory.
- Ejecutar el service público por cada registro.
- Borrar filas no identificadas como demo data.

## Definition of Done

- [ ] Registry y dependencias son correctos.
- [ ] Faker tiene offset propio.
- [ ] Dataset se valida antes de persistir.
- [ ] Relaciones usan maps de claves internas.
- [ ] Segunda ejecución no duplica.
- [ ] Falla parcial revierte toda la ejecución.
- [ ] Demo data está bloqueado en `prod`.
- [ ] Métricas coinciden con la base.

## Regreso

Vuelve al archivo `../LEARNING-PATH.md` del módulo, checkpoint
{{return_checkpoint}}. Registra el commit antes de abrir Tests.
