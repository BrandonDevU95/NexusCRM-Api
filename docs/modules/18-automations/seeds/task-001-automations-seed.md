# Seed task 001: reglas demo de Automations

## Navegación

- Código: `SEED-AUTO-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 4.
- Regresas a: paso 5.

Registra `automations` con dependencias leads, deals, tasks, notifications,
quotes, orders, inventory y tickets. Crea reglas determinísticas:

- Lead Web: asignar sales member y crear follow-up task.
- Critical ticket: solicitar IN_APP/EMAIL notification.
- Low stock: crear task y notification.
- Quote expired: crear activity y reminder.

Keys por rule/version, trigger, condition y action; upsert solo DRAFT demo. No
active rules en seed por default: `SEED_AUTOMATIONS_ACTIVATE_DEMO` validado y
bloqueado en prod habilita escenarios controlados. No procesa outbox ni envía
notifications durante seed.

Ejecutar dos veces conserva IDs/orden. Validator comprueba catálogos, references
de template/member/pipeline y cycles antes de transacción. Una action inválida
revierte el módulo.

## Definition of Done

- [ ] Rules cubren casos de la propuesta.
- [ ] IDs, positions y version son estables.
- [ ] Seed no ejecuta rules ni envía email.
- [ ] Segunda ejecución no duplica.
- [ ] Activation demo es explícita y nunca prod.
