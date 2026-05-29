import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';
import { GetCityWeatherListDto } from './dto/getCityWeatherList.dto';
import { GetCityWeatherListResDto } from './dto/getCityWeatherListRes.dto';
import { GetWeatherDto } from './dto/getWeather.dto';
import { GetWeatherResDto } from './dto/getWeatherRes.dto';

@Injectable()
export class WeatherService {
  /**
   * 获取城市天气列表数据
   */
  async fetchWeatherMapList(
    getCityWeatherListDto: GetCityWeatherListDto,
  ): Promise<GetCityWeatherListResDto> {
    const day = (getCityWeatherListDto.offsetDay ?? 0) + 1;
    const res = await axios.get(
      `https://weather.cma.cn/api/map/weather/${day}`,
    );
    const data = res.data.data;
    if (res.data.code !== 0 || !data) {
      throw new BadRequestException(res.data.msg);
    }

    return {
      lastUpdate: data.lastUpdate,
      date: data.date,
      cityList: data.city.map((item: any) => ({
        stationid: item[0], // 站点id
        region: item[1], // 地区
        country: item[2], // 国家
        latitude: item[4], // 纬度
        longitude: item[5], // 经度
        high: item[6], // 最高温度
        dayText: item[7], // 白天天气描述
        dayCode: item[8], // 白天天气代码
        dayWindDirection: item[9], // 白天风向
        dayWindScale: item[10], // 白天风力
        low: item[11], // 最低温度
        nightText: item[12], // 夜晚天气描述
        nightCode: item[13], // 夜晚天气代码
        nightWindDirection: item[14], // 夜晚风向
        nightWindScale: item[15], // 夜晚风力
        areaNumber: item[17], // 行政区划代码
      })),
    };
  }

  /**
   * 获取天气数据
   */
  async fetchWeather(getWeatherDto: GetWeatherDto): Promise<GetWeatherResDto> {
    const res = await axios({
      url: 'http://weather.cma.cn/api/weather/view',
      method: 'get',
      params: {
        stationid: getWeatherDto.stationid,
      },
    });
    const data = res.data.data;
    if (res.data.code !== 0 || !data) {
      throw new BadRequestException(res.data.msg);
    }

    return {
      location: data.location,
      dailyWeatherList: data.daily,
      nowWeather: data.now,
      lastUpdate: data.lastUpdate,
    };
  }
}
