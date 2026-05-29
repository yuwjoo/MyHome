import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsPositive, IsString } from 'class-validator';

@ApiSchema({ name: 'oss-GetFileThumbnailDto' })
export class GetFileThumbnailDto {
  @ApiProperty({
    description: 'oss object引用id',
  })
  @IsString()
  ossObjectRefId: string;

  @ApiProperty({
    description: '图片宽度',
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : 128))
  @IsPositive()
  imageWidth: number;
}
