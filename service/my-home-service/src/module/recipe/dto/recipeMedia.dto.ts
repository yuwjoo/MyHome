import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'recipe-RecipeMediaDto' })
export class RecipeMediaDto {
  @ApiProperty({
    description: 'oss object引用id',
  })
  @IsString()
  refId: string;

  @ApiProperty({
    description: '媒体类型',
    enum: ['image', 'video'],
  })
  @IsIn(['image', 'video'])
  kind: 'image' | 'video';

  @ApiProperty({
    description: '原始文件名',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'MIME类型',
  })
  @IsString()
  mimeType: string;

  @ApiProperty({
    description: '文件大小（字节）',
  })
  @IsInt()
  size: number;

  @ApiProperty({
    description: '原始像素宽度',
    required: false,
  })
  @IsOptional()
  @IsInt()
  width?: number;

  @ApiProperty({
    description: '原始像素高度',
    required: false,
  })
  @IsOptional()
  @IsInt()
  height?: number;

  @ApiProperty({
    description: '视频时长（秒，仅视频）',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;
}
