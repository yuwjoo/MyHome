import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-GetListDto' })
export class GetListDto {
  @ApiProperty({
    description: '文件父级路径',
  })
  @IsString()
  parentPath: string;
}
