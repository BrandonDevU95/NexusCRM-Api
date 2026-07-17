import { Catalog } from '../entities/catalog.entity';
import { CatalogRepository } from '../repositories/catalog.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CatalogsService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  findAllGlobal(): Promise<Catalog[]> {
    return this.catalogRepository.findAllGlobal();
  }

  findGlobalByCode(code: string): Promise<Catalog | null> {
    return this.catalogRepository.findGlobalByCode(code);
  }
}
