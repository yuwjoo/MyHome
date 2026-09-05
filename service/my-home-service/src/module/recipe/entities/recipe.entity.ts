import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SysUserEntity } from 'src/module/system/module/auth/entities/sysUser.entity';

/**
 * 媒体类型
 */
export type RecipeMediaKind = 'image' | 'video';

/**
 * 菜谱媒体存储结构（与菜谱 web 端 RecipeMedia 对齐）
 * - 真实文件在 OSS，通过 refId 关联 oss_object_ref 引用
 */
export interface RecipeMediaStorage {
  /** oss object引用id */
  refId: string;
  /** 媒体类型：image/video */
  kind: RecipeMediaKind;
  /** 原始文件名（展示用） */
  name: string;
  /** MIME 类型 */
  mimeType: string;
  /** 文件大小（字节） */
  size: number;
  /** 原始像素宽度 */
  width?: number;
  /** 原始像素高度 */
  height?: number;
  /** 视频时长（秒，仅视频） */
  duration?: number;
}

@Entity('recipe')
export class RecipeEntity {
  @PrimaryGeneratedColumn('uuid', {
    comment: '菜谱id',
  })
  recipeId: string;

  @Column({
    length: 100,
    comment: '菜谱名称',
  })
  recipeName: string;

  @Column({
    length: 1000,
    nullable: true,
    comment: '备注说明',
  })
  note?: string;

  @Column('json', {
    nullable: true,
    comment: '媒体元信息数组',
  })
  medias?: RecipeMediaStorage[];

  @ManyToOne(() => SysUserEntity)
  @JoinColumn({ name: 'create_user_id' })
  createUser: SysUserEntity;

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
