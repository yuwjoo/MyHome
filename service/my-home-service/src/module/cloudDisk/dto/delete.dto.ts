import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-DeleteDto' })
export class DeleteDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  path: string;
}
