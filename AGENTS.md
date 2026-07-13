# Instrucciones para agentes de NexusCRM API

## Propósito

NexusCRM API es un backend empresarial con enfoque de aprendizaje. El usuario
implementa personalmente el código para aprender NestJS, TypeORM, PostgreSQL,
migraciones, seeds y pruebas. Los agentes deben explicar, orientar, revisar y
diagnosticar; no deben implementar módulos completos salvo petición explícita.

## Idioma y nombres

- Escribir explicaciones en español latinoamericano de México.
- Usar inglés para código, tablas, columnas, variables, archivos, ramas y commits.
- Usar `snake_case` en PostgreSQL y `camelCase` en TypeScript.

## Reglas técnicas

- Mantener el backend como monolito modular NestJS independiente.
- No introducir Next.js, monorepo ni paquetes compartidos en este repositorio.
- Usar versiones exactas; no usar rangos ni etiquetas `latest`.
- No hardcodear configuración operativa o secretos; usar variables de entorno.
- Validar variables de entorno con Joi al arrancar la aplicación.
- Mantener `synchronize: false`; todo cambio de esquema usa una migración.
- Los seeds son manuales, modulares, idempotentes y seguros por entorno.
- Los datos comerciales deben quedar delimitados por `organization_id`.
- Los módulos sensibles deben tener permisos explícitos.
- Las acciones críticas deben producir auditoría.
- El inventario cambia mediante movimientos; nunca con ajustes directos sin historial.
- Cotizaciones y órdenes conservan snapshots históricos.
- No borrar historial comercial mediante endpoints normales.

## Flujo de trabajo

- No implementar cambios grandes directamente en `main`.
- Usar ramas `feature/<description>`, `fix/<description>` o `docs/<description>`.
- Usar Conventional Commits sin atribución de IA.
- No ejecutar `build` salvo que el usuario lo solicite o se cierre un hito.
- Antes de cerrar una tarea, ejecutar las verificaciones indicadas por su guía.

## Documentación pedagógica

- `docs/START-HERE.md` es el único punto de entrada global.
- Cada módulo tiene un `LEARNING-PATH.md` que coordina los archivos de
  `database`, `development`, `seeds` y `tests`.
- No obligar al usuario a reconstruir una tarea leyendo documentos inconexos.
- Explicar cada relación indicando el lado uno, el lado muchos, la llave foránea,
  su nulabilidad y la regla de eliminación.
