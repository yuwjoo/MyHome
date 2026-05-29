import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'weather-GetWeatherResDto-Location' })
export class Location {
  @ApiProperty({
    description: '站点id',
  })
  id: string; // 站点id

  @ApiProperty({
    description: '地区名称',
  })
  name: string; // 地区名称

  @ApiProperty({
    description: '地区位置路径',
  })
  path: string; // 地区位置路径

  @ApiProperty({
    description: '经度',
  })
  longitude: number; // 经度

  @ApiProperty({
    description: '纬度',
  })
  latitude: number; // 纬度

  @ApiProperty({
    description: '时区',
  })
  timezone: number; // 时区
}

@ApiSchema({ name: 'weather-GetWeatherResDto-DailyWeather' })
export class DailyWeather {
  @ApiProperty({
    description: '日期',
  })
  date: string; // 日期

  @ApiProperty({
    description: '最高温度',
  })
  high: number; // 最高温度

  @ApiProperty({
    description: '白天天气描述',
  })
  dayText: string; // 白天天气描述

  @ApiProperty({
    description: '白天天气代码',
  })
  dayCode: number; // 白天天气代码

  @ApiProperty({
    description: '白天风向',
  })
  dayWindDirection: string; // 白天风向

  @ApiProperty({
    description: '白天风力',
  })
  dayWindScale: string; // 白天风力

  @ApiProperty({
    description: '最低温度',
  })
  low: number; // 最低温度

  @ApiProperty({
    description: '夜晚天气描述',
  })
  nightText: string; // 夜晚天气描述

  @ApiProperty({
    description: '夜晚天气代码',
  })
  nightCode: number; // 夜晚天气代码

  @ApiProperty({
    description: '夜晚风向',
  })
  nightWindDirection: string; // 夜晚风向

  @ApiProperty({
    description: '夜晚风力',
  })
  nightWindScale: string; // 夜晚风力
}

@ApiSchema({ name: 'weather-GetWeatherResDto-NowWeather' })
export class NowWeather {
  @ApiProperty({
    description: '降水量（mm）',
  })
  precipitation: number; // 降水量（mm）

  @ApiProperty({
    description: '气温（摄氏度）',
  })
  temperature: number; // 气温（摄氏度）

  @ApiProperty({
    description: '气压（hpa）',
  })
  pressure: number; // 气压（hpa）

  @ApiProperty({
    description: '相对湿度（%）',
  })
  humidity: number; // 相对湿度（%）

  @ApiProperty({
    description: '风向描述',
  })
  windDirection: string; // 风向描述

  @ApiProperty({
    description: '风向角度',
  })
  windDirectionDegree: number; // 风向角度

  @ApiProperty({
    description: '风速等级',
  })
  windSpeed: number; // 风速等级

  @ApiProperty({
    description: '风速等级描述',
  })
  windScale: string; // 风速等级描述

  @ApiProperty({
    description: '体感温度（摄氏度）',
  })
  feelst: number; // 体感温度（摄氏度）
}

@ApiSchema({ name: 'weather-GetWeatherResDto' })
export class GetWeatherResDto {
  @ApiProperty({
    description: '地区信息',
  })
  location: Location; // 地区信息

  @ApiProperty({
    description: '每日天气列表',
  })
  dailyWeatherList: DailyWeather[]; // 每日天气列表

  @ApiProperty({
    description: '当前天气',
  })
  nowWeather: NowWeather; // 当前天气

  @ApiProperty({
    description: '最后更新时间',
  })
  lastUpdate: string; // 最后更新时间
}
