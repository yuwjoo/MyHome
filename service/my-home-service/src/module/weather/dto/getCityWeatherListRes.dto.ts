import { ApiProperty, ApiSchema } from '@nestjs/swagger';

@ApiSchema({ name: 'weather-GetCityWeatherListResDto-City' })
export class City {
  @ApiProperty({
    description: '站点id',
  })
  stationid: string; // 站点id

  @ApiProperty({
    description: '地区',
  })
  region: string; // 地区

  @ApiProperty({
    description: '国家',
  })
  country: string; // 国家

  @ApiProperty({
    description: '纬度',
  })
  latitude: number; // 纬度

  @ApiProperty({
    description: '经度',
  })
  longitude: number; // 经度

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

  @ApiProperty({
    description: '行政区划代码',
  })
  areaNumber: string; // 行政区划代码
}

@ApiSchema({ name: 'weather-GetCityWeatherListResDto' })
export class GetCityWeatherListResDto {
  @ApiProperty({
    description: '城市列表',
  })
  cityList: City[]; // 城市列表

  @ApiProperty({
    description: '天气时间',
  })
  date: string; // 天气时间

  @ApiProperty({
    description: '最后更新时间',
  })
  lastUpdate: string; // 最后更新时间
}
