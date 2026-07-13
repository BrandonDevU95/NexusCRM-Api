# Seed task 001: definiciones y widgets

## Navegación

- Código: `SEED-RPT-001`.
- Vienes de: `../LEARNING-PATH.md`, paso 3.
- Regresas a: paso 4.

Registra `reports` después de todos los dominios consultados. Crea reference
definitions para cada reporte de la propuesta con code, query key, dimensions,
metrics, filters, ranges y permission. Upsert por organization/code; JSON se
valida contra el registry antes de DB.

Crea un dashboard organizational por widgets determinísticos y dashboards
personales para algunos memberships demo. Keys/positions son estables; la
segunda ejecución actualiza definitions administradas sin sobrescribir filtros
personales modificados por el usuario.

No persistas resultados calculados en seed. Los datos fuente provienen de los
seeders de leads, deals, orders, inventory y tickets. Ejecuta reportes de control
y compara invariantes básicas, no números hardcodeados dependientes de Faker.

## Definition of Done

- [ ] Todas las definitions tienen executor existente.
- [ ] Segunda ejecución conserva IDs y personalizaciones.
- [ ] Positions no colisionan.
- [ ] No hay SQL ni resultados precomputados en JSON.
- [ ] Cross-tenant references provocan rollback.
