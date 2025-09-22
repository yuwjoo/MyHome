import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class HuaShuan {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: false })
  temperature: number; // 空调温度

  @Column({ type: 'boolean', nullable: false })
  isCooling: boolean; // 是否制冷

  @Column({ type: 'boolean', nullable: false })
  isHeating: boolean; // 是否制热

  @Column({ type: 'int', nullable: false })
  windSpeed: number; // 风速

  @Column({ type: 'boolean', nullable: false })
  isSwinging: boolean; // 是否摆风

  @Column({ type: 'bigint', nullable: false })
  timerTimestamp: number; // 定时时间戳

  @Column({ type: 'int', nullable: false })
  timerDuration: number; // 定时时长（分钟）

  @Column({ type: 'bigint', nullable: false, unique: true })
  requestTimestamp: number; // 请求时间戳（唯一，用于判断最新记录）

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}