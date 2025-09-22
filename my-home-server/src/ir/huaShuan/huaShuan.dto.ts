import { IsInt, IsBoolean, IsPositive, Min, Max } from 'class-validator';

export class HuaShuanDto {
  @IsInt()
  @Min(16)
  @Max(30)
  temperature: number; // 空调温度，范围通常在16-30度之间

  @IsBoolean()
  isCooling: boolean; // 是否制冷

  @IsBoolean()
  isHeating: boolean; // 是否制热

  @IsInt()
  @Min(0)
  @Max(3) // 假设0表示自动，1-3表示低中高风速
  windSpeed: number; // 风速

  @IsBoolean()
  isSwinging: boolean; // 是否摆风

  @IsInt()
  @IsPositive()
  timerTimestamp: number; // 定时时间戳

  @IsInt()
  @Min(0)
  @Max(24 * 60) // 最大定时24小时
  timerDuration: number; // 定时时长（分钟）

  @IsInt()
  @IsPositive()
  requestTimestamp: number; // 请求时间戳
}