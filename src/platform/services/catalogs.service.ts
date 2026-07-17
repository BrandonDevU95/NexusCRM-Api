import { Injectable } from '@nestjs/common';

import { Catalog } from '../entities/catalog.entity';
import { CatalogRepository } from '../repositories/catalog.repository';
import { isValidCode, normalizeCode } from './platform-input.validator';

@Injectable()
export class CatalogsService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  findAllGlobal(): Promise<Catalog[]> {
    return this.catalogRepository.findAllGlobal();
  }

  async findGlobalByCode(code: string): Promise<Catalog | null> {
    const normalizedCode = normalizeCode(code);

    if (!isValidCode(normalizedCode)) {
      return null;
    }

    return this.catalogRepository.findGlobalByCode(normalizedCode);
  }
}
