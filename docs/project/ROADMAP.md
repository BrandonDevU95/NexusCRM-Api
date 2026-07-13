# Roadmap e hitos

Este roadmap no es un MVP reducido. Los hitos son puntos de aprendizaje y
releases intermedios; `v1.0.0` exige los 23 módulos y los flujos end-to-end.

| Hito     | Resultado                           | Módulos principales                                                                              |
| -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| `v0.1.0` | Foundation ejecutable               | Scaffold, config Joi, Compose, PostgreSQL, TypeORM, migraciones, Swagger, health, seed/test base |
| `v0.2.0` | Identidad y aislamiento             | Platform, Security A/B, Organizations, Audit inicial y outbox publisher                          |
| `v0.3.0` | CRM core y sus catálogos requeridos | Customers, Contacts, Products, Price Lists, Pipelines y Leads A                                  |
| `v0.4.0` | Pipeline y oportunidades            | Deals, Leads B, Activities, Calendar/Tasks y Notifications                                       |
| `v0.5.0` | Ventas base                         | Quotes, Inventory A y Orders; la integración de reserva se completa en el siguiente hito         |
| `v0.6.0` | Inventario funcional                | Inventory B, reservas, surtidos, devoluciones y alertas                                          |
| `v0.7.0` | Postventa                           | Knowledge Base y Support Tickets                                                                 |
| `v0.8.0` | Orquestación                        | Automations y dispatcher/reintentos del outbox existente                                         |
| `v0.9.0` | Visibilidad y operación completa    | Reports, Import/Export, Audit final y System Administration                                      |
| `v1.0.0` | CRM estable end-to-end              | Hardening, seguridad, rendimiento y aceptación integral                                          |

## Criterios de release

Un tag no se crea por calendario ni porque “ya hay muchos cambios”. El hito debe:

1. Cumplir la definición de terminado de todas sus tareas.
2. Aplicar todas las migraciones sobre una base vacía.
3. Demostrar que la última migración puede revertirse y aplicarse otra vez.
4. Ejecutar el seed del hito dos veces sin duplicar datos.
5. Pasar lint, typecheck, unit, integration y E2E correspondientes.
6. Tener Swagger y documentación manual actualizados.
7. Confirmar aislamiento por organización, permisos y auditoría.
8. Registrar limitaciones conocidas y pasos de prueba en el release.

## Definition of `v1.0.0`

Además de los quality gates, deben demostrarse con datos controlados:

- Lead convertido una sola vez a customer/contact/deal.
- Deal recorrido por pipeline con historial.
- Quote con snapshot, aprobación, aceptación y PDF.
- Quote convertido una sola vez a order.
- Order reservada y surtida sin stock negativo.
- Cancelación/devolución con movimientos compensatorios.
- Ticket postventa asociado al customer y consultable en su timeline.
- Automatización idempotente y notificación trazable.
- Dashboard consistente con los movimientos anteriores.
- Exportación segura y audit log sin secretos.
