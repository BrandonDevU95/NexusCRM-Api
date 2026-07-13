# NexusCRM API

Backend modular de NexusCRM construido con NestJS, TypeORM y PostgreSQL.

Este repositorio tiene un propósito de aprendizaje: la documentación guiará la
implementación paso a paso, pero el código de negocio será desarrollado por el
propietario del proyecto.

## Comenzar

No recorras las carpetas tratando de decidir qué documento leer. El único punto
de entrada es [docs/START-HERE.md](docs/START-HERE.md). Esa ruta indica la tarea,
el archivo, la sección, la rama y el checkpoint exactos que siguen.

El repositorio comienza deliberadamente con documentación y sin código de
aplicación: el propietario desarrollará cada tarea para aprender el proyecto a
fondo.

## Repositorios relacionados

- Proyecto anterior: [BrandonDevU95/NexusCRM-Legacy-Monorepo](https://github.com/BrandonDevU95/NexusCRM-Legacy-Monorepo).
- Frontend futuro: `NexusCRM-Web`.

## Decisiones principales

- Backend NestJS independiente; no es monorepo.
- Monolito modular organizado por dominio, similar a POS-Manager.
- TypeORM con migraciones obligatorias y `synchronize: false`.
- PostgreSQL ejecutado con Docker Compose y configuración desde `.env`.
- Joi para validar el entorno y `class-validator` para DTOs.
- Seeds modulares y determinísticos con Faker, ejecutados mediante CLI.
- Pruebas unitarias, de integración y E2E introducidas gradualmente.
- Los 23 módulos de la propuesta forman parte del alcance de `v1.0.0`.
