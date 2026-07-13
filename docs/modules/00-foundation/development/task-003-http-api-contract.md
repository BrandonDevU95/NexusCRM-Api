# Development task 003: contrato HTTP base

## Navegación

| Dato | Valor |
| --- | --- |
| Código | `DEV-FND-003` |
| Vienes de | `../LEARNING-PATH.md`, checkpoint `FND-005` |
| Regresas a | `../LEARNING-PATH.md`, checkpoint `FND-005` |
| Rama esperada | `sdd/add-api-foundation` |

No continúes hasta que el health endpoint, validation, error envelope,
correlation ID y Swagger compartan un contrato verificable bajo `/api/v1`.

## Objetivo

Convertir el starter temporal en una API con una frontera HTTP estable antes de
crear módulos de negocio. Esta tarea define cómo entran requests, cómo se
validan, cómo se correlacionan, cómo salen los errores y cómo se documenta el
contrato.

No implementa authentication, permissions ni lógica CRM.

## Dependencias

Instala Swagger, health checks y middleware HTTP con las versiones fijadas para
NestJS 11:

```powershell
pnpm add -E @nestjs/swagger@11.4.5 @nestjs/terminus@11.1.1 helmet@8.3.0 compression@1.8.1
pnpm add -D -E @types/compression@1.8.1
```

No instales `swagger-ui-express` por separado; la integración elegida ya incluye
lo necesario. `class-validator` y `class-transformer` deben existir desde
`FND-002`. Terminus aporta el contrato de readiness y el indicador TypeORM;
Helmet agrega headers defensivos. Compression se habilita mediante configuración
y debe omitirse para respuestas ya comprimidas como PDF/XLSX o cuando el proxy
sea el responsable.

## Estructura de archivos

```text
src/
├── common/
│   ├── constants/
│   │   └── api.constants.ts
│   ├── filters/
│   │   └── global-exception.filter.ts
│   ├── interceptors/
│   │   └── correlation-id.interceptor.ts
│   └── types/
│       └── request-context.type.ts
├── health/
│   ├── dto/
│   │   └── health-response.dto.ts
│   ├── health.controller.ts
│   ├── health.service.ts
│   └── health.module.ts
├── app.module.ts
└── main.ts
```

El nombre puede ajustarse si el starter ya usa una convención equivalente, pero
no repartas bootstrap HTTP entre módulos de negocio.

## Contrato de rutas

El prefijo global exacto es:

```text
/api/v1
```

Por tanto, el health endpoint público es:

```text
GET /api/v1/health
```

`v1` pertenece al contrato de URI. No actives al mismo tiempo otra estrategia
de versionado que produzca rutas duplicadas como `/api/v1/v1/...`.

El prefix es una decisión de producto, no un port ni un secret. Debe existir en
una constante compartida por bootstrap, Swagger y tests; no repetir el string
en cada controller.

Elimina o deja fuera del module graph el controller y service de “Hello World”
generados por el starter. El health endpoint se convierte en el primer contrato
permanente.

## Bootstrap en `main.ts`

Configura en este orden conceptual:

1. Crear la aplicación desde `AppModule`.
2. Confirmar que Joi ya validó environment.
3. Registrar Helmet y Compression conforme a configuración validada.
4. Aplicar el prefijo global `/api/v1`.
5. Registrar global `ValidationPipe`.
6. Registrar correlation ID para todos los requests.
7. Registrar el global exception filter que consume ese ID.
8. Crear Swagger únicamente si el environment lo habilita.
9. Escuchar en host y port validados.

El orden importa: el error filter necesita el correlation ID y Swagger necesita
conocer el prefix antes de publicar el documento.

## `ValidationPipe` global

Decisiones:

- `whitelist`: elimina propiedades que no pertenecen al DTO.
- `forbidNonWhitelisted`: además las rechaza para que el cliente detecte el
  error en lugar de creer que se guardaron.
- `transform`: convierte el payload a la clase DTO antes de usarlo.
- Conversión implícita: deshabilitada al inicio; las transformaciones importantes
  deben ser explícitas y probables.
- Mensajes: útiles para el cliente, sin stack trace ni detalles internos.

Joi sigue validando environment variables. `ValidationPipe` solo valida inputs
HTTP descritos por DTOs.

Aunque health no recibe body, crea un DTO de respuesta para documentar su
contrato y aprender la separación request/response.

## Correlation ID

Cada request necesita un identificador que conecte response, error y logs.

Reglas:

1. Leer el header `x-correlation-id` si existe.
2. Aceptarlo únicamente si cumple longitud y caracteres seguros; define máximo
   128 y documenta el patrón.
3. Si falta o es inválido, generar un UUID nuevo.
4. Guardarlo en el request context tipado.
5. Devolverlo siempre en el header `x-correlation-id`.
6. Incluirlo en el error envelope y logs estructurados.

No confiar en un valor arbitrariamente largo enviado por el cliente. No usar el
correlation ID como authentication token ni como identificador de una entity.

El interceptor se ocupa de la frontera HTTP. Los módulos de negocio no deben
volver a generar otro ID.

## Error envelope

Todo error HTTP debe conservar una estructura estable:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "La solicitud contiene datos inválidos",
  "details": [],
  "timestamp": "2026-07-12T20:00:00.000Z",
  "path": "/api/v1/example",
  "method": "POST",
  "correlationId": "uuid-o-identificador-validado"
}
```

Este JSON describe el contrato, no es la implementación del filter.

Reglas:

- `statusCode`: HTTP status real.
- `code`: identificador técnico estable en inglés.
- `message`: explicación segura y legible.
- `details`: lista opcional para errores de validación; no objetos internos.
- `timestamp`: instante UTC.
- `path` y `method`: request actual.
- `correlationId`: mismo valor del response header.

Para una `HttpException` conocida, conserva status y mensaje seguro. Para un
error no reconocido, devuelve 500 con mensaje genérico. El stack, SQL, paths,
environment y secrets solo pueden ir a logs controlados de desarrollo; nunca a
la respuesta.

No conviertas todos los errores en 500 ni uses el mensaje crudo de PostgreSQL
como contrato.

## Health endpoint

`GET /api/v1/health` es público y funciona como readiness básica.

Debe reportar:

- Estado general: `ok` cuando la aplicación y database responden.
- Service name: `nexuscrm-api`.
- Versión tomada del package o configuración validada.
- Timestamp UTC.
- Estado database sin host, username, schema ni credentials.

El service usa Terminus y su indicador TypeORM para comprobar el `DataSource`;
no consulta una tabla de negocio ni inventa otro framework de health. Si
PostgreSQL no responde, devuelve estado no saludable y HTTP 503. No inventes un
200 con `database: down`, porque un readiness check debe permitir al orquestador
retirar una instancia incapaz de atender requests.

No incluyas memoria, environment completo o datos que faciliten reconocimiento
de infraestructura.

## Swagger/OpenAPI

Agrega variables y Joi:

| Variable | Regla |
| --- | --- |
| `SWAGGER_ENABLED` | boolean; true en dev/test según example, false por default en prod |
| `SWAGGER_PATH` | path local válido, sin URL externa ni traversal |

Swagger debe definir:

- Title `NexusCRM API`.
- Versión de aplicación.
- Descripción breve del backend.
- Server base `/api/v1`.
- Tag `health`.
- Success response y 503 del endpoint.
- Esquema del error envelope reutilizable cuando el proyecto lo incorpore.

La UI se monta en `SWAGGER_PATH`, fuera del prefijo de recursos, para no crear
`/api/v1/api/v1`. El OpenAPI document sí declara `/api/v1` como base de los
endpoints.

Swagger no se habilita automáticamente en prod. Si una futura operación lo
requiere, se habilita explícitamente y se protege en infraestructura.

## Orden de implementación

1. Instalar Swagger, Terminus y middleware; revisar el diff del lockfile.
2. Definir la constante única del prefix.
3. Crear request context y correlation interceptor.
4. Crear el error envelope y global exception filter.
5. Registrar `ValidationPipe`, interceptor y filter en bootstrap.
6. Crear HealthModule con Terminus, controller y response DTO.
7. Registrar HealthModule en AppModule.
8. Configurar Swagger condicionado por environment.
9. Retirar el contrato temporal de Hello World.
10. Ejecutar typecheck y verificaciones manuales.

No agregues authentication guards a health ni crees un `CommonModule` global
que oculte todas las dependencias.

## Verificación manual

### Health correcto

```powershell
docker compose --env-file .env up -d database
pnpm migration:run
pnpm start:dev
```

En otra terminal:

```powershell
curl.exe -i http://localhost:3000/api/v1/health
```

Ajusta host y port al `.env`. Confirma status 200, response shape, database
healthy y header `x-correlation-id`.

### Correlation ID proporcionado

```powershell
curl.exe -i http://localhost:3000/api/v1/health -H "x-correlation-id: learning-foundation-001"
```

El response debe conservar el valor porque cumple el patrón. Prueba después un
valor demasiado largo; debe generar uno seguro en lugar de reflejarlo.

### Error envelope

Solicita una route inexistente bajo `/api/v1`. Confirma status 404 y todas las
propiedades del envelope. No debe aparecer stack, SQL ni password.

### Database no disponible

Detén solo `database`, conserva la API activa y solicita health. Debe responder
503 con forma documentada y correlation ID. Vuelve a levantar PostgreSQL antes
de continuar.

### Swagger

Con `SWAGGER_ENABLED=true`, abre el path configurado y confirma que documenta
health bajo `/api/v1`. Con false, la UI no debe estar disponible y la API debe
seguir funcionando.

## Errores frecuentes

- Repetir `/api/v1` en cada controller.
- Activar versioning adicional y duplicar `v1`.
- Registrar exception filter antes de disponer del correlation ID.
- Reflejar un header sin validar longitud.
- Devolver el stack o mensaje SQL en 500.
- Usar HTTP 200 cuando readiness depende de una database caída.
- Habilitar Swagger siempre en prod.
- Documentar endpoints con paths distintos a los ejecutables.
- Conservar “Hello World” como segundo contrato raíz sin propósito.

## Preguntas de comprensión

1. ¿Qué diferencia existe entre Joi y `ValidationPipe`?
2. ¿Por qué el correlation ID debe aparecer en header y error envelope?
3. ¿Por qué un error desconocido no devuelve su mensaje original?
4. ¿Qué diferencia existe entre una respuesta health 200 y 503?
5. ¿Por qué Swagger usa el mismo prefix constante que el bootstrap?
6. ¿Qué parte de este contrato podrán reutilizar todos los módulos?

## Definition of Done

- [ ] Swagger `11.4.5` y Terminus `11.1.1` están fijados sin dependencias redundantes.
- [ ] Helmet está activo y Compression no transforma PDF/XLSX ni duplica al proxy.
- [ ] Todos los endpoints funcionales usan `/api/v1` una sola vez.
- [ ] `ValidationPipe` global rechaza propiedades desconocidas.
- [ ] Cada response contiene un correlation ID válido.
- [ ] El error envelope es estable y no filtra detalles internos.
- [ ] Health devuelve 200 con database disponible y 503 sin ella.
- [ ] Swagger documenta health y puede deshabilitarse por environment.
- [ ] El contrato temporal del starter fue retirado.
- [ ] Typecheck y verificaciones manuales pasan.

## Regreso

Vuelve a [`../LEARNING-PATH.md`](../LEARNING-PATH.md), checkpoint `FND-005`, y
haz el commit indicado antes de abrir Seed.
