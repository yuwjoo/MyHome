import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MomentsService } from './moments.service';
import { PostDto } from './dto/post.dto';
import { User } from 'src/common/decorators/user.decorator';
import { JwtPayload } from 'src/types/jwt';
import { DeletePostDto } from './dto/deletePost.dto';
import { PaginationQueryDto } from 'src/common/dto/pagination/paginationQuery.dto';
import { PaginationDataDto } from 'src/common/dto/pagination/paginationData.dto';
import { LikePostDto } from './dto/likePost.dto';
import { CommentPostDto } from './dto/commentPost.dto';
import { DeletePostCommentDto } from './dto/deletePostComment.dto';
import { SavePostDto } from './dto/savePost.dto';
import { ModifyPostDto } from './dto/modifyPost.dto';

@ApiTags('朋友圈')
@Controller('moments')
export class MomentsController {
  constructor(private readonly momentsService: MomentsService) {}

  @ApiOperation({
    summary: '保存说说',
  })
  @Post('savePost')
  savePost(
    @Body() savePostDto: SavePostDto,
    @User() user: JwtPayload,
  ): Promise<PostDto> {
    if (savePostDto.postId) {
      return this.momentsService.modifyPost(savePostDto as ModifyPostDto, user);
    } else {
      return this.momentsService.createPost(savePostDto, user);
    }
  }

  @ApiOperation({
    summary: '删除说说',
  })
  @Post('deletePost')
  deletePost(
    @Body() deletePostDto: DeletePostDto,
    @User() user: JwtPayload,
  ): Promise<void> {
    return this.momentsService.deletePost(deletePostDto, user);
  }

  @ApiOperation({
    summary: '获取说说列表',
  })
  @Get('getPostList')
  getPostList(
    @Query() paginationQueryDto: PaginationQueryDto,
    @User() user: JwtPayload,
  ): Promise<PaginationDataDto<PostDto>> {
    return this.momentsService.getPostList(paginationQueryDto, user);
  }

  @ApiOperation({
    summary: '点赞/取消点赞说说',
  })
  @Post('likePost')
  likePost(
    @Body() likePostDto: LikePostDto,
    @User() user: JwtPayload,
  ): Promise<void> {
    return this.momentsService.likePost(likePostDto, user);
  }

  @ApiOperation({
    summary: '评论说说',
  })
  @Post('commentPost')
  commentPost(
    @Body() commentPostDto: CommentPostDto,
    @User() user: JwtPayload,
  ): Promise<PostDto> {
    return this.momentsService.commentPost(commentPostDto, user);
  }

  @ApiOperation({
    summary: '删除评论',
  })
  @Post('deletePostComment')
  deletePostComment(
    @Body() deletePostCommentDto: DeletePostCommentDto,
    @User() user: JwtPayload,
  ): Promise<void> {
    return this.momentsService.deletePostComment(deletePostCommentDto, user);
  }
}
