# Estrategia de seeds

## Propósito

El seed permite probar cada módulo terminado con información realista sin
convertirse en una forma alternativa de diseñar el esquema. La secuencia
siempre es:

```text
migration:run -> endpoints estables -> seed del módulo -> pruebas y exploración
```

Se conserva la idea modular del POS-Manager, pero se mejora la seguridad: el
seed se ejecuta mediante CLI y Nest application context, no desde un endpoint
HTTP destructivo.

## Tres tipos de datos

### Reference data

Datos estables que el sistema necesita para operar, por ejemplo permission
codes, roles base o catálogos técnicos. Usan claves de negocio estables y
`upsert`. Una ejecución posterior puede actualizar su descripción sin
duplicarlos.

### Demo data

Datos Faker para desarrollo y demostración. Solo se permiten en `dev` y `test`.
Sus identificadores visibles y relaciones son determinísticos para que una
segunda ejecución encuentre los mismos registros.

### Test fixtures

Datos mínimos que prepara una prueba. No dependen del seed global y no deben
compartir estado entre suites. Un unit test nunca necesita el SeedModule.

Mezclar estas categorías produce pruebas frágiles y puede llevar datos de
demostración a producción.

## Forma de ejecución

Scripts previstos:

```powershell
pnpm seed:list
pnpm seed:run -- --env-file .env --module platform
pnpm seed:run -- --env-file .env --module security
pnpm seed:run -- --env-file .env.test --module all
```

`seed:list` muestra módulos registrados y dependencias sin modificar la base.
`seed:run` verifica entorno, migraciones y configuración antes de abrir la
transacción.

No existe ejecución automática al arrancar la API. En `prod`, demo data debe
rechazarse aunque alguien conozca el comando. Si reference data llega a
producción, se ejecuta como una acción explícita de despliegue con su propio
modo y revisión.

## Estructura recomendada

```text
src/seed/
├── factories/
├── seeders/
├── validators/
├── services/
├── seed.module.ts
├── seed.registry.ts
├── seed.types.ts
├── seed.runner.ts
└── main.seed.ts
```

- `factories`: construyen datasets en memoria; no consultan PostgreSQL.
- `validators`: comprueban cantidad, unicidad y referencias antes de insertar.
- `seeders`: persisten un dominio con el `EntityManager` recibido.
- `seed.registry`: declara nombre, dependencias y executor de cada módulo.
- `seed.runner`: interpreta argumentos y abre el application context.
- `services`: coordinan validación, lock, transacción, métricas y errores.

Cada módulo agrega su seeder y documentación; no crea un segundo SeedModule.

## Contrato de un módulo de seed

Cada registro del registry debe declarar:

- Nombre técnico estable, por ejemplo `organizations`.
- Tipo de datos que produce: reference, demo o ambos.
- Dependencias, por ejemplo `customers` depende de `organizations` y `users`.
- Variables de volumen que consume.
- Factory y validator correspondientes.
- Seeder que recibe un `EntityManager`.
- Conteos que reporta.

Cuando se solicita un módulo, el runner resuelve sus dependencias y las ejecuta
primero. Si se detecta un ciclo, la ejecución falla antes de tocar la base.

## Configuración mediante environment variables

La foundation define y valida con Joi:

- `SEED_RANDOM_SEED`: entero reproducible.
- `SEED_BATCH_SIZE`: tamaño máximo de persistencia por lote.
- `SEED_ALLOW_DEMO_DATA`: autorización explícita en `dev/test`.
- Contraseñas exclusivas para cuentas demo cuando sean necesarias.
- Un `SEED_<DOMAIN>_COUNT` por dominio con volumen configurable.

Cada cantidad tiene mínimo, máximo y default documentados. Los defaults son
operativos, no secretos. Las contraseñas no tienen default inseguro y nunca se
imprimen en logs.

`.env.example` explica todas las variables sin incluir credenciales reales. Un
cambio de environment variables siempre actualiza Joi, el loader tipado y la
documentación en la misma tarea.

## Faker determinístico

La reproducibilidad se controla por dominio:

```text
domain random seed = SEED_RANDOM_SEED + domain offset
```

Reglas:

- Cada dominio tiene un offset único y estable.
- No compartir una instancia Faker entre dominios.
- No usar `Math.random()`, `Date.now()` ni la fecha actual.
- Usar una fecha base fija para historiales demo.
- Faker no garantiza unicidad; combinar datos con un índice determinístico.
- No generar UUID de entities que PostgreSQL debe crear.

Agregar un campo a customers no debe cambiar los datos generados para products.
Esa independencia es la razón de usar un random seed distinto por dominio.

## Claves internas y relaciones

Las factories relacionan datos mediante claves internas, por ejemplo
`organization-000001` o `user-000015`. No usan nombres visibles ni UUID todavía
inexistentes.

Flujo:

1. La factory crea padres e hijos con `seedKey` y `<parent>SeedKey`.
2. El validator confirma que cada parent key exista.
3. El seeder persiste padres.
4. Construye un mapa `seedKey -> persistedId`.
5. El seeder hijo resuelve la foreign key mediante ese mapa.
6. Una referencia no resuelta aborta toda la transacción.

Los tipos internos del seed son independientes de las entities. Esto evita
mezclar UUID persistidos con datos que todavía están en memoria.

## Idempotencia

Idempotente significa que repetir el mismo seed produce el mismo estado lógico,
no que se ignoren todos los errores.

### Reference data

- `upsert` por un `code` único y estable.
- Actualiza textos o flags administrados por el seed.
- No cambia información que pertenezca al usuario sin una decisión explícita.

### Demo data

- Usa correos, codes o claves sintéticas estables con unique constraints.
- Busca o hace `upsert` por esa identidad estable.
- Reporta por separado `inserted`, `updated` y `skipped`.
- No identifica registros por nombre Faker.
- No borra registros reales por prefijo, fecha o coincidencia parcial.

Verificación obligatoria: ejecutar dos veces con la misma configuración; la
segunda ejecución no incrementa el total esperado ni rompe relaciones.

## Transacción y concurrencia

El executor sigue este orden:

1. Carga configuración validada.
2. Verifica que el entorno permita el modo solicitado.
3. Confirma que no haya migraciones pendientes.
4. Genera y valida todo el dataset posible antes de borrar o insertar.
5. Abre una transacción.
6. Obtiene un PostgreSQL advisory lock exclusivo para seeds.
7. Ejecuta módulos padre y después dependientes.
8. Confirma la transacción.
9. Devuelve métricas y duración.

Todos los seeders reciben el mismo `EntityManager`. Ninguno abre otra
transacción ni usa repositories inyectados fuera del manager. Una falla en un
módulo dependiente debe revertir también lo insertado por sus padres durante
esa ejecución.

La unidad transaccional es una invocación de `seed:run` con su grafo resuelto.
Frases como “transacción por customer”, “por tenant” o “cada conversión abre su
transacción” son incorrectas dentro de un seeder. Si un caso de uso de dominio se
reutiliza, debe aceptar el `EntityManager` existente y evitar abrir otra
transacción. Si un volumen futuro obliga a batches con commits parciales, será
otro modo explícito, con checkpoint/reanudación y una semántica de rollback
documentada; el modo normal no cambia silenciosamente.

El advisory lock evita que dos terminales intenten poblar el mismo entorno al
mismo tiempo.

## Seeds y migraciones

Antes de ejecutar un seed:

- La conexión debe apuntar a la base esperada.
- `migration:show` no debe reportar pendientes.
- El schema debe provenir de `migration:run`, no de `synchronize`.

Si el seeder espera una columna que la base no tiene, el mensaje debe indicar
que se revisen las migraciones. El seed no intenta “arreglar” el schema.

## Reset explícito

El seed normal nunca trunca toda la base. Si el proyecto incorpora un reset
completo para desarrollo:

- Debe ser otro comando con nombre destructivo evidente.
- Solo funciona en `dev` y `test`.
- Muestra database host y name antes de confirmar.
- Reconstruye mediante migraciones y después ejecuta el seed.
- Nunca está expuesto por HTTP.
- Nunca se usa como cleanup ordinario de pruebas.

## Métricas de salida

La ejecución debe informar sin revelar secretos:

- Entorno y database name confirmados.
- Random seed utilizado.
- Módulos ejecutados y orden.
- Conteos `inserted`, `updated` y `skipped` por tabla.
- Total persistido.
- Duración.
- Estado de commit o rollback.

## Verificación por módulo

Cada tarea de seed debe comprobar:

- [ ] El módulo está registrado una sola vez.
- [ ] Las dependencias son correctas y no cíclicas.
- [ ] Las quantities están validadas con Joi.
- [ ] Faker usa un offset propio.
- [ ] Las claves internas son únicas.
- [ ] Toda referencia apunta a un parent key existente.
- [ ] El seeder usa el `EntityManager` recibido.
- [ ] La segunda ejecución no duplica datos.
- [ ] Una falla deliberada produce rollback total.
- [ ] `prod` rechaza demo data.
- [ ] Las métricas coinciden con la base.
- [ ] Los endpoints del módulo pueden explorar los datos creados.

## Errores que se deben evitar

- Llamar endpoints o services públicos por cada fila: acopla el seed al HTTP y
  produce consultas N+1.
- Compartir Faker entre dominios: un cambio altera datasets no relacionados.
- Validar después de insertar: produce errores tardíos y menos claros.
- Abrir transacciones anidadas: rompe el rollback global.
- Truncar por comodidad: puede borrar información que no pertenece al seed.
- Ejecutar al iniciar la API: mezcla disponibilidad del servicio con una acción
  de datos explícita.
- Usar el seed global como fixture de todas las pruebas: vuelve las suites
  lentas y dependientes de orden.
