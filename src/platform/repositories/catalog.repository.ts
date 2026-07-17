import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Catalog } from '../entities/catalog.entity';

@Injectable()
export class CatalogRepository {
  constructor(
    @InjectRepository(Catalog)
    private readonly repository: Repository<Catalog>,
  ) {}

  findAllGlobal(): Promise<Catalog[]> {
    return this.repository.find({
      where: { organizationId: IsNull() },
      relations: { options: true },
      order: {
        code: 'ASC',
        options: { sortOrder: 'ASC', code: 'ASC' },
      },
    });
  }

  findGlobalByCode(code: string): Promise<Catalog | null> {
    return this.repository.findOne({
      where: {
        code,
        organizationId: IsNull(),
      },
      relations: { options: true },
      order: { options: { sortOrder: 'ASC', code: 'ASC' } },
    });
  }
}
