import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  JoinTable,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SysUserEntity } from 'src/module/system/module/auth/entities/sysUser.entity';
import { MomentsCommentEntity } from './momentsComment.entity';

@Entity('moments_post')
export class MomentsPostEntity {
  @PrimaryGeneratedColumn('uuid', {
    comment: '说说id',
  })
  postId: string;

  @Column({
    comment: '说说内容',
  })
  postContent: string;

  @Column('json', {
    nullable: true,
    comment: '媒体文件URL数组',
  })
  mediaUrls?: string[];

  @Column({
    default: 0,
    comment: '点赞数',
  })
  likeCount: number;

  @ManyToMany(() => SysUserEntity)
  @JoinTable({
    name: 'moments_post_like',
    joinColumn: { name: 'post_id', referencedColumnName: 'postId' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'userId' },
  })
  likedUsers: SysUserEntity[];

  @ManyToOne(() => SysUserEntity)
  @JoinColumn({ name: 'create_user_id' })
  createUser: SysUserEntity;

  @OneToMany(() => MomentsCommentEntity, (comment) => comment.post)
  comments: MomentsCommentEntity[];

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
