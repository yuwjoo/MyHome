import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'oss-UploadCallbackDto' })
export class UploadCallbackDto {
  @ApiProperty({
    description: '文件哈希值',
  })
  @IsString()
  hash: string;

  @ApiProperty({
    description: '存储空间名称',
  })
  @IsString()
  bucket: string;

  @ApiProperty({
    description: '对象（文件）的完整路径',
  })
  @IsString()
  object: string;

  @ApiProperty({
    description: '文件大小（字节）',
  })
  @IsInt()
  size: number;

  @ApiProperty({
    description: '文件类型',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: '文件ETag',
  })
  @IsString()
  etag: string;

  @ApiProperty({
    description: '图片信息',
  })
  @IsString()
  @IsOptional()
  imageInfo?: string;
}
