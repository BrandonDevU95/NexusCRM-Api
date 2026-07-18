import { isDeepStrictEqual } from 'node:util';
import { IsNull, type EntityManager } from 'typeorm';

import { Catalog } from '../../platform/entities/catalog.entity';
import { CatalogOption } from '../../platform/entities/catalog-option.entity';
import { SystemSetting } from '../../platform/entities/system-setting.entity';
import {
  isMetadataObject,
  isNonNegativeSortOrder,
  isValidCode,
  isValidSystemSettingValue,
} from '../../platform/services/platform-input.validator';
import {
  SYSTEM_SETTING_DEFINITIONS,
  type SystemSettingKey,
} from '../../platform/services/system-setting.definitions';
import type {
  SeederDefinition,
  SeedExecutionContext,
  SeedMetrics,
} from '../seed.types';

interface SystemSettingSeedData {
  key: SystemSettingKey;
  value: string;
  description: string;
}

interface CatalogOptionSeedData {
  code: string;
  label: string;
  sortOrder: number;
  metadata: Record<string, unknown>;
}

interface CatalogSeedData {
  code: string;
  name: string;
  description: string;
  options: readonly CatalogOptionSeedData[];
}

const SYSTEM_SETTINGS: readonly SystemSettingSeedData[] = [
  {
    key: 'platform.default_language',
    value: 'es-MX',
    description: 'Idioma predeterminado de la plataforma.',
  },
  {
    key: 'platform.default_currency',
    value: 'MXN',
    description: 'Moneda predeterminada de la plataforma.',
  },
  {
    key: 'platform.time_zone',
    value: 'America/Mexico_City',
    description: 'Zona horaria predeterminada de la plataforma.',
  },
  {
    key: 'platform.date_format',
    value: 'DD/MM/YYYY',
    description: 'Formato predeterminado para mostrar fechas.',
  },
];

const GLOBAL_CATALOGS: readonly CatalogSeedData[] = [
  {
    code: 'languages',
    name: 'Idiomas disponibles',
    description: 'Locales BCP 47 admitidos por la plataforma.',
    options: [
      {
        code: 'es-mx',
        label: 'Español (México)',
        sortOrder: 0,
        metadata: { locale: 'es-MX' },
      },
      {
        code: 'en-us',
        label: 'English (United States)',
        sortOrder: 1,
        metadata: { locale: 'en-US' },
      },
    ],
  },
  {
    code: 'currencies',
    name: 'Monedas disponibles',
    description: 'Códigos ISO 4217 admitidos por la plataforma.',
    options: [
      {
        code: 'mxn',
        label: 'Peso mexicano',
        sortOrder: 0,
        metadata: { currencyCode: 'MXN' },
      },
      {
        code: 'usd',
        label: 'Dólar estadounidense',
        sortOrder: 1,
        metadata: { currencyCode: 'USD' },
      },
    ],
  },
  {
    code: 'time_zones',
    name: 'Zonas horarias disponibles',
    description: 'Zonas horarias IANA admitidas por la plataforma.',
    options: [
      {
        code: 'america-mexico-city',
        label: 'Ciudad de México',
        sortOrder: 0,
        metadata: { timeZone: 'America/Mexico_City' },
      },
      {
        code: 'utc',
        label: 'UTC',
        sortOrder: 1,
        metadata: { timeZone: 'UTC' },
      },
    ],
  },
  {
    code: 'date_formats',
    name: 'Formatos de fecha disponibles',
    description: 'Formatos admitidos para mostrar fechas.',
    options: [
      {
        code: 'day-month-year',
        label: 'DD/MM/YYYY',
        sortOrder: 0,
        metadata: { format: 'DD/MM/YYYY' },
      },
      {
        code: 'month-day-year',
        label: 'MM/DD/YYYY',
        sortOrder: 1,
        metadata: { format: 'MM/DD/YYYY' },
      },
      {
        code: 'year-month-day',
        label: 'YYYY-MM-DD',
        sortOrder: 2,
        metadata: { format: 'YYYY-MM-DD' },
      },
    ],
  },
];

const EMPTY_METRICS = (): SeedMetrics => ({
  inserted: 0,
  updated: 0,
  skipped: 0,
});

export class PlatformReferenceSeeder implements SeederDefinition {
  readonly name = 'platform';
  readonly dataKinds = ['reference'] as const;
  readonly dependencies = [] as const;

  prepare(): void {
    for (const setting of SYSTEM_SETTINGS) {
      if (!isValidSystemSettingValue(setting.key, setting.value)) {
        throw new Error(`Invalid platform setting seed value: ${setting.key}`);
      }
    }

    for (const catalog of GLOBAL_CATALOGS) {
      assertValidCatalogSeedData(catalog);
    }
  }

  async execute({ manager }: SeedExecutionContext): Promise<SeedMetrics> {
    const metrics = EMPTY_METRICS();

    for (const setting of SYSTEM_SETTINGS) {
      await seedSystemSetting(manager, setting, metrics);
    }

    for (const catalog of GLOBAL_CATALOGS) {
      await seedGlobalCatalog(manager, catalog, metrics);
    }

    return metrics;
  }
}

async function seedSystemSetting(
  manager: EntityManager,
  data: SystemSettingSeedData,
  metrics: SeedMetrics,
): Promise<void> {
  const existing = await manager.findOneBy(SystemSetting, { key: data.key });
  const isPublic = SYSTEM_SETTING_DEFINITIONS[data.key].isPublic;

  if (existing === null) {
    await manager.insert(SystemSetting, {
      key: data.key,
      value: data.value,
      description: data.description,
      isPublic,
    });
    metrics.inserted += 1;
    return;
  }

  if (
    existing.description === data.description &&
    existing.isPublic === isPublic
  ) {
    metrics.skipped += 1;
    return;
  }

  await manager.update(
    SystemSetting,
    { id: existing.id },
    { description: data.description, isPublic },
  );
  metrics.updated += 1;
}

function assertValidCatalogSeedData(data: CatalogSeedData): void {
  if (!isValidCode(data.code)) {
    throw new Error(`Invalid global catalog seed code: ${data.code}`);
  }

  for (const option of data.options) {
    if (
      !isValidCode(option.code) ||
      !isNonNegativeSortOrder(option.sortOrder) ||
      !isMetadataObject(option.metadata)
    ) {
      throw new Error(
        `Invalid global catalog option seed data: ${data.code}.${option.code}`,
      );
    }
  }
}

async function seedGlobalCatalog(
  manager: EntityManager,
  data: CatalogSeedData,
  metrics: SeedMetrics,
): Promise<void> {
  let catalog = await manager.findOneBy(Catalog, {
    organizationId: IsNull(),
    code: data.code,
  });

  if (catalog === null) {
    catalog = await manager.save(
      manager.create(Catalog, {
        organizationId: null,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: true,
      }),
    );
    metrics.inserted += 1;
  } else if (
    catalog.name === data.name &&
    catalog.description === data.description &&
    catalog.isActive === true
  ) {
    metrics.skipped += 1;
  } else {
    await manager.update(
      Catalog,
      { id: catalog.id },
      {
        name: data.name,
        description: data.description,
        isActive: true,
      },
    );
    metrics.updated += 1;
  }

  for (const option of data.options) {
    await seedCatalogOption(manager, catalog.id, option, metrics);
  }
}

async function seedCatalogOption(
  manager: EntityManager,
  catalogId: string,
  data: CatalogOptionSeedData,
  metrics: SeedMetrics,
): Promise<void> {
  const existing = await manager.findOneBy(CatalogOption, {
    catalogId,
    code: data.code,
  });

  if (existing === null) {
    await manager.save(
      manager.create(CatalogOption, {
        catalogId,
        code: data.code,
        label: data.label,
        sortOrder: data.sortOrder,
        metadata: data.metadata,
        isActive: true,
      }),
    );
    metrics.inserted += 1;
    return;
  }

  if (
    existing.label === data.label &&
    existing.sortOrder === data.sortOrder &&
    isDeepStrictEqual(existing.metadata, data.metadata) &&
    existing.isActive === true
  ) {
    metrics.skipped += 1;
    return;
  }

  existing.label = data.label;
  existing.sortOrder = data.sortOrder;
  existing.metadata = data.metadata;
  existing.isActive = true;
  await manager.save(existing);
  metrics.updated += 1;
}

export const platformReferenceSeeder = new PlatformReferenceSeeder();
