# Plantilla: tarea de desarrollo

> Reemplaza todos los valores `{{...}}`. Describe el comportamiento con
> precisión, pero no entregues código literal de aplicación.

# Development task {{task_number}}: {{task_name}}

## Navegación

| Dato | Valor |
| --- | --- |
| Código | `DEV-{{MODULE}}-{{task_number}}` |
| Vienes de | `../LEARNING-PATH.md`, checkpoint {{entry_checkpoint}} |
| Regresas a | `../LEARNING-PATH.md`, checkpoint {{return_checkpoint}} |
| Rama esperada | `sdd/{{exact_branch}}` |

No continúes hasta que {{observable_exit_condition}}.

## Objetivo y límites

Explica la capacidad observable, quién la usa y qué queda explícitamente fuera
de esta tarea.

## Conocimientos que practicarás

- {{nestjs_concept}}.
- {{domain_concept}}.
- {{security_or_transaction_concept}}.

## Dependencias

Lista únicamente las dependencias que se usarán ahora, su propósito y el
comando exacto con la versión fijada. No instalar paquetes “por si acaso”.

## Estructura de archivos

```text
src/{{module}}/
├── dto/
├── entities/
├── {{module}}.controller.ts
├── {{module}}.service.ts
└── {{module}}.module.ts
```

Ajusta el árbol al diseño real. Después explica la responsabilidad de cada
archivo sin escribir su implementación.

## Reglas de negocio

Numerar reglas para poder relacionarlas con endpoints y tests:

- `BR-{{MODULE}}-001`: {{rule}}.
- `BR-{{MODULE}}-002`: {{rule}}.

Incluye happy path, conflictos, estados, límites y efectos secundarios.

## DTOs y validación

### `{{DtoName}}`

| Campo | Tipo | Requerido | Validación | Normalización | Motivo |
| --- | --- | --- | --- | --- | --- |
| {{field}} | {{type}} | {{yes_no}} | {{rule}} | {{normalization}} | {{reason}} |

Joi valida environment variables; `class-validator` valida DTOs. No mezclar sus
responsabilidades.

## Casos de uso del service

Para cada método describe:

1. Inputs confiables después de validación.
2. Consulta con `organization_id`.
3. Regla de negocio.
4. Operaciones dentro de transacción.
5. Resultado o error de dominio.
6. Audit event o side effect requerido.

El controller no consulta repositories directamente.

## Contrato HTTP

| Método | Path | Permission | Request | Success | Errores esperados |
| --- | --- | --- | --- | --- | --- |
| {{method}} | `{{path}}` | `{{permission_code}}` | `{{DtoName}}` | {{status_and_shape}} | {{errors}} |

Describe response fields y paginación; no entregues controller code.

## Seguridad y tenant scope

- Actor permitido: {{actor}}.
- Permission exacta: `{{permission_code}}`.
- Fuente de `organization_id`: {{authenticated_context}}.
- Comportamiento ante UUID de otra organization: {{expected_behavior}}.
- Datos que no deben aparecer en logs o responses: {{sensitive_data}}.

## Transacción e historial

Explica qué operaciones deben confirmar o revertir juntas. Si el cambio crea
snapshots, movements o audit logs, indica qué información conservan y por qué
un endpoint ordinario no debe borrarla.

## Orden de implementación

1. {{step_with_exact_file}}.
2. {{step_with_exact_file}}.
3. {{service_use_cases}}.
4. {{controller_contract}}.
5. {{authorization_and_audit}}.
6. Ejecutar typecheck y verificación manual pequeña.

## Verificación manual

Incluye requests o comandos, datos previos, resultado esperado y consulta de
side effects. No usar demo seed hasta llegar al checkpoint Seed.

## Errores frecuentes

- {{mistake_and_why}}.
- {{mistake_and_why}}.
- {{mistake_and_why}}.

## Preguntas de comprensión

1. {{question_about_layer_responsibility}}
2. {{question_about_tenant_scope}}
3. {{question_about_transaction_or_history}}

## Definition of Done

- [ ] Cada regla de negocio tiene un lugar claro.
- [ ] DTOs y responses tienen contrato explícito.
- [ ] Controllers no consultan la base.
- [ ] Todas las queries comerciales incluyen organization scope.
- [ ] Permissions y audit events aplicables están definidos.
- [ ] Errores no revelan datos de otro tenant.
- [ ] Typecheck y verificación manual pasan.

## Regreso

Vuelve al archivo `../LEARNING-PATH.md` del módulo, checkpoint
{{return_checkpoint}}. Registra el commit antes de abrir Seed.
