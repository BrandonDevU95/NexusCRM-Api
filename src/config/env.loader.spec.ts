import {
  getEnvironmentFile,
  SEED_ENVIRONMENT_FILE_VARIABLE,
} from './env.loader';

describe('getEnvironmentFile', () => {
  it('uses the allowlisted seed CLI override before NODE_ENV', () => {
    expect(
      getEnvironmentFile({
        NODE_ENV: 'dev',
        [SEED_ENVIRONMENT_FILE_VARIABLE]: '.env.test',
      }),
    ).toBe('.env.test');
  });

  it.each(['../.env', '.env.production', 'C:\\secrets\\.env'])(
    'rejects unsafe seed CLI override %s',
    (environmentFile) => {
      expect(() =>
        getEnvironmentFile({
          [SEED_ENVIRONMENT_FILE_VARIABLE]: environmentFile,
        }),
      ).toThrow('Invalid seed environment file override');
    },
  );

  it('keeps the regular NODE_ENV selection outside the seed CLI', () => {
    expect(getEnvironmentFile({ NODE_ENV: 'test' })).toBe('.env.test');
    expect(getEnvironmentFile({ NODE_ENV: 'dev' })).toBe('.env');
  });
});
