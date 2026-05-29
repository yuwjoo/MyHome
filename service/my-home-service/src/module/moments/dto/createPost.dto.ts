import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

@ApiSchema({ name: 'moments-CreatePostDto' })
export class CreatePostDto {
  @ApiProperty({
    description: '说说内容',
  })
  @IsString()
  postContent: string;

  @ApiProperty({
    description: '媒体文件URL数组',
    nullable: true,
  })
  @IsOptional()
  @IsString({ each: true })
  mediaUrls?: string[];
}
