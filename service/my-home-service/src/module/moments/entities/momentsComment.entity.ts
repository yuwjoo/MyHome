import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SysUserEntity } from 'src/module/system/module/auth/entities/sysUser.entity';
import { MomentsPostEntity } from './momentsPost.entity';

@Entity('moments_comment')
export class MomentsCommentEntity {
  @PrimaryGeneratedColumn('uuid', {
    comment: '评论id',
  })
  commentId: string;

  @Column({
    comment: '评论内容',
  })
  commentContent: string;

  @Column({
    default: 0,
    comment: '点赞数',
  })
  likeCount: number;

  @ManyToOne(() => SysUserEntity)
  @JoinColumn({ name: 'create_user_id' })
  createUser: SysUserEntity;

  @ManyToOne(() => MomentsPostEntity, (post) => post.comments)
  @JoinColumn({ name: 'post_id' })
  post: MomentsPostEntity;

  @CreateDateColumn({
    type: 'datetime',
    comment: '创建时间',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime',
    comment: '更新时间',
  })
  updatedAt: Date;
}
