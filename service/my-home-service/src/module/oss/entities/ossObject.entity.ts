import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('oss_object')
export class OssObjectEntity {
  @PrimaryGeneratedColumn('increment', {
    comment: 'object id',
  })
  objectId: number;

  @Column({
    type: 'varchar',
    length: 128,
    comment: 'bucket名称',
  })
  bucketKey: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'object名称',
  })
  objectKey: string;

  @Column({
    type: 'varchar',
    length: 128,
    comment: '文件hash',
  })
  fileHash: string;

  @Column({
    type: 'bigint',
    comment: '文件大小',
  })
  fileSize: number;

  @Column({
    type: 'varchar',
    length: 128,
    comment: '文件mime',
  })
  fileMime: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '文件eTag',
  })
  fileEtag: string;

  @Column({
    type: 'int',
    default: 0,
    comment: '引用次数',
  })
  refCount: number;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: '最后引用更新时间',
  })
  lastRefUpdatedAt: Date;

  @Column({
    type: 'tinyint',
    default: 0,
    comment: '是否受保护',
  })
  isProtected: boolean;

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
