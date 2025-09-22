import { Controller, Post, Body } from '@nestjs/common';
import { HuaShuanService } from './huaShuan.service';
import { HuaShuanDto } from './huaShuan.dto';

@Controller('ir/huaShuan')
export class HuaShuanController {
  constructor(private readonly huaShuanService: HuaShuanService) {}

  @Post('updateHuaShuanState')
  async updateHuaShuanState(@Body() huaShuanDto: HuaShuanDto) {
    return this.huaShuanService.updateState(huaShuanDto);
  }
}