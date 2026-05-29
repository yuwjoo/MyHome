import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'moments-CommentPostDto' })
export class CommentPostDto {
  @ApiProperty({
    description: '说说id',
  })
  @IsString()
  postId: string;

  @ApiProperty({
    description: '评论内容',
  })
  @IsString()
  commentContent: string;
}
