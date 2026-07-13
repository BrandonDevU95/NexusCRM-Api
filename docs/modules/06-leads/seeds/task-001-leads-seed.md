# Seed task 001: leads y conversiones

## Navegación Parte A

- **Código:** SEED-LEAD-001-A
- **Vienes de:** `../LEARNING-PATH.md`, Recorrido Parte A paso 3.
- **Regresa a:** `../LEARNING-PATH.md`, Recorrido Parte A paso 4.
- **No continúes hasta:** fuentes, leads, histories y scores sean idempotentes.

## Navegación Parte B

- **Código:** SEED-LEAD-001-B
- **Vienes de:** `../LEARNING-PATH.md`, Recorrido Parte B paso 3.
- **Regresa a:** `../LEARNING-PATH.md`, Recorrido Parte B paso 4.
- **No continúes hasta:** conversiones con key/fingerprint estable no se dupliquen.

## Parte A

Crea para cada organization las fuentes Web, Referral, Campaign, Social, Call, Email, Event, Import y Other; después leads en NEW, CONTACTED, QUALIFIED, UNQUALIFIED, FOLLOW_UP y LOST. Distribuye owners, score, valor y next follow-up de forma coherente.

## Parte B

Convierte mediante la operación interna de dominio que acepta el `EntityManager` del runner un subconjunto QUALIFIED para generar customer/contact/deal e historial real. Define `existingCustomerId` solo en casos seed deliberados y genera key/fingerprint deterministas. No insertes `lead_conversions` a mano si eso evita reglas.

## Orden e idempotencia

Fuentes → leads → histories/scores → conversiones. Usa claves seed deterministas y semilla Faker fija. Para conversiones guarda una clave estable por lead; si ya existe, verifica resultado y continúa.

## Transacción

El `SeedExecutorService` abre una sola transacción para todas las dependencias solicitadas y entrega el mismo `EntityManager` a Parte A y Parte B. Ningún seeder ni conversión abre/commitea una transacción anidada. Un fallo revierte el grafo y no deja lead CONVERTED sin registro ni customer huérfano.

## Entorno

Solo desarrollo/test. Segunda ejecución conserva IDs y no crea nuevos customers/deals derivados.
