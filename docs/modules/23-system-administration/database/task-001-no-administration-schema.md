# Database task 001: demostrar que Administration no necesita schema

## Navegación

- Código: `DB-ADMIN-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 1.
- Regresas a: paso 2.
- Rama: `sdd/add-system-administration`.

## Ownership map

| Capacidad administrativa | Owner | Tablas existentes |
| --- | --- | --- |
| Users/sessions | Users/Auth | `users`, `auth_sessions`, refresh records |
| Roles/permissions | Access Control | `roles`, `permissions`, `role_permissions`, member roles |
| Organizations/members | Organizations | `organizations`, `organization_members`, settings |
| Settings/catalogs/taxes | Platform | settings, catalogs, options, tax rates |
| Pipelines/stages | Pipelines | pipeline tables |
| Price lists | Price Lists | lists, items/assignments |
| Templates | Notifications | `notification_templates` |
| Audit | Audit | `audit_logs`, `security_logs` |

Crear una tabla Administration duplicaría ownership, validación y audit. Un
dashboard administrativo se calcula; no necesita persistir otra copia del
estado.

## Relaciones

No se crea una relationship nueva. Administration recibe IDs y organization
context, llama al owner y deja que sus one-to-many/FKs/onDelete existentes
protejan invariantes. No agrega una FK genérica a “cualquier configuración”.

## Verificación de migraciones

```powershell
pnpm migration:show
git status --short
```

No generes `CreateAdministration` ni una migración vacía. Si al implementar el
orchestrator descubres que “necesitas” una tabla, identifica qué owner debería
poseer el dato y regresa a su documentación. Una necesidad de reporting no
justifica copiar datos.

## Definition of Done

- [ ] Ownership map cubre todas las funciones de la propuesta.
- [ ] No existe entity, repository o migration Administration.
- [ ] No se modifica una FK propietaria desde otro repository.
- [ ] `migration:show` conserva solo la historia real esperada.
- [ ] Puedes explicar por qué un module sin tabla sigue siendo un módulo real.
