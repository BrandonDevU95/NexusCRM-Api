import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok' })
  status!: 'ok';

  @ApiProperty({ example: 'nexuscrm-api' })
  service!: string;

  @ApiProperty({ example: '0.0.1' })
  version!: string;

  @ApiProperty({ example: '2026-07-15T12:00:00.000Z', format: 'date-time' })
  timestamp!: string;

  @ApiProperty({ example: 'up' })
  database!: string;
}
