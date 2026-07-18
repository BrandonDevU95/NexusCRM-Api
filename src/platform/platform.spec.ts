import { Catalog } from './entities/catalog.entity';
import { CatalogRepository } from './repositories/catalog.repository';
import { CatalogsService } from './services/catalogs.service';
import { FolioFormatterService } from './services/folio-formatter.service';
import {
  isKnownSystemSettingKey,
  isMetadataObject,
  isNonNegativeSortOrder,
  isValidCode,
  isValidSystemSettingValue,
  normalizeCode,
} from './services/platform-input.validator';
import {
  type PublicSystemSetting,
  PublicSettingsService,
} from './services/public-settings.service';
import { SystemSetting } from './entities/system-setting.entity';
import { SystemSettingRepository } from './repositories/system-setting.repository';
import { PublicSettingsController } from './controllers/public-settings.controller';

function systemSetting(overrides: Partial<SystemSetting> = {}): SystemSetting {
  return Object.assign(new SystemSetting(), {
    id: '00000000-0000-4000-8000-000000000001',
    key: 'platform.default_language',
    value: 'es-MX',
    description: 'Default public locale.',
    isPublic: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('Platform Stage A', () => {
  it('PLAT-UT-001 formats a folio without mutating sequence state', () => {
    const formatter = new FolioFormatterService();
    const sequence = { prefix: 'INV-', nextValue: '42', padding: 6 };

    expect(
      formatter.format(sequence.prefix, sequence.nextValue, sequence.padding),
    ).toBe('INV-000042');
    expect(sequence).toEqual({ prefix: 'INV-', nextValue: '42', padding: 6 });
    expect(formatter.format('INV-', '1234567', 6)).toBe('INV-1234567');
  });

  it('PLAT-UT-002 accepts only known setting keys and their value contracts', () => {
    expect(isKnownSystemSettingKey('platform.default_language')).toBe(true);
    expect(isKnownSystemSettingKey('database_password')).toBe(false);

    expect(
      isValidSystemSettingValue('platform.default_language', 'es-MX'),
    ).toBe(true);
    expect(isValidSystemSettingValue('platform.default_currency', 'MXN')).toBe(
      true,
    );
    expect(isValidSystemSettingValue('platform.time_zone', 'UTC')).toBe(true);
    expect(
      isValidSystemSettingValue('platform.date_format', 'YYYY-MM-DD'),
    ).toBe(true);

    expect(isValidSystemSettingValue('platform.default_currency', 'mxn')).toBe(
      false,
    );
    expect(
      isValidSystemSettingValue('platform.time_zone', 'Mars/Olympus'),
    ).toBe(false);
    expect(
      isValidSystemSettingValue('platform.date_format', 'YYYY/MM/DD'),
    ).toBe(false);
    expect(isValidSystemSettingValue('database_password', 'secret')).toBe(
      false,
    );
  });

  it('PLAT-UT-003 normalizes and validates codes deterministically', () => {
    expect(normalizeCode('  CUSTOMER_STATUS  ')).toBe('customer_status');
    expect(isValidCode('  CUSTOMER_STATUS  ')).toBe(true);
    expect(isValidCode('   ')).toBe(false);
    expect(isValidCode('a'.repeat(81))).toBe(false);
  });

  it('PLAT-UT-004 accepts only JSON objects and non-negative integer order', () => {
    expect(isMetadataObject({ source: 'reference' })).toBe(true);
    expect(isMetadataObject(Object.create(null))).toBe(true);
    expect(isMetadataObject([])).toBe(false);
    expect(isMetadataObject(new Date())).toBe(false);
    expect(isMetadataObject(null)).toBe(false);

    expect(isNonNegativeSortOrder(0)).toBe(true);
    expect(isNonNegativeSortOrder(10)).toBe(true);
    expect(isNonNegativeSortOrder(-1)).toBe(false);
    expect(isNonNegativeSortOrder(1.5)).toBe(false);
  });

  it('PLAT-UT-005 returns only known, valid, public settings', async () => {
    const findPublic = jest.fn().mockResolvedValue([
      systemSetting(),
      systemSetting({ key: 'database_password', value: 'do-not-expose' }),
      systemSetting({
        key: 'platform.default_currency',
        value: 'mxn',
      }),
      systemSetting({
        key: 'platform.date_format',
        value: 'YYYY-MM-DD',
        isPublic: false,
      }),
    ]);
    const repository = { findPublic } as unknown as SystemSettingRepository;
    const service = new PublicSettingsService(repository);

    await expect(service.findPublicSettings()).resolves.toEqual([
      {
        key: 'platform.default_language',
        value: 'es-MX',
        description: 'Default public locale.',
      },
    ]);
  });

  it('PLAT-UT-006 normalizes global catalog lookups before delegation', async () => {
    const findGlobalByCode = jest.fn().mockResolvedValue(new Catalog());
    const repository = {
      findAllGlobal: jest.fn(),
      findGlobalByCode,
    } as unknown as CatalogRepository;
    const service = new CatalogsService(repository);

    await service.findGlobalByCode('  ORDER_STATUS  ');

    expect(findGlobalByCode).toHaveBeenCalledWith('order_status');
    expect(findGlobalByCode).toHaveBeenCalledTimes(1);

    await expect(service.findGlobalByCode('   ')).resolves.toBeNull();
    expect(findGlobalByCode).toHaveBeenCalledTimes(1);
  });

  it('PLAT-UT-007 maps the public service contract to the response DTO', async () => {
    const publicSettings: PublicSystemSetting[] = [
      {
        key: 'platform.default_language',
        value: 'es-MX',
        description: 'Default public locale.',
      },
    ];
    const findPublicSettings = jest.fn().mockResolvedValue(publicSettings);
    const service = {
      findPublicSettings,
    } as unknown as PublicSettingsService;
    const controller = new PublicSettingsController(service);

    await expect(controller.findPublicSettings()).resolves.toEqual(
      publicSettings,
    );
    expect(findPublicSettings).toHaveBeenCalledTimes(1);
  });
});
