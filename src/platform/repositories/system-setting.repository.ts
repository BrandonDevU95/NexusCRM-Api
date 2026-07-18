import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SystemSetting } from '../entities/system-setting.entity';

@Injectable()
export class SystemSettingRepository {
  constructor(
    @InjectRepository(SystemSetting)
    private readonly repository: Repository<SystemSetting>,
  ) {}

  findPublic(): Promise<SystemSetting[]> {
    return this.repository.find({
      where: { isPublic: true },
      order: { key: 'ASC' },
    });
  }
}
