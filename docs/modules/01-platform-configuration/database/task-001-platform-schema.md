# Database task 001: esquema de plataforma

## Navegación

- **Código:** DB-PLAT-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 2.
- **Regresa a:** `../LEARNING-PATH.md`, paso 3.
- **No continúes hasta:** justificar campos, relaciones, constraints e índices de las cuatro áreas de plataforma.

## Objetivo

Modelar configuración, catálogos, secuencias e impuestos sin mezclar secretos de entorno con datos editables del negocio.

## Convenciones comunes

- IDs: `uuid`, PK, no nulos, generados por PostgreSQL.
- Fechas: `timestamptz`, no nulas; `created_at` y `updated_at` con valor inicial actual.
- Textos de código: normalizados en mayúsculas o minúsculas por una sola regla de aplicación.
- JSON solo para valores cuyo formato varía; nunca para relaciones.

## Diseño de tablas

### system_settings

| Campo       | Tipo         | Null | Default  | Regla                          | Motivo                                          |
| ----------- | ------------ | ---: | -------- | ------------------------------ | ----------------------------------------------- |
| id          | uuid         |   no | generado | PK                             | Identidad estable.                              |
| key         | varchar(100) |   no | —        | unique                         | Localiza una configuración sin depender del ID. |
| value       | jsonb        |   no | —        | esquema válido para la clave   | Admite valores de forma controlada.             |
| description | varchar(255) |   sí | null     | —                              | Explica uso administrativo.                     |
| is_public   | boolean      |   no | false    | nunca expone secretos          | Separa lectura pública.                         |
| created_at  | timestamptz  |   no | now      | —                              | Trazabilidad.                                   |
| updated_at  | timestamptz  |   no | now      | actualización desde aplicación | Invalida caché y audita cambios.                |

Índices: unique en `key`; índice parcial en `is_public` si las lecturas públicas lo justifican.

### catalogs

| Campo           | Tipo         | Null | Default  | Regla                            | Motivo                            |
| --------------- | ------------ | ---: | -------- | -------------------------------- | --------------------------------- |
| id              | uuid         |   no | generado | PK                               | Identidad estable.                |
| organization_id | uuid         |   sí | null     | null es sistema; FK en módulo 03 | Permite catálogo global o tenant. |
| code            | varchar(80)  |   no | —        | no vacío                         | Clave natural estable.            |
| name            | varchar(120) |   no | —        | no vacío                         | Etiqueta administrativa.          |
| description     | varchar(255) |   sí | null     | —                                | Explica propósito.                |
| is_active       | boolean      |   no | true     | —                                | Desactiva sin borrar.             |
| created_at      | timestamptz  |   no | now      | —                                | Trazabilidad.                     |
| updated_at      | timestamptz  |   no | now      | —                                | Control de cambios.               |

Restricción: un catálogo global no repite `code`; después del módulo 03, una organización tampoco repite `code`. Usa índices únicos parciales para distinguir ámbito global y organizacional.

### catalog_options

| Campo      | Tipo         | Null | Default  | Regla                      | Motivo                              |
| ---------- | ------------ | ---: | -------- | -------------------------- | ----------------------------------- |
| id         | uuid         |   no | generado | PK                         | Identidad estable.                  |
| catalog_id | uuid         |   no | —        | FK catalogs.id             | Declara catálogo padre.             |
| code       | varchar(80)  |   no | —        | unique dentro del catálogo | Valor persistente para negocio.     |
| label      | varchar(120) |   no | —        | no vacío                   | Texto visible.                      |
| sort_order | integer      |   no | 0        | mayor o igual a cero       | Orden determinista.                 |
| metadata   | jsonb        |   no | `{}`     | objeto JSON                | Extensión no relacional controlada. |
| is_active  | boolean      |   no | true     | —                          | Desactiva sin perder referencias.   |
| created_at | timestamptz  |   no | now      | —                          | Trazabilidad.                       |
| updated_at | timestamptz  |   no | now      | —                          | Control de cambios.                 |

Relación: un `catalog` es el lado **uno** y `catalog_options` es el lado **muchos**. La FK vive en `catalog_options.catalog_id` porque cada opción depende de un solo catálogo. `onDelete: RESTRICT` evita borrar el significado de datos históricos; se desactiva la opción.

### number_sequences

| Campo           | Tipo        | Null | Default      | Regla                    | Motivo                              |
| --------------- | ----------- | ---: | ------------ | ------------------------ | ----------------------------------- |
| id              | uuid        |   no | generado     | PK                       | Identidad estable.                  |
| organization_id | uuid        |   no | —            | FK diferida al módulo 03 | Secuencia independiente por tenant. |
| document_type   | varchar(50) |   no | —            | tipo registrado          | Separa folios por documento.        |
| prefix          | varchar(20) |   no | cadena vacía | caracteres permitidos    | Formato legible.                    |
| next_value      | bigint      |   no | 1            | mayor que cero           | Próximo consecutivo atómico.        |
| padding         | smallint    |   no | 6            | entre 1 y 18             | Longitud configurable.              |
| is_active       | boolean     |   no | true         | —                        | Detiene emisión sin borrar.         |
| created_at      | timestamptz |   no | now          | —                        | Trazabilidad.                       |
| updated_at      | timestamptz |   no | now          | —                        | Control de concurrencia/cambios.    |

Restricción unique: `organization_id, document_type`. La fila debe bloquearse durante la obtención e incremento para que dos requests no reciban el mismo folio.

### tax_rates

| Campo           | Tipo         | Null | Default  | Regla                              | Motivo                                   |
| --------------- | ------------ | ---: | -------- | ---------------------------------- | ---------------------------------------- |
| id              | uuid         |   no | generado | PK                                 | Identidad estable.                       |
| organization_id | uuid         |   no | —        | FK diferida al módulo 03           | Impuesto por tenant.                     |
| code            | varchar(40)  |   no | —        | unique por organización            | Clave natural.                           |
| name            | varchar(100) |   no | —        | no vacío                           | Etiqueta visible.                        |
| rate_percent    | numeric(5,2) |   no | —        | entre 0 y 100                      | Porcentaje decimal exacto y consistente. |
| is_default      | boolean      |   no | false    | máximo uno activo por organización | Selección automática explícita.          |
| is_active       | boolean      |   no | true     | —                                  | Desactiva sin alterar snapshots.         |
| created_at      | timestamptz  |   no | now      | —                                  | Trazabilidad.                            |
| updated_at      | timestamptz  |   no | now      | —                                  | Control de cambios.                      |

## Relaciones organizacionales diferidas

Una `organization` será el lado **uno** y tendrá muchos `catalogs`, `number_sequences` y `tax_rates`. Las FKs estarán en esas tres tablas porque son los registros dependientes. El módulo 03 agregará `onDelete: RESTRICT`: borrar una organización con configuración comercial destruiría trazabilidad.

## Criterios de aceptación

- Ninguna clave o código obligatorio admite vacío.
- Todas las unicidades respetan ámbito global u organizacional.
- Los valores monetarios o porcentajes no usan float; porcentajes usan escala 0–100.
- La eliminación de catálogos con opciones está restringida.
- La migración no inserta datos Faker.
