import type { EntityManager } from 'typeorm';

import type { NodeEnvironment } from '../config/env.types';

export const SEED_OUTPUT = Symbol('SEED_OUTPUT');

export type SeedDataKind = 'reference' | 'demo';

export type SeedFailurePhase =
  'arguments' | 'environment' | 'migrations' | 'preparation' | 'transaction';

export type SeedFailureStatus = 'not_started' | 'rolled_back';

export interface SeedMetrics {
  inserted: number;
  updated: number;
  skipped: number;
}

export interface SeedPreparationContext {
  dataKind: SeedDataKind;
  environment: NodeEnvironment;
  databaseName: string;
  randomSeed?: number;
  batchSize: number;
}

export interface SeedExecutionContext extends SeedPreparationContext {
  manager: EntityManager;
}

export interface OrganizationSeedExecutionContext {
  manager: EntityManager;
  organizationIds: readonly string[];
}

export interface SeederDefinition {
  name: string;
  dataKinds: readonly SeedDataKind[];
  dependencies: readonly string[];
  prepare?: (context: SeedPreparationContext) => Promise<void> | void;
  execute: (
    context: SeedExecutionContext,
  ) => Promise<SeedMetrics> | SeedMetrics;
}

export interface SeedModuleResult extends SeedMetrics {
  module: string;
}

export interface SeedRunRequest {
  moduleName: string;
  dataKind: SeedDataKind;
}

export interface SeedRunResult {
  environment: NodeEnvironment;
  databaseName: string;
  dataKind: SeedDataKind;
  randomSeed?: number;
  modules: string[];
  moduleResults: SeedModuleResult[];
  totals: SeedMetrics;
  durationMs: number;
  status: 'committed';
}

export interface SeedOutput {
  info(message: string): void;
  error(message: string): void;
}

export class SeedExecutionError extends Error {
  constructor(
    readonly phase: SeedFailurePhase,
    readonly status: SeedFailureStatus,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SeedExecutionError';
  }
}
