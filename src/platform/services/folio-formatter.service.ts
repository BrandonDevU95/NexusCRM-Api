import { Injectable } from '@nestjs/common';

@Injectable()
export class FolioFormatterService {
  format(prefix: string, nextValue: string, padding: number): string {
    return `${prefix}${nextValue.padStart(padding, '0')}`;
  }
}
