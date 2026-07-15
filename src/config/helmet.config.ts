import type { HelmetOptions } from 'helmet';

import type { NodeEnvironment } from './env.types';

export function createHelmetOptions(
  environment: NodeEnvironment,
): HelmetOptions {
  const isProduction = environment === 'prod';

  return {
    contentSecurityPolicy: {
      directives: {
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
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
