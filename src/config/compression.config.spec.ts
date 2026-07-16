import { createCompressionOptions } from './compression.config';

import type { Request, Response } from 'express';

describe('createCompressionOptions', () => {
  it('uses the validated performance settings', () => {
    const options = createCompressionOptions({
      compressionLevel: 4,
      compressionThresholdBytes: 2048,
    });

    expect(options.level).toBe(4);
    expect(options.threshold).toBe(2048);
    expect(options.filter).toBeDefined();
  });

  it.each([
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/event-stream',
  ])('excludes %s from compression', (contentType) => {
    const filter = createCompressionOptions({
      compressionLevel: 4,
      compressionThresholdBytes: 2048,
    }).filter;

    if (!filter) {
      throw new Error('Compression filter must be configured');
    }

    const request = {} as Request;
    const response = {
      getHeader: () => contentType,
    } as unknown as Response;

    expect(filter(request, response)).toBe(false);
  });
});
