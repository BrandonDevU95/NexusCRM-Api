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
  it('starts with a valid empty runtime registry', () => {
    const registry = new SeedRegistry();

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
