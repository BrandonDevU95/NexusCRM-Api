import { ApiProperty } from '@nestjs/swagger';

import type { PublicSystemSetting } from '../services/public-settings.service';
import {
  PUBLIC_SYSTEM_SETTING_KEYS,
  type SystemSettingKey,
} from '../services/system-setting.definitions';

export class PublicSettingResponseDto {
  @ApiProperty({
    enum: PUBLIC_SYSTEM_SETTING_KEYS,
    example: 'platform.default_language',
  })
  key!: SystemSettingKey;

  @ApiProperty({ example: 'es-MX', type: String })
  value!: string;

  @ApiProperty({
    example: 'Default locale used by public clients.',
    nullable: true,
    type: String,
  })
  description!: string | null;

  static from(setting: PublicSystemSetting): PublicSettingResponseDto {
    const response = new PublicSettingResponseDto();
    response.key = setting.key;
    response.value = setting.value;
    response.description = setting.description;

    return response;
  }
}
