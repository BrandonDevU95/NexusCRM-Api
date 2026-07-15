import {
  createHelmetOptions,
  createSwaggerHelmetOptions,
} from './helmet.config';

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

  it('limits inline asset exceptions to Swagger', () => {
    const defaultOptions = createHelmetOptions('dev');
    const swaggerOptions = createSwaggerHelmetOptions('dev');

    expect(defaultOptions.contentSecurityPolicy).not.toHaveProperty(
      'directives.scriptSrc',
    );
    expect(defaultOptions.contentSecurityPolicy).not.toHaveProperty(
      'directives.styleSrc',
    );
    expect(swaggerOptions.contentSecurityPolicy).toMatchObject({
      directives: {
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
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
