import { Injectable } from '@nestjs/common';

import { SystemSettingRepository } from '../repositories/system-setting.repository';
import type { SystemSettingKey } from './system-setting.definitions';
import {
  isPublicSystemSettingKey,
  isValidSystemSettingValue,
} from './platform-input.validator';

export interface PublicSystemSetting {
  key: SystemSettingKey;
  value: string;
  description: string | null;
}

@Injectable()
export class PublicSettingsService {
  constructor(
    private readonly systemSettingRepository: SystemSettingRepository,
  ) {}

  async findPublicSettings(): Promise<PublicSystemSetting[]> {
    const settings = await this.systemSettingRepository.findPublic();

    return settings.flatMap((setting) => {
      if (
        !setting.isPublic ||
        !isPublicSystemSettingKey(setting.key) ||
        !isValidSystemSettingValue(setting.key, setting.value) ||
        typeof setting.value !== 'string'
      ) {
        return [];
      }

      return [
        {
          key: setting.key,
          value: setting.value,
          description: setting.description,
        },
      ];
    });
  }
}
