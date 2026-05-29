import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCityWeatherListDto } from './dto/getCityWeatherList.dto';
import { GetCityWeatherListResDto } from './dto/getCityWeatherListRes.dto';
import { GetWeatherDto } from './dto/getWeather.dto';
import { GetWeatherResDto } from './dto/getWeatherRes.dto';

@ApiTags('天气')
@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @ApiOperation({
    summary: '获取城市天气列表',
  })
  @Get('getCityWeatherList')
  getCityWeatherList(
    @Query() query: GetCityWeatherListDto,
  ): Promise<GetCityWeatherListResDto> {
    return this.weatherService.fetchWeatherMapList(query);
  }

  @ApiOperation({
    summary: '获取天气',
  })
  @Get('getWeather')
  getWeather(@Query() query: GetWeatherDto): Promise<GetWeatherResDto> {
    return this.weatherService.fetchWeather(query);
  }
}
