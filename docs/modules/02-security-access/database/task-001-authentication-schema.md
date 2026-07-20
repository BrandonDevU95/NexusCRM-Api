# Database task 001: identidad y autenticación

## Navegación

- **Código:** DB-SEC-001
- **Vienes de:** `../LEARNING-PATH.md`, parte A paso 1.
- **Regresa a:** `../LEARNING-PATH.md`, parte A paso 2.
- **No continúes hasta:** justificar persistencia, rotación y reglas de eliminación de cada token.

## Tablas de identidad

### users

| Campo                 | Tipo         | Null | Default              | Regla                  | Motivo                            |
| --------------------- | ------------ | ---: | -------------------- | ---------------------- | --------------------------------- |
| id                    | uuid         |   no | generado             | PK                     | Identidad global estable.         |
| email                 | varchar(254) |   no | —                    | formato válido         | Conserva presentación.            |
| normalized_email      | varchar(254) |   no | —                    | unique global          | Login sin diferencias de casing.  |
| password_hash         | varchar(255) |   no | —                    | solo Argon2id          | Nunca persiste password.          |
| first_name            | varchar(100) |   no | —                    | no vacío               | Perfil.                           |
| last_name             | varchar(100) |   no | —                    | no vacío               | Perfil.                           |
| status                | varchar(30)  |   no | PENDING_VERIFICATION | valor permitido        | Controla acceso.                  |
| failed_login_attempts | smallint     |   no | 0                    | mayor o igual a cero   | Política de bloqueo.              |
| locked_until          | timestamptz  |   sí | null                 | —                      | Bloqueo temporal.                 |
| email_verified_at     | timestamptz  |   sí | null                 | —                      | Evidencia de verificación.        |
| password_changed_at   | timestamptz  |   no | now                  | —                      | Invalida credenciales anteriores. |
| last_login_at         | timestamptz  |   sí | null                 | —                      | Operación y seguridad.            |
| created_at            | timestamptz  |   no | now                  | —                      | Trazabilidad.                     |
| updated_at            | timestamptz  |   no | now                  | —                      | Control de cambios.               |
| archived_at           | timestamptz  |   sí | null                 | posterior a created_at | Conserva identidad histórica.     |

`users` no tiene `organization_id`: la identidad es global y la membresía define acceso a tenants.

Estados permitidos: `PENDING_VERIFICATION`, `ACTIVE` y `SUSPENDED`. El bloqueo
temporal usa `locked_until` y el retiro histórico usa `archived_at`; no se
duplican esos conceptos dentro de `status`.

### user_sessions

| Campo         | Tipo         | Null | Default  | Regla                | Motivo                          |
| ------------- | ------------ | ---: | -------- | -------------------- | ------------------------------- |
| id            | uuid         |   no | generado | PK                   | Identifica dispositivo/sesión.  |
| user_id       | uuid         |   no | —        | FK users.id          | Dueño de sesión.                |
| user_agent    | varchar(512) |   sí | null     | —                    | Ayuda al usuario a reconocerla. |
| ip_address    | inet         |   sí | null     | —                    | Evidencia de seguridad.         |
| last_used_at  | timestamptz  |   no | now      | —                    | Actividad reciente.             |
| expires_at    | timestamptz  |   no | —        | posterior a creación | Límite absoluto.                |
| revoked_at    | timestamptz  |   sí | null     | —                    | Invalidación explícita.         |
| revoke_reason | varchar(120) |   sí | null     | requerido al revocar | Diagnóstico/auditoría.          |
| created_at    | timestamptz  |   no | now      | —                    | Trazabilidad.                   |

Relación: `users` es lado **uno** y `user_sessions` lado **muchos**. FK `user_sessions.user_id`, no nula, `onDelete: RESTRICT`. Se archiva el usuario y se revocan sesiones; borrar ocultaría evidencia de acceso.

### refresh_tokens

| Campo           | Tipo         | Null | Default  | Regla                     | Motivo                                            |
| --------------- | ------------ | ---: | -------- | ------------------------- | ------------------------------------------------- |
| id              | uuid         |   no | generado | PK                        | Identificador interno no secreto.                 |
| session_id      | uuid         |   no | —        | FK user_sessions.id       | Agrupa token en sesión.                           |
| token_hash      | varchar(255) |   no | —        | unique; nunca token claro | Verifica sin guardar secreto.                     |
| parent_token_id | uuid         |   sí | null     | FK self y unique          | Cada token puede producir como máximo un sucesor. |
| expires_at      | timestamptz  |   no | —        | posterior a created_at    | Límite de uso.                                    |
| used_at         | timestamptz  |   sí | null     | un uso máximo             | Garantiza rotación.                               |
| revoked_at      | timestamptz  |   sí | null     | —                         | Invalidación individual.                          |
| created_at      | timestamptz  |   no | now      | —                         | Trazabilidad.                                     |

Relación: una sesión es lado **uno** y tiene **muchos** refresh tokens
históricos. La FK no nula `refresh_tokens.session_id` usa
`onDelete: RESTRICT`; revocar o archivar conserva evidencia. La autorrelación
es uno-a-cero-o-uno: un refresh token padre puede tener como máximo un hijo y
el hijo referencia a su padre mediante `parent_token_id`, nullable para el
primer token de la sesión y `onDelete: RESTRICT`. El índice UNIQUE en
`parent_token_id` hace que dos rotaciones concurrentes no creen dos hijos.

No agregues `replaced_by_token_id` ni `token_family_id`: duplican la misma
cadena en dos direcciones y crean estados contradictorios. La sesión es la
frontera de revocación; para detectar replay se consulta si el token ya tiene
`used_at` o un hijo.

### email_verification_tokens y password_reset_tokens

Campos comunes: `id uuid PK`, `user_id uuid not null`, `token_hash varchar(255) unique not null`, `expires_at timestamptz not null`, `used_at timestamptz null`, `created_at timestamptz not null default now`.

Un usuario es lado **uno** y tiene **muchos** tokens históricos de cada tipo. FK no nula con `onDelete: RESTRICT`. Índices por `token_hash`, `user_id` y expiración.

## Constraints e índices

- Unique en `normalized_email`.
- Unique en hashes de tokens.
- Unique en `refresh_tokens.parent_token_id`; PostgreSQL permite varios null y
  restringe únicamente padres no nulos.
- Índices en sesiones activas por `user_id, revoked_at, expires_at`.
- CHECK de expiración posterior a creación.
- CHECK que impida `parent_token_id = id`.
- No almacenes access tokens: son verificables por firma y expiración.

## Migración

Nómbrala por intención, revisa `up/down`, prueba en base vacía y revierte. Ninguna migración crea el admin ni contiene passwords.

    pnpm migration:show
    pnpm migration:generate src/database/migrations/CreateAuthenticationSchema
    pnpm migration:run
    pnpm migration:revert
    pnpm migration:run
