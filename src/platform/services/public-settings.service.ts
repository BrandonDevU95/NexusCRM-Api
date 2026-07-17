import { Injectable } from '@nestjs/common';
import { SystemSetting } from '../entities/system-setting.entity';
import { SystemSettingRepository } from '../repositories/system-setting.repository';

@Injectable()
export class PublicSettingsService {
  constructor(
    private readonly systemSettingRepository: SystemSettingRepository,
  ) {}

  findPublicSettings(): Promise<SystemSetting[]> {
    return this.systemSettingRepository.findPublic();
  }
}
