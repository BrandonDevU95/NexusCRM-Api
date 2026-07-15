import { createHelmetOptions } from './helmet.config';

describe('createHelmetOptions', () => {
  it('does not force HTTPS outside production', () => {
    const options = createHelmetOptions('dev');

    expect(options.strictTransportSecurity).toBe(false);
    expect(options.contentSecurityPolicy).toMatchObject({
      directives: {
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: null,
      },
    });
  });

  it('enforces HTTPS protections in production', () => {
    const options = createHelmetOptions('prod');

    expect(options.strictTransportSecurity).toEqual({
      maxAge: 31_536_000,
      includeSubDomains: true,
      preload: false,
    });
    expect(options.contentSecurityPolicy).toMatchObject({
      directives: {
        upgradeInsecureRequests: [],
      },
    });
  });
});
