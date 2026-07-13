# Estrategia de pruebas

## Propósito

Las pruebas sirven para explicar y proteger decisiones de negocio. El objetivo
no es “hacer verde Jest”, sino comprobar un comportamiento observable y poder
entender por qué falla.

El currículo introduce complejidad gradualmente: primero funciones y
configuración, después PostgreSQL real, luego contratos HTTP, transacciones,
concurrencia y procesos asíncronos.

## Vocabulario básico

- **System under test:** unidad o flujo que se está comprobando.
- **Arrange:** preparar datos, collaborators y estado.
- **Act:** ejecutar una sola acción principal.
- **Assert:** verificar resultado, error y side effects importantes.
- **Test double:** sustituto controlado de una dependencia.
- **Fixture:** datos mínimos conocidos por una prueba.
- **Isolation:** una prueba no depende de otra ni deja estado que la afecte.

El nombre del test debe leer como una regla de comportamiento, por ejemplo:
“rechaza un email duplicado dentro de la misma organization”.

## Pirámide del proyecto

### Unit tests

Comprueban una función, policy o service sin red ni base real. Son rápidos y
permiten explorar ramas de lógica. Se simulan repositories, clocks, mailers o
event publishers cuando esas dependencias no son el objetivo.

No se debe simular la clase bajo prueba. Tampoco se prueba que un mock devuelva
el mismo valor que se le configuró.

### Integration tests

Comprueban que código y PostgreSQL colaboren correctamente:

- Mappings de TypeORM.
- Unique y check constraints.
- Foreign keys y reglas `onDelete`.
- Foreign keys compuestas tenant-safe mediante inserts directos cross-tenant que
  PostgreSQL debe rechazar.
- Queries, filtros y paginación.
- Transacciones y rollback.
- Locks y concurrencia cuando aplique.

Usan PostgreSQL real con la misma imagen fijada que desarrollo. SQLite no es un
reemplazo válido para UUID, `jsonb`, enums, índices, `timestamptz` o locks de
PostgreSQL.

### E2E tests

Arrancan la aplicación NestJS y ejercitan el contrato HTTP con Supertest:

- Método y path.
- Authentication y authorization.
- Pipes y validación.
- Status code y response shape.
- Persistencia y side effects críticos.

Se reservan para flujos importantes; no deben duplicar cada combinación ya
cubierta en unit o integration.

## Ambientes y seguridad

- `nexus_crm_dev` pertenece al trabajo manual y demo seed.
- `nexus_crm_test` pertenece exclusivamente a pruebas automatizadas.
- `.env.test` es local y está ignorado por Git.
- `.env.test.example` documenta claves sin secretos.
- Joi valida también el entorno `test`.
- Antes de limpiar, el helper verifica `NODE_ENV=test` y database name esperado.
- Las pruebas construyen el schema con migraciones.
- Nunca apuntan a la base de desarrollo por comodidad.

Una prueba destructiva debe fallar de forma segura si el nombre de la base no
coincide con la allowlist de test.

## Organización de archivos

```text
src/**/*.spec.ts
test/integration/<module>/*.integration-spec.ts
test/e2e/<module>/*.e2e-spec.ts
test/helpers/
test/fixtures/
```

- Unit tests viven cerca del código que explican.
- Integration y E2E quedan separados porque requieren lifecycle y base real.
- Helpers no contienen reglas de negocio.
- Fixtures son pequeñas, explícitas y reutilizables solo cuando mejoran
  claridad.

## Scripts estándar

```powershell
pnpm test
pnpm test:watch
pnpm test:cov
pnpm test:integration
pnpm test:e2e
pnpm test:migrations
pnpm test:all
```

La foundation define estos wrappers. Cada tarea indica primero el comando del
archivo o suite pequeña y al final el quality gate que corresponda.

`test:all` no sustituye investigar un fallo. Cuando falle, ejecutar la suite
más pequeña y leer primero el primer error real, no la cascada posterior.

## Estrategia de datos

### Unit

Crear objetos mínimos con valores explícitos. No usar database, SeedModule ni
Faker salvo que se esté probando la propia factory.

### Integration

Crear solo parents e hijos necesarios para el caso. Usar builders con defaults
claros y permitir overrides. Limpiar dentro del entorno test en orden de hijos
a padres o reconstruir el schema según la estrategia de la suite.

### E2E

Cada suite prepara su actor y recursos. Los valores únicos incluyen un
identificador controlado por la prueba. No confiar en que otra suite creó un
usuario o ejecutó el seed global.

### Seed

El demo seed se usa para exploración manual y pruebas específicas de seed. Las
pruebas ordinarias no dependen de miles de filas Faker.

## Aislamiento

Una prueba debe poder ejecutarse sola, después de otra o en un orden distinto.

- No compartir variables mutables entre tests.
- No depender del reloj real; inyectar o controlar el tiempo donde importe.
- No depender de `Math.random()`.
- No buscar registros por prefijos amplios para borrarlos.
- Registrar IDs creados por la propia suite.
- Respetar foreign keys al limpiar.
- No cambiar endpoints de negocio para facilitar cleanup.

En flows con transacciones internas, envolver externamente cada test en una
transacción puede producir una realidad distinta a producción. La tarea debe
elegir entre rollback, cleanup explícito o reconstrucción de schema y explicar
la decisión.

## Matriz mínima por caso de uso

| Categoría           | Pregunta                                                    |
| ------------------- | ----------------------------------------------------------- |
| Happy path          | ¿Produce el resultado válido esperado?                      |
| Validation          | ¿Rechaza entrada incompleta, inválida o fuera de rango?     |
| Not found           | ¿Distingue recurso inexistente sin filtrar información?     |
| Conflict            | ¿Protege unicidad o transición de estado?                   |
| Authentication      | ¿Rechaza requests sin identidad válida?                     |
| Authorization       | ¿Rechaza al actor sin permission?                           |
| Permission registry | ¿Todo código usado por guards/decorators existe en el seed? |
| Tenant isolation    | ¿Impide usar un UUID de otra organization?                  |
| Transaction         | ¿Revierte todo si falla un paso?                            |
| Side effects        | ¿Crea audit event, movement o notification esperada?        |
| History             | ¿Conserva snapshots y registros que no deben borrarse?      |

No todas las filas requieren los tres niveles. La tarea selecciona el nivel
que demuestra mejor la regla sin duplicación innecesaria.

## Progresión pedagógica

### Nivel 0: foundation

- Arrange–Act–Assert.
- Joi con valores válidos e inválidos.
- Smoke E2E de arranque.
- PostgreSQL test y ciclo de migración.
- Leer mensajes de Jest y aislar una suite.

### Nivel 1: organizations y security

- Services con repository doubles.
- Unique constraints y foreign keys reales.
- Password policy.
- Login, refresh token rotation y revocación.
- Permission y organization isolation E2E.

### Nivel 2: customers, contacts y leads

- CRUD completo.
- Búsqueda, filtros y paginación.
- Soft delete.
- Validación de relaciones dentro del tenant.

### Nivel 3: pipeline, opportunities, activities y calendar

- State transitions.
- Timeline e historial.
- Transacciones y rollback.
- Control del reloj.

### Nivel 4: products, price lists, quotes, orders e inventory

- Precisión monetaria.
- Snapshots.
- Invariantes multi-entidad.
- Locks y concurrencia.
- Prevención de stock negativo.

### Nivel 5: support, knowledge, automations y notifications

- Reintentos e idempotencia.
- Integraciones simuladas.
- Procesos asíncronos.
- Errores parciales y recuperación.

### Nivel 6: reports, import/export, audit y administration

- Datasets controlados de mayor volumen.
- Errores por fila.
- Contratos de archivos.
- Inmutabilidad de audit logs.
- Mediciones de desempeño acotadas y reproducibles.

## Coverage

Coverage es una señal, no una definición de calidad. En foundation se aprende a
leer el reporte sin imponer un porcentaje arbitrario. Los hitos posteriores
pueden elevar thresholds cuando exista una base estable.

Una línea cubierta puede no tener asserts útiles. Priorizar reglas de negocio,
errores, tenant isolation y transacciones sobre getters o wiring trivial.

## Cómo analizar un fallo

1. Ejecutar solo la suite que falla.
2. Leer el primer stack trace y localizar Arrange, Act o Assert.
3. Confirmar environment y database name.
4. Distinguir fallo de expectativa, configuración, conexión o cleanup.
5. Revisar si el test depende de orden o tiempo real.
6. Corregir primero la causa, no aumentar timeouts sin evidencia.
7. Ejecutar de nuevo la suite pequeña y después el quality gate.

## Definition of Done de pruebas

- [ ] Cada nombre expresa comportamiento.
- [ ] Arrange, Act y Assert se distinguen con claridad.
- [ ] Se cubren happy path y errores relevantes.
- [ ] Tenant isolation aparece en módulos comerciales.
- [ ] Integration usa PostgreSQL test migrado.
- [ ] E2E comprueba contrato, no implementación interna.
- [ ] Ninguna suite depende del demo seed o del orden.
- [ ] Cleanup no puede tocar desarrollo o producción.
- [ ] La suite pequeña y el quality gate pasan.
- [ ] El estudiante puede explicar qué bug detectaría cada test.
