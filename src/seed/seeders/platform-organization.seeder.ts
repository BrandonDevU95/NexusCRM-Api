import { isDeepStrictEqual } from 'node:util';
import type { EntityManager } from 'typeorm';

import { Catalog } from '../../platform/entities/catalog.entity';
import { CatalogOption } from '../../platform/entities/catalog-option.entity';
import { NumberSequence } from '../../platform/entities/number-sequence.entity';
import { TaxRate } from '../../platform/entities/tax-rate.entity';
import type {
  OrganizationSeedExecutionContext,
  SeedMetrics,
} from '../seed.types';

interface NumberSequenceSeedData {
  documentType: string;
  prefix: string;
  padding: number;
}

interface TaxRateSeedData {
  code: string;
  name: string;
  ratePercent: string;
  isDefault: boolean;
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

const NUMBER_SEQUENCES: readonly NumberSequenceSeedData[] = [
  { documentType: 'quote', prefix: 'QUO-', padding: 6 },
  { documentType: 'order', prefix: 'ORD-', padding: 6 },
  { documentType: 'ticket', prefix: 'TKT-', padding: 6 },
];

const TAX_RATES: readonly TaxRateSeedData[] = [
  {
    code: 'iva-0',
    name: 'IVA 0%',
    ratePercent: '0.00',
    isDefault: false,
  },
  {
    code: 'exempt',
    name: 'Exento',
    ratePercent: '0.00',
    isDefault: false,
  },
  {
    code: 'iva-16',
    name: 'IVA 16%',
    ratePercent: '16.00',
    isDefault: true,
  },
];

const ORGANIZATION_CATALOGS: readonly CatalogSeedData[] = [
  {
    code: 'contact_channels',
    name: 'Canales de contacto',
    description: 'Canales disponibles para comunicación con clientes.',
    options: [
      {
        code: 'email',
        label: 'Correo electrónico',
        sortOrder: 0,
        metadata: {},
      },
      {
        code: 'phone',
        label: 'Teléfono',
        sortOrder: 1,
        metadata: {},
      },
      {
        code: 'whatsapp',
        label: 'WhatsApp',
        sortOrder: 2,
        metadata: {},
      },
    ],
  },
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMPTY_METRICS = (): SeedMetrics => ({
  inserted: 0,
  updated: 0,
  skipped: 0,
});

export class PlatformOrganizationSeeder {
  async execute({
    manager,
    organizationIds,
  }: OrganizationSeedExecutionContext): Promise<SeedMetrics> {
    assertOrganizationIds(organizationIds);
    const metrics = EMPTY_METRICS();

    for (const organizationId of organizationIds) {
      for (const sequence of NUMBER_SEQUENCES) {
        await seedNumberSequence(manager, organizationId, sequence, metrics);
      }

      for (const taxRate of TAX_RATES) {
        await seedTaxRate(manager, organizationId, taxRate, metrics);
      }

      for (const catalog of ORGANIZATION_CATALOGS) {
        await seedOrganizationCatalog(
          manager,
          organizationId,
          catalog,
          metrics,
        );
      }
    }

    return metrics;
  }
}

function assertOrganizationIds(organizationIds: readonly string[]): void {
  const uniqueIds = new Set<string>();

  for (const organizationId of organizationIds) {
    if (!UUID_PATTERN.test(organizationId)) {
      throw new Error(`Invalid organization ID: ${organizationId}`);
    }

    const normalizedOrganizationId = organizationId.toLowerCase();
    if (uniqueIds.has(normalizedOrganizationId)) {
      throw new Error(`Duplicate organization ID: ${organizationId}`);
    }

    uniqueIds.add(normalizedOrganizationId);
  }
}

async function seedNumberSequence(
  manager: EntityManager,
  organizationId: string,
  data: NumberSequenceSeedData,
  metrics: SeedMetrics,
): Promise<void> {
  const existing = await manager.findOneBy(NumberSequence, {
    organizationId,
    documentType: data.documentType,
  });

  if (existing === null) {
    await manager.insert(NumberSequence, {
      organizationId,
      documentType: data.documentType,
      prefix: data.prefix,
      nextValue: '1',
      padding: data.padding,
      isActive: true,
    });
    metrics.inserted += 1;
    return;
  }

  if (
    existing.prefix === data.prefix &&
    existing.padding === data.padding &&
    existing.isActive === true
  ) {
    metrics.skipped += 1;
    return;
  }

  await manager.update(
    NumberSequence,
    { id: existing.id },
    { prefix: data.prefix, padding: data.padding, isActive: true },
  );
  metrics.updated += 1;
}

async function seedTaxRate(
  manager: EntityManager,
  organizationId: string,
  data: TaxRateSeedData,
  metrics: SeedMetrics,
): Promise<void> {
  const existing = await manager.findOneBy(TaxRate, {
    organizationId,
    code: data.code,
  });

  if (existing === null) {
    await manager.insert(TaxRate, {
      organizationId,
      code: data.code,
      name: data.name,
      ratePercent: data.ratePercent,
      isDefault: data.isDefault,
      isActive: true,
    });
    metrics.inserted += 1;
    return;
  }

  if (
    existing.name === data.name &&
    existing.ratePercent === data.ratePercent &&
    existing.isDefault === data.isDefault &&
    existing.isActive === true
  ) {
    metrics.skipped += 1;
    return;
  }

  await manager.update(
    TaxRate,
    { id: existing.id },
    {
      name: data.name,
      ratePercent: data.ratePercent,
      isDefault: data.isDefault,
      isActive: true,
    },
  );
  metrics.updated += 1;
}

async function seedOrganizationCatalog(
  manager: EntityManager,
  organizationId: string,
  data: CatalogSeedData,
  metrics: SeedMetrics,
): Promise<void> {
  let catalog = await manager.findOneBy(Catalog, {
    organizationId,
    code: data.code,
  });

  if (catalog === null) {
    catalog = await manager.save(
      manager.create(Catalog, {
        organizationId,
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

export const platformOrganizationSeeder = new PlatformOrganizationSeeder();
