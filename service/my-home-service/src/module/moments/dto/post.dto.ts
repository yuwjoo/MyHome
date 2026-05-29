import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

@ApiSchema({ name: 'moments-CreateUserDto' })
export class CreateUserDto {
  @ApiProperty({
    description: '用户账号',
  })
  userAccount: string;

  @ApiProperty({
    description: '用户名称',
  })
  userName: string;
}

@ApiSchema({ name: 'moments-CommentDto' })
export class CommentDto {
  @ApiProperty({
    description: '评论内容',
  })
  commentContent: string;

  @ApiProperty({
    description: '评论点赞数',
  })
  likeCount: number;
}

@ApiSchema({ name: 'moments-PostDto' })
export class PostDto {
  @ApiProperty({
    description: '说说id',
  })
  postId: string;

  @ApiProperty({
    description: '说说内容',
  })
  postContent: string;

  @ApiProperty({
    description: '媒体文件URL数组',
    nullable: true,
  })
  mediaUrls?: string[];

  @ApiProperty({
    description: '点赞数',
  })
  likeCount: number;

  @ApiProperty({
    description: '是否点过赞',
  })
  isLiked: boolean;

  @ApiProperty({
    description: '创建时间戳',
  })
  @Expose({ name: 'createdAt' })
  @Transform(({ value }) => new Date(value).getTime())
  createdTime: number;

  @ApiProperty({
    description: '更新时间戳',
  })
  @Expose({ name: 'updatedAt' })
  @Transform(({ value }) => new Date(value).getTime())
  updatedTime: number;

  @ApiProperty({
    description: '创建用户信息',
  })
  createUser: CreateUserDto;

  @ApiProperty({
    description: '评论列表',
  })
  comments: CommentDto[];
}
