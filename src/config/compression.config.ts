import compression from 'compression';

import type { CompressionOptions } from 'compression';
import type { Request, Response } from 'express';

import type { AppConfig } from './env.types';

type CompressionConfig = Pick<
  AppConfig['app'],
  'compressionLevel' | 'compressionThresholdBytes'
>;

const excludedContentTypes = [
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/event-stream',
];

function isExcludedContentType(contentType: string): boolean {
  const normalizedContentType = contentType.toLowerCase();

  return excludedContentTypes.some((excludedContentType) =>
    normalizedContentType.includes(excludedContentType),
  );
}

function shouldCompress(request: Request, response: Response): boolean {
  const contentType = response.getHeader('Content-Type');

  if (typeof contentType === 'string' && isExcludedContentType(contentType)) {
    return false;
  }

  return compression.filter(request, response);
}

export function createCompressionOptions(
  config: CompressionConfig,
): CompressionOptions {
  return {
    filter: shouldCompress,
    level: config.compressionLevel,
    threshold: config.compressionThresholdBytes,
  };
}
