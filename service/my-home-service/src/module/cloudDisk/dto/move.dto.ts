import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-MoveDto' })
export class MoveDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  path: string;

  @ApiProperty({
    description: '父级路径',
  })
  @IsString()
  parentPath: string;
}
