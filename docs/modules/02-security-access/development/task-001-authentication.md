# Development task 001: autenticación segura

## Navegación

- **Código:** DEV-SEC-001
- **Vienes de:** `../LEARNING-PATH.md`, parte A paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, parte A paso 3.
- **No continúes hasta:** implementar rotación atómica, replay y revocación sin exponer secretos.

## Casos de uso

- Alta interna de usuario por administrador; no registro público.
- Verificar email.
- Login con control de intentos.
- Emitir access token corto y refresh token opaco en cookie HttpOnly.
- Rotar refresh token en cada uso.
- Logout de sesión actual y revocación de cualquier sesión propia.
- Cambio y recuperación de password.
- Listar sesiones activas sin exponer tokens.

## Dependencias e instalación

Instala al comenzar esta tarea y revisa `package.json`/lockfile:

    pnpm add -E argon2@0.44.0
    pnpm add -E @nestjs/passport@11.0.5 passport@0.7.0 @nestjs/jwt@11.0.2 passport-jwt@4.0.1
    pnpm add -E cookie-parser@1.4.7 @nestjs/throttler@6.5.0
    pnpm add -D -E @types/passport@1.0.17 @types/passport-jwt@4.0.1 @types/cookie-parser@1.4.10

No instales `jsonwebtoken` directamente salvo que una necesidad documentada lo exija; `@nestjs/jwt` ya lo integra.
Cookie Parser solo obtiene el valor de la cookie: Auth valida hash, sesión,
rotación y revocación. Throttler protege login, recuperación, verificación y
refresh; su storage en memoria es válido para una sola réplica y debe cambiarse
deliberadamente antes de escalar horizontalmente.

## Contrato tenant

Login, refresh, logout, recuperación y sesiones de la identidad no eligen tenant. El access token identifica al usuario, pero no concede por sí solo una organización. En endpoints tenant-scoped posteriores, `X-Organization-Id` será obligatorio y la membresía se validará en cada request.

## Endpoints orientativos

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/verify-email`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`
- `GET /auth/sessions`
- `DELETE /auth/sessions/:sessionId`
- `POST /users` solo para alta interna autorizada

## DTO validation

- Email normalizado y longitud RFC práctica.
- Password con longitud y política documentada; no “recortes” espacios silenciosamente.
- Tokens opacos como strings con longitud/formato esperado.
- IDs UUID.
- Rechaza propiedades adicionales sensibles como `status`, `roles` o `password_hash` en DTOs públicos.

## Orden de implementación

1. Servicio de hashing y comparación Argon2id.
2. Generación criptográfica y hash de tokens opacos.
3. Login y creación de sesión en transacción.
4. Refresh rotado: bloquea el token padre, comprueba que no tenga `used_at` ni
   hijo, lo marca usado y crea exactamente un hijo con
   `parent_token_id = parent.id` dentro de la misma transacción.
5. Detección de replay: ante padre usado, padre con hijo o conflicto UNIQUE,
   revoca la sesión completa y registra security event.
6. Logout, sesiones y revocación.
7. Verificación y recuperación con respuestas que no enumeren usuarios.
8. Cookies por entorno, controller y Swagger sin mostrar secretos.

## Auditoría y eventos

Emite eventos para login exitoso/fallido, bloqueo, logout, replay, password cambiado y sesión revocada. Nunca incluyas password, token, cookie ni hash en payload o logs.

## Errores

- Credenciales inválidas: `401` genérico.
- Usuario bloqueado/inactivo: respuesta que no filtra detalles innecesarios.
- Refresh expirado, usado o revocado: `401`; el replay revoca la sesión.
- Sesión ajena: `404` dentro del alcance del usuario, no confirmes su existencia.
- Rate limiting debe contemplarse en login y recuperación.
