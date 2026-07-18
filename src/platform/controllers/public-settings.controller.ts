import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';

import { PublicSettingResponseDto } from '../dto/public-setting-response.dto';
import { PublicSettingsService } from '../services/public-settings.service';

@ApiTags('settings')
@Controller('settings')
export class PublicSettingsController {
  constructor(private readonly publicSettingsService: PublicSettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'List public platform settings' })
  @ApiResponse({
    status: 200,
    description: 'Known public platform settings',
    type: PublicSettingResponseDto,
    isArray: true,
  })
  async findPublicSettings(): Promise<PublicSettingResponseDto[]> {
    const settings = await this.publicSettingsService.findPublicSettings();

    return settings.map((setting) => PublicSettingResponseDto.from(setting));
  }
}
