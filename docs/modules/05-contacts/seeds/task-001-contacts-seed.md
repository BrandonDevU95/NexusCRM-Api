# Seed task 001: contactos

## Navegación

- **Código:** SEED-CONT-001
- **Vienes de:** `../LEARNING-PATH.md`, paso 3.
- **Regresa a:** `../LEARNING-PATH.md`, paso 4.
- **No continúes hasta:** dos ejecuciones conserven principal, preferences e IDs.

## Dataset

Crea de cero a cuatro contactos por customer, incluyendo clientes empresa con varios departamentos, personas físicas con un solo contacto, contactos sin email y preferencias distintas.

## Coherencia

- Máximo un principal activo por customer.
- Incluye al menos un customer con contactos pero sin principal para demostrar que cero es válido.
- No todos los contactos aceptan todos los canales.
- Un contacto con `do_not_contact` permite probar que actividades automáticas lo respeten después.
- Organization siempre se deriva del customer, nunca de Faker.

## Orden e idempotencia

1. Lee customers seed por clave estable.
2. Upsert contacts mediante un `seed_key` de factory o combinación demo determinista documentada.
3. Upsert preferences por contact ID.
4. Establece principal después de insertar contactos.

Semilla Faker fija y locale consistente. El `SeedExecutorService` posee una sola transacción para todo el grafo solicitado y entrega el mismo `EntityManager`; Contacts no abre transacciones anidadas ni confirma por customer/tenant. Dos ejecuciones conservan IDs y conteos.

## Entorno

Solo desarrollo/test. No elimina contactos del usuario ni toca customers fuera del dataset conocido.
