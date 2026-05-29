import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-GetInfoDto' })
export class GetInfoDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  path: string;
}
