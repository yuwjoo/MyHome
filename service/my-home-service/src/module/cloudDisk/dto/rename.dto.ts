import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-RenameDto' })
export class RenameDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  path: string;

  @ApiProperty({
    description: '新文件名称',
  })
  @IsString()
  newFileName: string;
}
