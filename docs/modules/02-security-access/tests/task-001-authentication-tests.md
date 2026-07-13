# Test task 001: autenticación

## Navegación

- **Código:** TEST-SEC-001
- **Vienes de:** `../LEARNING-PATH.md`, registro `SEC-A04`.
- **Regresa a:** `../LEARNING-PATH.md`, registro `SEC-A04`.
- **No continúes hasta:** cubrir concurrencia, replay, expiración y revocación.

## Casos obligatorios

### Unitarias

- Password correcto/incorrecto contra Argon2id.
- Token opaco con entropía suficiente y solo hash persistido.
- Política de bloqueo y liberación por reloj controlado.
- Cookie según environment.
- La rotación construye el hijo con `parentTokenId` y no necesita
  `replacedByTokenId` o `tokenFamilyId`.

### Integración

- `normalized_email` es unique global.
- Crear sesión y primer refresh ocurre en una transacción.
- Rotar bloquea el padre, marca `used_at` y crea un hijo cuyo
  `parent_token_id` apunta al padre.
- `parent_token_id` es UNIQUE: un padre no admite dos hijos.
- Dos rotaciones concurrentes del mismo padre producen un éxito y un rechazo;
  nunca dos cookies válidas.
- Reutilizar padre usado o con hijo revoca la sesión completa.
- Revocar sesión invalida todos sus tokens no expirados.
- Verification/reset tokens son de un solo uso.
- No existen columnas `replaced_by_token_id` o `token_family_id` en el schema.

### Seed A

- Bootstrap user se localiza por normalized email y conserva ID tras dos
  corridas.
- Password viene del environment y nunca aparece en métricas/snapshots.
- El seeder recibe el `EntityManager` del runner y no abre transacción anidada.
- En A no crea organization, membership, role ni permission.

### E2E

- Login correcto entrega cookie segura y respuesta sin hashes.
- Login incorrecto no enumera user.
- Refresh válido rota cookie; la anterior deja de funcionar.
- Logout invalida refresh.
- User lista/revoca solo sus sesiones.
- Cambio de password exige credencial actual y revoca según política.
- Forgot password responde igual para email existente o desconocido.

## Infraestructura

Controla el reloj; no esperes expiración real. Usa PostgreSQL test migrado,
cierra app/DataSource y no imprimas valores de cookies. El fixture crea solo
las filas del caso y no depende del seed global.

## Evidencia

Registra comandos y resultados antes de marcar `SEC-A04`. Incluye el caso
concurrente y una inspección de columnas de `refresh_tokens`.
