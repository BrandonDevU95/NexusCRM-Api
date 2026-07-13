# Alcance de producto de NexusCRM API

## Visión

NexusCRM es un CRM operativo modular, multiusuario y multi-organización que
cubre el ciclo comercial completo: captación, seguimiento, venta, inventario
básico, soporte, automatización, medición y administración. No es un CRUD de
clientes ni un ejercicio recortado; los 23 módulos descritos aquí forman el
alcance comprometido para `v1.0.0`.

El proyecto es educativo y production-minded: cada decisión debe poder
explicarse, probarse y evolucionar sin introducir patrones decorativos que el
propietario todavía no domina.

## Módulos comprometidos

1. **Platform and configuration:** configuración global y organizacional,
   moneda, zona horaria, idioma, formato, catálogos, impuestos y numeración.
2. **Security, users and permissions:** usuarios, login/logout, Argon2id,
   sesiones, refresh rotation, revocación, recuperación, verificación, bloqueo,
   RBAC, permisos granulares y CASL.
3. **Organizations:** multi-organización, membresías, roles por organización,
   configuración y aislamiento de datos.
4. **Customers:** cuentas, responsables, clasificación, estados, búsqueda,
   notas, tags, archivo e historial consolidado.
5. **Contacts:** múltiples contactos por cliente, contacto principal,
   preferencias e interacciones.
6. **Leads:** captura, importación, fuente, asignación, scoring, seguimiento,
   pérdida y conversión a customer/contact/deal.
7. **Sales pipeline:** pipelines configurables, etapas ordenadas, probabilidad,
   reglas de cierre y métricas por etapa.
8. **Deals:** oportunidades, owner, valor, productos, cierre esperado, etapa,
   ganada/perdida/pausa y razón de pérdida.
9. **Activities:** llamadas, email, reuniones, WhatsApp, visitas, notas,
   comentarios, adjuntos y timeline.
10. **Calendar and tasks:** tareas, múltiples asignados, prioridades, estados,
    vencimientos, recordatorios y eventos de calendario.
11. **Products and services:** productos, servicios, SKU, categorías, unidades,
    costo, precio, estado y bandera de inventario.
12. **Price lists:** listas públicas, distribuidor, mayorista y especiales;
    vigencias, prioridades y precio efectivo por cliente.
13. **Quotes:** folios, items, descuentos, impuestos, totales, aprobación,
    envío, aceptación, expiración, PDF y conversión.
14. **Orders and sales:** órdenes manuales o desde quote, items, validación,
    reserva, surtido parcial, confirmación, cancelación, devolución e historial.
15. **Inventory:** varios almacenes y ubicaciones, stock total/reservado/disponible,
    movimientos, ajustes, reservas, devoluciones, mínimos y alertas.
16. **Support tickets:** customer/contact, agente, prioridad, categoría, estados,
    comentarios internos/públicos, adjuntos, cierre y reapertura.
17. **Knowledge base:** artículos, categorías, tags, búsqueda, visibilidad y
    asociación con tickets.
18. **Automations:** reglas, triggers, condiciones, acciones, activación,
    idempotencia, reintentos e historial de ejecución.
19. **Notifications:** in-app, email, preferencias, plantillas, asignaciones,
    recordatorios y alertas.
20. **Reports and dashboards:** indicadores comerciales y operativos, forecast,
    conversiones, ventas, inventario, soporte y dashboards por rol.
21. **Import and export:** customer/contact/lead/product por CSV y Excel;
    preview, validación por fila, duplicados, jobs y exportación CSV/Excel/PDF.
22. **Audit and logs:** login, seguridad, cambios críticos, actor, tenant,
    valores redactados, correlación e historial append-only.
23. **System administration:** operación protegida de usuarios, roles, permisos,
    catálogos, pipelines, impuestos, precios, plantillas, configuración y logs.

## Flujos de aceptación de `v1.0.0`

### Flujo comercial

```text
Lead → asignación → actividades → calificación
     → Customer + Contact + Deal
     → Pipeline → Quote → aprobación/aceptación
     → Order → reserva/surtido → movimientos de inventario
     → Reports + Audit
```

### Flujo postventa

```text
Customer/Contact → Ticket → asignación/prioridad
                 → conversación + Knowledge Article
                 → resolución/cierre/reapertura
                 → Notification + Reports + Audit
```

### Flujo de inventario

```text
Product con tracks_inventory
  → recepción/ajuste mediante Inventory Movement
  → Order Reservation
  → Fulfillment y salida
  → devolución o liberación
  → alerta de stock mínimo
```

## Capacidades previstas después de `v1.0.0`

La arquitectura debe permitir agregarlas sin implementarlas todavía: integración
real con correo, Google Calendar, webhooks, API pública, custom fields,
formularios públicos, secuencias de seguimiento, deduplicación inteligente,
forecast avanzado, búsqueda global, menciones, más adjuntos y asistente de IA.

“Previsto” significa conservar límites y puntos de extensión; no significa crear
tablas vacías ni abstracciones sin un caso de uso actual.

## Fuera del alcance inicial

No se implementan contabilidad general, nómina, CFDI/SAT, conciliación bancaria,
POS completo, e-commerce, WMS avanzado, manufactura, compras avanzadas ni HR.
Tampoco se implementa el frontend en este repositorio; vivirá en
`NexusCRM-Web`.
