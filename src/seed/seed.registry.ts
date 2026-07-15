import type { SeederDefinition } from './seed.types';

const RUNTIME_SEEDERS: readonly SeederDefinition[] = [];

export class SeedRegistry {
  private readonly seedersByName: ReadonlyMap<string, SeederDefinition>;

  constructor(seeders: readonly SeederDefinition[] = RUNTIME_SEEDERS) {
    const entries = new Map<string, SeederDefinition>();

    for (const seeder of seeders) {
      if (!/^[a-z][a-z0-9-]*$/.test(seeder.name)) {
        throw new Error(`Invalid seed module name: ${seeder.name}`);
      }

      if (entries.has(seeder.name)) {
        throw new Error(`Duplicate seed module name: ${seeder.name}`);
      }

      if (new Set(seeder.dependencies).size !== seeder.dependencies.length) {
        throw new Error(`Duplicate dependency in seed module: ${seeder.name}`);
      }

      entries.set(seeder.name, seeder);
    }

    this.seedersByName = entries;
  }

  list(): readonly SeederDefinition[] {
    return [...this.seedersByName.values()];
  }

  get(name: string): SeederDefinition | undefined {
    return this.seedersByName.get(name);
  }

  names(): readonly string[] {
    return [...this.seedersByName.keys()];
  }
}
