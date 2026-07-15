import { Inject, Injectable } from '@nestjs/common';

import { SeedRegistry } from './seed.registry';
import { SeedExecutorService } from './services/seed-executor.service';
import {
  type SeedDataKind,
  SeedExecutionError,
  type SeedOutput,
  SEED_OUTPUT,
} from './seed.types';

const ALLOWED_ENVIRONMENT_FILES = new Set(['.env', '.env.test']);
const USAGE = [
  'Usage:',
  '  pnpm seed:list',
  '  pnpm seed:run -- --env-file .env --module <name|all> --data-kind <reference|demo>',
].join('\n');

interface ParsedListCommand {
  command: 'list';
  environmentFile: string;
}

interface ParsedRunCommand {
  command: 'run';
  environmentFile: string;
  moduleName: string;
  dataKind: SeedDataKind;
}

type ParsedSeedCommand = ParsedListCommand | ParsedRunCommand;

interface ParsedOptions {
  command?: string;
  environmentFile?: string;
  moduleName?: string;
  dataKind?: string;
}

export function getSeedEnvironmentFile(arguments_: readonly string[]): string {
  const parsed = parseOptions(arguments_);
  return parsed.environmentFile ?? '.env';
}

@Injectable()
export class SeedRunner {
  constructor(
    private readonly registry: SeedRegistry,
    private readonly executor: SeedExecutorService,
    @Inject(SEED_OUTPUT) private readonly output: SeedOutput,
  ) {}

  async run(arguments_: readonly string[]): Promise<number> {
    try {
      const command = parseCommand(arguments_);

      if (command.command === 'list') {
        this.listRegistry();
        return 0;
      }

      const result = await this.executor.execute({
        moduleName: command.moduleName,
        dataKind: command.dataKind,
      });
      this.output.info(
        `Modules: ${result.modules.length > 0 ? result.modules.join(' -> ') : '(none)'}`,
      );
      this.output.info(
        `Metrics: inserted=${result.totals.inserted} updated=${result.totals.updated} skipped=${result.totals.skipped} total=${result.totals.inserted + result.totals.updated + result.totals.skipped}`,
      );
      this.output.info(
        `Duration: ${result.durationMs}ms; status=${result.status}`,
      );
      return 0;
    } catch (error) {
      if (error instanceof SeedExecutionError) {
        this.output.error(
          `Seed failed: phase=${error.phase} status=${error.status}; ${error.message}`,
        );
        if (error.phase === 'arguments') {
          this.output.error(USAGE);
        }
        return 1;
      }

      this.output.error(
        'Seed failed unexpectedly. Review the application logs for technical details.',
      );
      return 1;
    }
  }

  private listRegistry(): void {
    const seeders = this.registry.list();

    if (seeders.length === 0) {
      this.output.info(
        'No seed modules are registered. The first module will be added after its domain schema is stable.',
      );
      return;
    }

    for (const seeder of seeders) {
      this.output.info(
        `name=${seeder.name} dataKinds=${seeder.dataKinds.join(',')} dependencies=${seeder.dependencies.length > 0 ? seeder.dependencies.join(',') : '(none)'} status=registered`,
      );
    }
  }
}

function parseCommand(arguments_: readonly string[]): ParsedSeedCommand {
  const parsed = parseOptions(arguments_);
  const environmentFile = parsed.environmentFile ?? '.env';

  if (parsed.command === 'list') {
    if (parsed.moduleName !== undefined || parsed.dataKind !== undefined) {
      throw invalidArguments('seed:list does not accept module or data kind.');
    }
    return { command: 'list', environmentFile };
  }

  if (parsed.command !== 'run') {
    throw invalidArguments('Expected command "list" or "run".');
  }

  if (parsed.moduleName === undefined) {
    throw invalidArguments('seed:run requires --module <name|all>.');
  }
  if (!/^(?:all|[a-z][a-z0-9-]*)$/.test(parsed.moduleName)) {
    throw invalidArguments('Invalid --module value.');
  }
  if (parsed.dataKind !== 'reference' && parsed.dataKind !== 'demo') {
    throw invalidArguments('seed:run requires --data-kind <reference|demo>.');
  }

  return {
    command: 'run',
    environmentFile,
    moduleName: parsed.moduleName,
    dataKind: parsed.dataKind,
  };
}

function parseOptions(arguments_: readonly string[]): ParsedOptions {
  const parsed: ParsedOptions = {};

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--') {
      continue;
    }

    if (!argument.startsWith('--')) {
      if (parsed.command !== undefined) {
        throw invalidArguments(`Unexpected argument "${argument}".`);
      }
      parsed.command = argument;
      continue;
    }

    const equalsIndex = argument.indexOf('=');
    const option =
      equalsIndex === -1 ? argument : argument.slice(0, equalsIndex);
    const inlineValue =
      equalsIndex === -1 ? undefined : argument.slice(equalsIndex + 1);
    let value = inlineValue;
    if (value === undefined) {
      value = arguments_[index + 1];
      if (value === undefined || value.startsWith('--')) {
        throw invalidArguments(`Missing value for ${option}.`);
      }
      index += 1;
    }

    switch (option) {
      case '--env-file':
        setOptionOnce(parsed, 'environmentFile', value, option);
        assertAllowedEnvironmentFile(value);
        break;
      case '--module':
        setOptionOnce(parsed, 'moduleName', value, option);
        break;
      case '--data-kind':
        setOptionOnce(parsed, 'dataKind', value, option);
        break;
      default:
        throw invalidArguments(`Unknown option "${option}".`);
    }
  }

  return parsed;
}

function setOptionOnce(
  parsed: ParsedOptions,
  key: keyof Omit<ParsedOptions, 'command'>,
  value: string,
  option: string,
): void {
  if (parsed[key] !== undefined) {
    throw invalidArguments(`Option ${option} may only be provided once.`);
  }
  parsed[key] = value;
}

function assertAllowedEnvironmentFile(environmentFile: string): void {
  if (!ALLOWED_ENVIRONMENT_FILES.has(environmentFile)) {
    throw invalidArguments(
      '--env-file only accepts the relative files .env or .env.test.',
    );
  }
}

function invalidArguments(message: string): SeedExecutionError {
  return new SeedExecutionError('arguments', 'not_started', message);
}
