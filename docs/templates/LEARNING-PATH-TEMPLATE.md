# Plantilla: ruta de aprendizaje de un módulo

> Esta plantilla es para quienes mantienen la documentación. Antes de publicar
> una ruta, reemplaza todos los valores `{{...}}`; una tarea real nunca deja al
> estudiante inventar nombres, ramas, rutas o comandos.

# Ruta de aprendizaje: {{module_display_name}}

## Identidad

| Dato                        | Valor                        |
| --------------------------- | ---------------------------- |
| Orden de implementación     | {{implementation_order}}     |
| Módulo del alcance original | {{scope_module_id_and_name}} |
| Código documental           | {{module_code}}              |
| Hito                        | {{milestone}}                |
| Rama                        | `sdd/{{exact_branch_name}}`  |

## Resultado esperado

Explica en un párrafo qué capacidad completa tendrá el sistema al cerrar la
ruta y qué podrá demostrar el estudiante.

## Por qué se implementa en este momento

Explica las dependencias técnicas y de negocio. Si el orden difiere del listado
original de alcance, aclara que cambia el orden, no el alcance.

## Prerrequisitos observables

- [ ] {{prerequisite_with_command_or_database_state}}
- [ ] {{prerequisite_with_previous_module}}
- [ ] La rama `main` está limpia y actualizada.

No escribir “tener listo lo anterior” sin indicar cómo comprobarlo.

## Git: inicio

Incluye comandos exactos y la explicación breve de cada uno:

```powershell
git switch main
git pull --ff-only origin main
git status
git switch -c sdd/{{exact_branch_name}}
```

Indica qué salida o estado confirma que se puede continuar.

## Mapa de tareas

| Orden | Código           | Capacidad          | Database                        | Development                        | Seed                         | Tests                        |
| ----- | ---------------- | ------------------ | ------------------------------- | ---------------------------------- | ---------------------------- | ---------------------------- |
| 1     | `{{MODULE}}-001` | {{vertical_slice}} | `database/task-001-{{slug}}.md` | `development/task-001-{{slug}}.md` | `seeds/task-001-{{slug}}.md` | `tests/task-001-{{slug}}.md` |

Una fila representa una vertical slice terminable. No usar una sola fila para
un módulo que necesita varias ramas o varios flujos independientes.

## Recorrido obligatorio

### {{MODULE}}-001: {{task_name}}

#### Checkpoint {{MODULE}}-001.1 — preparar rama

Indica comprobación y estado esperado.

#### Checkpoint {{MODULE}}-001.2 — database

1. Abre el archivo `database/task-001-{{slug}}.md` que crearás al reemplazar
   los placeholders de esta plantilla.
2. Comienza en **{{exact_heading}}**.
3. Completa hasta **Definition of Done**.
4. Regresa a este checkpoint; no abras todavía Development.

Incluye `git add` con archivos concretos, verificaciones y commit exacto:

```powershell
git add {{exact_database_paths}}
git commit -m "feat(database): {{exact_commit_subject}}"
```

#### Checkpoint {{MODULE}}-001.3 — development

Repite el patrón con un solo enlace, sección inicial, criterio de regreso,
staging específico y commit.

#### Checkpoint {{MODULE}}-001.4 — seed

Repite el patrón. Exige `migration:show` sin pendientes y segunda ejecución
idempotente antes del commit.

#### Checkpoint {{MODULE}}-001.5 — tests

Repite el patrón. Indica primero la suite pequeña y después el quality gate.

#### Checkpoint {{MODULE}}-001.6 — cierre

Incluye revisión del diff, comandos completos y criterios observables.

## Quality gate

Usa solamente scripts que ya existan en el proyecto:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm test:e2e
git status
git diff --check
```

Documenta excepciones. No ocultar un fallo diciendo que “no pertenece a la
tarea” sin investigarlo.

## Git: publicación y merge

```powershell
git push -u origin sdd/{{exact_branch_name}}
git switch main
git pull --ff-only origin main
git merge --no-ff sdd/{{exact_branch_name}}
git push origin main
git branch -d sdd/{{exact_branch_name}}
git push origin --delete sdd/{{exact_branch_name}}
```

Si el flujo usa pull request, indica en qué punto abrirlo y que el merge ocurre
solo después de revisar checks y diff.

## Tag o release

Indica una de dos respuestas explícitas:

- “No crear tag; este cambio no cierra un hito”.
- Comandos exactos del tag y contenido requerido para el release.

## Definition of Done del módulo

- [ ] {{business_capability_is_observable}}
- [ ] Todas las migraciones aplican desde una base vacía.
- [ ] Los seeds son idempotentes y seguros por entorno.
- [ ] Las suites indicadas pasan.
- [ ] No hay secretos, `latest`, rangos de versiones ni configuración operativa
      hardcodeada.
- [ ] La rama se integró y `main` quedó limpia.

## Siguiente paso único

Enlaza solamente a la ruta que sigue según `START-HERE.md`.
