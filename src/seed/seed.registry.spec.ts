import { SeedRegistry } from './seed.registry';
import type { SeederDefinition } from './seed.types';

const metrics = { inserted: 0, updated: 0, skipped: 0 };

function seeder(
  name: string,
  dependencies: readonly string[] = [],
): SeederDefinition {
  return {
    name,
    dataKinds: ['reference'],
    dependencies,
    execute: () => metrics,
  };
}

describe('SeedRegistry', () => {
  it('registers the platform reference seeder once at runtime', () => {
    const registry = new SeedRegistry();

    expect(registry.names()).toEqual(['platform']);
    expect(registry.get('platform')).toMatchObject({
      name: 'platform',
      dataKinds: ['reference'],
      dependencies: [],
    });
  });

  it('accepts an explicitly empty registry for isolated consumers', () => {
    const registry = new SeedRegistry([]);

    expect(registry.list()).toEqual([]);
    expect(registry.names()).toEqual([]);
  });

  it('rejects duplicate module names', () => {
    expect(
      () => new SeedRegistry([seeder('platform'), seeder('platform')]),
    ).toThrow('Duplicate seed module name: platform');
  });

  it('rejects unsafe technical names and duplicate dependencies', () => {
    expect(() => new SeedRegistry([seeder('../users')])).toThrow(
      'Invalid seed module name',
    );
    expect(
      () =>
        new SeedRegistry([seeder('organizations', ['platform', 'platform'])]),
    ).toThrow('Duplicate dependency');
  });
});
