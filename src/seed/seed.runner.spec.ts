import { SeedRegistry } from './seed.registry';
import { getSeedEnvironmentFile, SeedRunner } from './seed.runner';
import type { SeedExecutorService } from './services/seed-executor.service';
import {
  SeedExecutionError,
  type SeedOutput,
  type SeedRunResult,
} from './seed.types';

function outputDouble(): SeedOutput & {
  info: jest.Mock;
  error: jest.Mock;
} {
  return { info: jest.fn(), error: jest.fn() };
}

describe('getSeedEnvironmentFile', () => {
  it.each(['.env', '.env.test'])('accepts allowlisted file %s', (file) => {
    expect(getSeedEnvironmentFile(['run', '--env-file', file])).toBe(file);
  });

  it('defaults to .env', () => {
    expect(getSeedEnvironmentFile(['list'])).toBe('.env');
  });

  it.each(['../.env', 'C:\\secrets\\.env', '/tmp/.env', '.env.production'])(
    'rejects non-allowlisted path %s',
    (file) => {
      expect(() => getSeedEnvironmentFile(['run', '--env-file', file])).toThrow(
        '--env-file only accepts',
      );
    },
  );
});

describe('SeedRunner', () => {
  it('reports an empty registry as a successful explicit result', async () => {
    const output = outputDouble();
    const execute = jest.fn();
    const executor = { execute } as unknown as SeedExecutorService;
    const runner = new SeedRunner(new SeedRegistry(), executor, output);

    await expect(runner.run(['list'])).resolves.toBe(0);
    expect(output.info).toHaveBeenCalledWith(
      expect.stringContaining('No seed modules are registered'),
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('requires an explicit module and data kind for run', async () => {
    const output = outputDouble();
    const execute = jest.fn();
    const executor = { execute } as unknown as SeedExecutorService;
    const runner = new SeedRunner(new SeedRegistry(), executor, output);

    await expect(runner.run(['run', '--data-kind', 'reference'])).resolves.toBe(
      1,
    );
    expect(output.error).toHaveBeenCalledWith(
      expect.stringContaining('requires --module'),
    );
    expect(output.error).toHaveBeenCalledWith(
      expect.stringContaining('Usage:'),
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('delegates a valid run and reports zero totals', async () => {
    const output = outputDouble();
    const result: SeedRunResult = {
      environment: 'test',
      databaseName: 'nexuscrm_test',
      dataKind: 'demo',
      randomSeed: 42,
      modules: [],
      moduleResults: [],
      totals: { inserted: 0, updated: 0, skipped: 0 },
      durationMs: 3,
      status: 'committed',
    };
    const execute = jest.fn().mockResolvedValue(result);
    const executor = { execute } as unknown as SeedExecutorService;
    const runner = new SeedRunner(new SeedRegistry(), executor, output);

    await expect(
      runner.run(['run', '--module', 'all', '--data-kind', 'demo']),
    ).resolves.toBe(0);
    expect(execute).toHaveBeenCalledWith({
      moduleName: 'all',
      dataKind: 'demo',
    });
    expect(output.info).toHaveBeenCalledWith('Modules: (none)');
    expect(output.info).toHaveBeenCalledWith(
      'Metrics: inserted=0 updated=0 skipped=0 total=0',
    );
  });

  it('reports expected executor failures without a stack trace', async () => {
    const output = outputDouble();
    const executor = {
      execute: jest
        .fn()
        .mockRejectedValue(
          new SeedExecutionError(
            'migrations',
            'not_started',
            'Pending migrations detected.',
          ),
        ),
    } as unknown as SeedExecutorService;
    const runner = new SeedRunner(new SeedRegistry(), executor, output);

    await expect(
      runner.run(['run', '--module', 'all', '--data-kind', 'reference']),
    ).resolves.toBe(1);
    expect(output.error).toHaveBeenCalledWith(
      'Seed failed: phase=migrations status=not_started; Pending migrations detected.',
    );
  });
});
