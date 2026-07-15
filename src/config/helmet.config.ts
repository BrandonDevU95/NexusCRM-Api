import type { HelmetOptions } from 'helmet';

import type { NodeEnvironment } from './env.types';

function createContentSecurityPolicy(
  isProduction: boolean,
  allowSwaggerInlineAssets = false,
): NonNullable<HelmetOptions['contentSecurityPolicy']> {
  return {
    directives: {
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      ...(allowSwaggerInlineAssets
        ? {
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
          }
        : {}),
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  };
}

function createBaseHelmetOptions(environment: NodeEnvironment): HelmetOptions {
  const isProduction = environment === 'prod';

  return {
    contentSecurityPolicy: createContentSecurityPolicy(isProduction),
    referrerPolicy: {
      policy: 'no-referrer',
    },
    strictTransportSecurity: isProduction
      ? {
          maxAge: 31_536_000,
          includeSubDomains: true,
          preload: false,
        }
      : false,
    xFrameOptions: {
      action: 'deny',
    },
  };
}

export function createHelmetOptions(
  environment: NodeEnvironment,
): HelmetOptions {
  return createBaseHelmetOptions(environment);
}

export function createSwaggerHelmetOptions(
  environment: NodeEnvironment,
): HelmetOptions {
  const options = createBaseHelmetOptions(environment);

  return {
    ...options,
    contentSecurityPolicy: createContentSecurityPolicy(
      environment === 'prod',
      true,
    ),
  };
}
