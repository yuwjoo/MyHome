import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JwtPayload } from 'src/types/jwt';
import { PostDto } from './dto/post.dto';
import { DeletePostDto } from './dto/deletePost.dto';
import { PaginationDataDto } from 'src/common/dto/pagination/paginationData.dto';
import { LikePostDto } from './dto/likePost.dto';
import { DeletePostCommentDto } from './dto/deletePostComment.dto';
import { CommentPostDto } from './dto/commentPost.dto';
import { MomentsCommentEntity } from './entities/momentsComment.entity';
import { MomentsPostEntity } from './entities/momentsPost.entity';
import { PaginationQueryDto } from 'src/common/dto/pagination/paginationQuery.dto';
import { plainToInstance } from 'class-transformer';
import { SysUserEntity } from '../system/module/auth/entities/sysUser.entity';
import { ModifyPostDto } from './dto/modifyPost.dto';
import { CreatePostDto } from './dto/createPost.dto';
import { OssService } from '../oss/oss.service';
import { runInTransaction } from 'typeorm-transactional';

@Injectable()
export class MomentsService {
  constructor(
    @InjectRepository(MomentsPostEntity)
    private postRepository: Repository<MomentsPostEntity>,
    @InjectRepository(MomentsCommentEntity)
    private commentRepository: Repository<MomentsCommentEntity>,
    @InjectRepository(SysUserEntity)
    private readonly sysUserRepository: Repository<SysUserEntity>,
    private readonly ossService: OssService,
    private readonly entityManager: EntityManager,
  ) {}

  /**
   * 创建说说
   * @param createPostDto 创建说说dto
   * @param user 用户信息
   * @return 说说数据
   */
  async createPost(
    createPostDto: CreatePostDto,
    user: JwtPayload,
  ): Promise<PostDto> {
    const post = this.postRepository.create({
      postContent: createPostDto.postContent,
      mediaUrls: createPostDto.mediaUrls,
      createUser: { userId: user.userId },
    });

    return runInTransaction(async () => {
      const saved = await this.postRepository.save(post);
      // 使用oss对象引用
      await this.ossService.batchUseFile(
        createPostDto.mediaUrls || [],
        'public',
      );

      return plainToInstance(PostDto, saved);
    });
  }

  /**
   * 删除说说
   * @param deletePostDto 删除说说dto
   * @param user 用户信息
   */
  async deletePost(
    deletePostDto: DeletePostDto,
    user: JwtPayload,
  ): Promise<void> {
    const post = await this.postRepository.findOne({
      where: { postId: deletePostDto.postId },
      relations: ['createUser'],
    });

    if (!post) {
      throw new BadRequestException('说说不存在');
    }
    if (post.createUser.userId !== user.userId) {
      throw new BadRequestException('无权限删除');
    }

    await runInTransaction(async () => {
      await this.postRepository.remove(post);
      // 删除oss对象引用
      await this.ossService.batchDeleteFile(post.mediaUrls || []);
    });
  }

  /**
   * 修改说说
   * @param modifyPostDto 修改说说dto
   * @param user 用户信息
   * @return 说说数据
   */
  async modifyPost(
    modifyPostDto: ModifyPostDto,
    user: JwtPayload,
  ): Promise<PostDto> {
    const post = await this.postRepository.findOne({
      where: { postId: modifyPostDto.postId },
      relations: ['createUser'],
    });

    if (!post) {
      throw new BadRequestException('说说不存在');
    }
    if (post.createUser.userId !== user.userId) {
      throw new BadRequestException('无权限修改');
    }

    return runInTransaction(async () => {
      const newPost = this.postRepository.create({
        ...post,
        postContent: modifyPostDto.postContent,
        mediaUrls: modifyPostDto.mediaUrls,
      });
      const updated = await this.postRepository.save(newPost);

      const originalMediaUrls = post.mediaUrls || [];
      const newMediaUrls = modifyPostDto.mediaUrls || [];
      const addMediaUrls = newMediaUrls.filter(
        (url) => !originalMediaUrls.includes(url),
      );
      const removeMediaUrls = originalMediaUrls.filter(
        (url) => !newMediaUrls.includes(url),
      );
      // 删除oss对象引用
      await this.ossService.batchDeleteFile(removeMediaUrls);
      // 使用oss对象引用
      await this.ossService.batchUseFile(addMediaUrls, 'public');

      return plainToInstance(PostDto, updated);
    });
  }

  /**
   * 获取说说列表
   * @param paginationQueryDto 分页参数
   * @return 说说数据列表
   */
  async getPostList(
    paginationQueryDto: PaginationQueryDto,
    user: JwtPayload,
  ): Promise<PaginationDataDto<PostDto>> {
    const { pageNum, pageSize, keywords } = paginationQueryDto;
    const { userId } = user;

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.createUser', 'createUser')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('post.likedUsers', 'likedUsers')
      .orderBy('post.createdAt', 'DESC');

    if (keywords) {
      query.andWhere('post.postContent LIKE :keywords', {
        keywords: `%${keywords}%`,
      });
    }

    const [list, total] = await query
      .skip((pageNum - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    const records = list.map((post) => {
      const dto = plainToInstance(PostDto, post);
      // 判断当前用户是否点赞
      dto.isLiked = post.likedUsers.some((u) => u.userId === userId);
      return dto;
    });

    return {
      pageNum,
      pageSize,
      total,
      records,
    };
  }

  /**
   * 点赞/取消点赞
   * @param likePostDto 点赞/取消点赞dto
   * @param user 用户信息
   */
  async likePost(likePostDto: LikePostDto, user: JwtPayload): Promise<void> {
    const { postId } = likePostDto;
    const { userId } = user;

    const post = await this.postRepository.findOne({
      where: { postId },
      relations: ['likedUsers'],
    });

    if (!post) {
      throw new BadRequestException('说说不存在');
    }

    if (likePostDto.isLike) {
      // 点赞
      const isLiked = post.likedUsers.some((u) => u.userId === userId);
      if (!isLiked) {
        post.likedUsers.push(this.sysUserRepository.create(user));
      }
    } else {
      // 取消点赞
      post.likedUsers = post.likedUsers.filter((u) => u.userId !== userId);
    }

    post.likeCount = post.likedUsers.length;

    await this.postRepository.save(post);
  }

  /**
   * 评论说说
   * @param commentPostDto 评论说说dto
   * @param user 用户信息
   * @return 说说数据
   */
  async commentPost(
    commentPostDto: CommentPostDto,
    user: JwtPayload,
  ): Promise<PostDto> {
    const post = await this.postRepository.findOneBy({
      postId: commentPostDto.postId,
    });
    if (!post) {
      throw new BadRequestException('说说不存在');
    }

    const comment = this.commentRepository.create({
      commentContent: commentPostDto.commentContent,
      post: { postId: commentPostDto.postId },
      createUser: { userId: user.userId },
    });

    await this.commentRepository.save(comment);

    const updatedPost = await this.postRepository.findOne({
      where: { postId: commentPostDto.postId },
      relations: ['createUser', 'comments'],
    });

    return plainToInstance(PostDto, updatedPost);
  }

  /**
   * 删除评论
   * @param deletePostCommentDto 删除评论dto
   * @param user 用户信息
   */
  async deletePostComment(
    deletePostCommentDto: DeletePostCommentDto,
    user: JwtPayload,
  ): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { commentId: deletePostCommentDto.commentId },
      relations: ['createUser'],
    });

    if (!comment) {
      throw new BadRequestException('评论不存在');
    }
    if (comment.createUser.userId !== user.userId) {
      throw new BadRequestException('无权限删除');
    }

    await this.commentRepository.remove(comment);
  }
}
