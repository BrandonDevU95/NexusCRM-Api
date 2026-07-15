import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';
import { HealthResponseDto } from './dto/health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Check application and database readiness' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready',
    type: HealthResponseDto,
  })
  @ApiResponse({ status: 503, description: 'Database is unavailable' })
  healthCheck() {
    return this.healthService.healthCheck();
  }
}
