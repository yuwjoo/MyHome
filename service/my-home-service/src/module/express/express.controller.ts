import { Controller, Get, Query } from '@nestjs/common';
import { ExpressService } from './express.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetExpressInfoDto } from './dto/getExpressInfo.dto';
import { GetExpressInfoResDto } from './dto/getExpressInfoRes.dto';
import { QueryCompanyByOrderNumberDto } from './dto/queryCompanyByOrderNumber.dto';
import { QueryCompanyByOrderNumberResDto } from './dto/queryCompanyByOrderNumberRes.dto';

@ApiTags('快递')
@Controller('express')
export class ExpressController {
  constructor(private readonly expressService: ExpressService) {}

  @ApiOperation({
    summary: '获取快递信息',
  })
  @Get('getExpressInfo')
  getExpressInfo(
    @Query() query: GetExpressInfoDto,
  ): Promise<GetExpressInfoResDto> {
    return this.expressService.getExpressInfo(query);
  }

  @ApiOperation({
    summary: '根据快递单号查询快递公司',
  })
  @Get('queryCompanyByOrderNumber')
  queryCompanyByOrderNumber(
    @Query() query: QueryCompanyByOrderNumberDto,
  ): Promise<QueryCompanyByOrderNumberResDto> {
    return this.expressService.queryCompanyByOrderNumber(query);
  }
}
