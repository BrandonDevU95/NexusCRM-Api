# Comienza aquí: ruta maestra de NexusCRM API

Este es el único punto de entrada global. No necesitas abrir arquitectura,
modelo de datos, seeds y pruebas al mismo tiempo. Cada `LEARNING-PATH.md` te
enviará a un archivo subordinado, te dirá qué apartado completar y te pedirá
regresar al checkpoint exacto.

## Estado inicial

```text
Proyecto: NexusCRM-Api
Estado: documentación de aprendizaje preparada; aplicación sin implementar
Rama para comenzar a programar: sdd/add-api-foundation
Siguiente ruta: modules/00-foundation/LEARNING-PATH.md
Primer hito: v0.1.0
```

Cuando retomes el proyecto después de varios días:

1. Ejecuta `git status --short --branch`.
2. Abre este archivo.
3. Abre [`PROGRESS.md`](PROGRESS.md) y consulta el último checkpoint registrado.
4. Continúa solamente con el enlace indicado por ese checkpoint.

La documentación no se marca automáticamente. Actualiza `PROGRESS.md` en tu rama
al cerrar cada checkpoint; ese cambio forma parte del commit de documentación y
evita tener que recordar en cuál de varios archivos te detuviste.

## Reglas que no se negocian

1. `synchronize` permanece en `false` en desarrollo, pruebas y producción.
2. Cada cambio de esquema se versiona con una migración revisada y reversible.
3. Los seeds insertan datos; nunca crean tablas ni sustituyen migraciones.
4. `.env` contiene valores locales y no se versiona; `.env.example` documenta
   las variables sin secretos reales.
5. Docker Compose consume variables del entorno; no contiene credenciales ni
   versiones `latest` hardcodeadas.
6. Todo dato comercial pertenece a una organización.
7. Cada consulta protegida filtra por organización además del identificador.
8. Cada endpoint sensible declara permiso y política de autorización.
9. Toda acción crítica produce auditoría desde el momento en que se implementa.
10. Las cotizaciones y órdenes guardan snapshots; inventario cambia mediante
    movimientos; el historial comercial no se elimina.
11. Cada vertical slice termina con database, development, seed y tests.
12. Los tests usan una base separada construida con las mismas migraciones.

## Cómo funciona una tarea

Cada tarea sigue siempre el mismo circuito:

```text
LEARNING-PATH
  → database: entity, relación y migración
  → regresar y hacer commit del esquema
  → development: DTO, service, controller, permisos y auditoría
  → regresar y hacer commit funcional
  → seeds: reference/demo data reproducible
  → regresar y hacer commit del seed
  → tests: unit, integration y E2E que correspondan
  → regresar, ejecutar quality gate y cerrar la rama
```

Los documentos subordinados no te mandarán a otro documento lateral. Siempre
regresas al orquestador del módulo para que no pierdas el hilo.

## Orden exacto de aprendizaje

El número de carpeta conserva el número original de la propuesta. La columna
`Paso` expresa el orden técnico. Seguridad e Inventario tienen dos pasadas para
resolver sus dependencias, pero siguen siendo un solo módulo cada uno.

| Paso | Ruta                                                                             | Resultado                                                        |
| ---: | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
|    0 | [Foundation](modules/00-foundation/LEARNING-PATH.md)                             | NestJS, entorno, Docker, TypeORM, migraciones, seed y tests base |
|    1 | [Platform and configuration](modules/01-platform-configuration/LEARNING-PATH.md) | Settings, catálogos, impuestos y secuencias                      |
|    2 | [Security A](modules/02-security-access/LEARNING-PATH.md)                        | Users, credenciales, login, sesiones y tokens                    |
|    3 | [Organizations](modules/03-organizations/LEARNING-PATH.md)                       | Organizaciones, membresías y tenant context                      |
|    4 | [Security B](modules/02-security-access/LEARNING-PATH.md)                        | Roles por organización, permisos y CASL                          |
|    5 | [Audit](modules/22-audit-logs/LEARNING-PATH.md)                                  | Auditoría transversal y security logs                            |
|    6 | [Customers](modules/04-customers/LEARNING-PATH.md)                               | Cuentas, notas, tags e historial                                 |
|    7 | [Contacts](modules/05-contacts/LEARNING-PATH.md)                                 | Contactos y preferencias                                         |
|    8 | [Products](modules/11-products-services/LEARNING-PATH.md)                        | Productos, servicios, categorías y unidades                      |
|    9 | [Price lists](modules/12-price-lists/LEARNING-PATH.md)                           | Precios efectivos por cliente y vigencia                         |
|   10 | [Pipelines](modules/07-sales-pipeline/LEARNING-PATH.md)                          | Pipelines y etapas configurables                                 |
|   11 | [Leads A](modules/06-leads/LEARNING-PATH.md)                                     | Captura, asignación, scoring y calificación                      |
|   12 | [Deals](modules/08-deals/LEARNING-PATH.md)                                       | Oportunidades, productos e historial de etapa                    |
|   13 | [Leads B](modules/06-leads/LEARNING-PATH.md)                                     | Conversión atómica a customer/contact/deal                       |
|   14 | [Activities](modules/09-activities/LEARNING-PATH.md)                             | Timeline, comentarios y adjuntos                                 |
|   15 | [Calendar and tasks](modules/10-calendar-tasks/LEARNING-PATH.md)                 | Tareas, asignaciones, eventos y recordatorios                    |
|   16 | [Notifications](modules/19-notifications/LEARNING-PATH.md)                       | In-app, preferencias, plantillas y entregas                      |
|   17 | [Quotes](modules/13-quotes/LEARNING-PATH.md)                                     | Cotización, aprobación, PDF y snapshots                          |
|   18 | [Inventory A](modules/15-inventory/LEARNING-PATH.md)                             | Almacenes, ubicaciones, stock y movimientos                      |
|   19 | [Orders](modules/14-orders-sales/LEARNING-PATH.md)                               | Órdenes, surtidos y estados comerciales                          |
|   20 | [Inventory B](modules/15-inventory/LEARNING-PATH.md)                             | Reservas, liberación, consumo y devolución                       |
|   21 | [Knowledge base A](modules/17-knowledge-base/LEARNING-PATH.md)                   | Artículos, categorías, tags, publicación y búsqueda              |
|   22 | [Tickets](modules/16-support-tickets/LEARNING-PATH.md)                           | Soporte, conversaciones, adjuntos y reapertura                   |
|   23 | [Knowledge base B](modules/17-knowledge-base/LEARNING-PATH.md)                   | Asociación tenant-safe entre tickets y artículos                 |
|   24 | [Automations](modules/18-automations/LEARNING-PATH.md)                           | Triggers, condiciones, acciones y ejecuciones                    |
|   25 | [Reports](modules/20-reports-dashboards/LEARNING-PATH.md)                        | Dashboards y reportes operativos/comerciales                     |
|   26 | [Import and export](modules/21-import-export/LEARNING-PATH.md)                   | CSV, Excel, PDF, preview y jobs                                  |
|   27 | [Audit B](modules/22-audit-logs/LEARNING-PATH.md)                                | Consulta, retención, redacción y operación final de logs         |
|   28 | [Administration](modules/23-system-administration/LEARNING-PATH.md)              | Orquestación administrativa y hardening final                    |
|   29 | [v1 acceptance](release/V1-ACCEPTANCE.md)                                        | Verificación integral, tag y primer release estable              |

## Primer paso

Abre [Foundation: LEARNING-PATH](modules/00-foundation/LEARNING-PATH.md) y sigue
únicamente su checkpoint `FND-001`. No instales dependencias antes de que esa
tarea te indique las versiones y comandos exactos.

## Documentos de consulta

No son requisitos para comenzar. El orquestador enlazará el documento apropiado
cuando sea necesario:

- [Alcance completo](project/PROJECT-SCOPE.md)
- [Arquitectura](project/ARCHITECTURE.md)
- [Roadmap e hitos](project/ROADMAP.md)
- [Stack y versiones](project/STACK-AND-VERSIONS.md)
- [Convenciones HTTP y contrato de API](project/API-CONVENTIONS.md)
- [Flujo Git](project/GIT-WORKFLOW.md)
- [Convenciones de base de datos](project/DATABASE-CONVENTIONS.md)
- [Estrategia de seeds](project/SEED-STRATEGY.md)
- [Estrategia de pruebas](project/TESTING-STRATEGY.md)
- [Trazabilidad del alcance](project/SCOPE-TRACEABILITY.md)
