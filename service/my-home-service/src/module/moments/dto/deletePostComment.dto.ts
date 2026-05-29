import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'moments-DeletePostCommentDto' })
export class DeletePostCommentDto {
  @ApiProperty({
    description: '评论id',
  })
  @IsString()
  commentId: string;
}
