import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'sys_user' })
export class SysUserEntity {
  @PrimaryGeneratedColumn('increment', {
    comment: '用户id',
  })
  userId: number;

  @Column({
    length: 50,
    unique: true,
    comment: '用户账号',
  })
  userAccount: string;

  @Column({
    length: 50,
    comment: '用户名',
  })
  userName: string;

  @Column({
    length: 100,
    select: false, // 查询时默认不返回该字段
    comment: '密码hash',
  })
  passwordHash: string;

  @Column({
    default: true,
    comment: '账户激活状态',
  })
  isActive: boolean;

  @Column({
    nullable: true,
    comment: '头像URL地址',
  })
  avatarUrl?: string;

  @Column({
    type: 'datetime',
    nullable: true,
    comment: '最后登录时间',
  })
  lastLoginAt?: Date;

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
