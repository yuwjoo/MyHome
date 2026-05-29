import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { fileTypeEnum, FileTypeEnum } from '../entities/cloudDiskFile.entity';
import { Expose, Transform } from 'class-transformer';

@ApiSchema({ name: 'cloudDisk-FileItemDto' })
export class FileItemDto {
  @ApiProperty({
    description: '文件id',
  })
  fileId: string;

  @ApiProperty({
    description: '文件名称',
  })
  fileName: string;

  @ApiProperty({
    description: '文件大小（字节）',
  })
  fileSize?: number;

  @ApiProperty({
    description: 'MIME类型',
  })
  mimeType?: string;

  @ApiProperty({
    description: '文件类型',
    enum: fileTypeEnum,
  })
  fileType: FileTypeEnum;

  @ApiProperty({
    description: '文件路径',
  })
  filePath: string;

  @ApiProperty({
    description: '文件深度',
  })
  fileDepth: number;

  @ApiProperty({
    description: '父级路径',
  })
  parentPath: string;

  @ApiProperty({
    description: '创建时间戳',
  })
  @Expose({ name: 'createdAt' })
  @Transform(({ value }) => new Date(value).getTime())
  createdTime: number;

  @ApiProperty({
    description: '更新时间戳',
  })
  @Expose({ name: 'updatedAt' })
  @Transform(({ value }) => new Date(value).getTime())
  updatedTime: number;
}
