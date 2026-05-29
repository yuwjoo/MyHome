import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OssObjectEntity } from './ossObject.entity';

export type RefTypeEnum = (typeof refTypeEnum)[number];
export const refTypeEnum = ['cloudDisk', 'public', 'unknown'] as const;

@Entity('oss_object_ref')
export class OssObjectRefEntity {
  @PrimaryGeneratedColumn('uuid', {
    comment: '引用id',
  })
  refId: string;

  @Column({
    comment: 'object id',
  })
  ossObjectId: string;

  @ManyToOne(() => OssObjectEntity)
  @JoinColumn({ name: 'oss_object_id' })
  ossObject: OssObjectEntity;

  @Column({
    type: 'enum',
    enum: refTypeEnum,
    default: 'unknown',
    comment: '引用类型',
  })
  refType: RefTypeEnum;

  @Column({
    type: 'tinyint',
    default: 0,
    comment: '是否被使用',
  })
  isUsed: boolean;

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
