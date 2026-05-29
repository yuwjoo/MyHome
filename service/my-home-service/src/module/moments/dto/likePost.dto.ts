import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

@ApiSchema({ name: 'moments-LikePostDto' })
export class LikePostDto {
  @ApiProperty({
    description: '说说id',
  })
  @IsString()
  postId: string;

  @ApiProperty({
    description: '是否点赞',
  })
  @IsBoolean()
  isLike: boolean;
}
