import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-GetFileDownloadUrlDto' })
export class GetFileDownloadUrlDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  filePath: string;
}
