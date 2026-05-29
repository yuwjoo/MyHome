import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ApiSchema({ name: 'moments-DeletePostDto' })
export class DeletePostDto {
  @ApiProperty({
    description: '说说id',
  })
  @IsString()
  postId: string;
}
