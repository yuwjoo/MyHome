import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { SysUserEntity } from 'src/module/system/module/auth/entities/sysUser.entity';
import { OssObjectRefEntity } from 'src/module/oss/entities/ossObjectRef.entity';

export type FileTypeEnum = (typeof fileTypeEnum)[number];
export const fileTypeEnum = ['directory', 'file'] as const;

@Entity('cloud_disk_file')
export class CloudDiskFileEntity {
  @PrimaryGeneratedColumn('uuid', {
    comment: '文件id',
  })
  fileId: string;

  @Column({
    comment: '文件名称',
  })
  fileName: string;

  @Column('bigint', {
    comment: '文件大小（字节）',
  })
  fileSize: number;

  @Column({
    nullable: true,
    comment: 'MIME类型',
  })
  mimeType?: string;

  @Column({
    type: 'enum',
    enum: fileTypeEnum,
    comment: '文件类型',
  })
  fileType: FileTypeEnum;

  @Column({
    comment: '文件路径',
  })
  filePath: string;

  @Column({
    comment: '文件深度',
  })
  fileDepth: number;

  @Column({
    comment: '父级路径',
  })
  parentPath: string;

  @Column({
    nullable: true,
    comment: 'oss object引用id',
  })
  ossObjectRefId?: string;

  @ManyToOne(() => OssObjectRefEntity, { nullable: true })
  @JoinColumn({ name: 'oss_object_ref_id' })
  ossObjectRef?: OssObjectRefEntity;

  @Column({
    comment: '创建用户id',
  })
  createUserId: number;

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

  @DeleteDateColumn({
    type: 'datetime',
    nullable: true,
    comment: '删除时间',
  })
  deletedAt?: Date;
}
