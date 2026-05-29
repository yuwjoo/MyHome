import { BadRequestException, Injectable } from '@nestjs/common';
import { GetExpressInfoDto } from './dto/getExpressInfo.dto';
import axios from 'axios';
import { GetExpressInfoResDto } from './dto/getExpressInfoRes.dto';
import { QueryCompanyByOrderNumberDto } from './dto/queryCompanyByOrderNumber.dto';
import { QueryCompanyByOrderNumberResDto } from './dto/queryCompanyByOrderNumberRes.dto';

@Injectable()
export class ExpressService {
  /**
   * 获取快递信息
   */
  async getExpressInfo(
    getExpressInfoDto: GetExpressInfoDto,
  ): Promise<GetExpressInfoResDto> {
    const res = await axios({
      url: 'https://api.huiniao.top/interface/third/kuaidi',
      method: 'post',
      data: {
        num: getExpressInfoDto.orderNumber,
        phone: getExpressInfoDto.phoneNumber,
      },
    });
    const data = res.data.data;

    if (res.data.code !== 1 || !data) {
      throw new BadRequestException(res.data.info);
    }

    return {
      materialRecordList: data.list,
      company: data.company,
    };
  }

  /**
   * 根据快递单号查询快递公司
   */
  async queryCompanyByOrderNumber(
    queryCompanyByOrderNumberDto: QueryCompanyByOrderNumberDto,
  ): Promise<QueryCompanyByOrderNumberResDto> {
    const res = await axios({
      url: 'https://alayn.baidu.com/express/appdetail/get_com',
      method: 'get',
      params: {
        num: queryCompanyByOrderNumberDto.orderNumber,
      },
    });
    const data = res.data.data;

    if (res.data.code !== 0 || !data) {
      throw new BadRequestException(res.data.message);
    }

    return {
      company: data.company,
    };
  }
}
