import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { CreatePostDto } from './createPost.dto';

@ApiSchema({ name: 'moments-ModifyPostDto' })
export class ModifyPostDto extends CreatePostDto {
  @ApiProperty({
    description: '说说id',
  })
  @IsString()
  postId: string;
}
