import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsPositive, IsString } from 'class-validator';

@ApiSchema({ name: 'cloudDisk-GetFileThumbnailDto' })
export class GetFileThumbnailDto {
  @ApiProperty({
    description: '文件路径',
  })
  @IsString()
  filePath: string;

  @ApiProperty({
    description: '图片宽度',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 128))
  @IsPositive()
  imageWidth: number;
}
