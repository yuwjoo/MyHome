import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

@ApiSchema({ name: 'weather-GetCityWeatherListDto' })
export class GetCityWeatherListDto {
  @ApiProperty({
    description: '未来天数（0-6）',
  })
  @IsInt()
  @Min(0, {
    message: '未来天数最小值为0',
  })
  @Max(6, {
    message: '未来天数最大值为6',
  })
  @IsOptional()
  offsetDay?: number; // 未来天数
}
