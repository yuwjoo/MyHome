import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'weather-GetWeatherDto' })
export class GetWeatherDto {
  @ApiProperty({
    description: '站点id',
  })
  @IsString()
  @IsOptional()
  stationid?: string; // 站点id
}
