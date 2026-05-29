import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { fileTypeEnum, FileTypeEnum } from '../entities/cloudDiskFile.entity';

@ApiSchema({ name: 'cloudDisk-CreateDto' })
export class CreateDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  path: string;

  @ApiProperty({
    description: '文件类型',
    enum: fileTypeEnum,
  })
  @IsEnum(fileTypeEnum)
  type: FileTypeEnum;

  @ApiProperty({
    description: 'oss对象引用id',
  })
  @IsOptional()
  @IsString()
  ossObjectRefId?: string;
}
