import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

@ApiSchema({ name: 'oss-UploadFileDto' })
export class UploadFileDto {
  @ApiProperty({
    description: '文件名称',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: '文件哈希值',
  })
  @IsString()
  fileHash: string;

  @ApiProperty({
    description: '文件大小',
  })
  @IsInt()
  fileSize: number;

  @ApiProperty({
    description: '文件类型',
  })
  @IsString()
  fileMime: string;
}
