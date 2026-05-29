import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Post,
  Query,
  Req,
  Request,
  Res,
} from '@nestjs/common';
import { OssService } from './oss.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UploadCallbackDto } from './dto/uploadCallback.dto';
import { verifyUploadCallback } from './utils/verifyUploadCallback';
import aliyunConfig, { AliyunConfig } from 'src/config/aliyun.config';
import { Public } from 'src/common/decorators/public.decorator';
import { UploadFileDto } from './dto/uploadFile.dto';
import { UploadFileResDto } from './dto/uploadFileRes.dto';
import { GetFileThumbnailDto } from './dto/getFileThumbnail.dto';
import { GetFileDownloadUrlDto } from './dto/getFileDownloadUrl.dto';

@ApiTags('oss')
@Controller('oss')
export class OssController {
  constructor(
    private readonly ossService: OssService,
    @Inject(aliyunConfig.KEY)
    private readonly aliyunConfig: AliyunConfig,
  ) {}

  @ApiOperation({
    summary: 'oss上传回调',
  })
  @Public()
  @Post('uploadCallback')
  async uploadCallback(
    @Body() body: UploadCallbackDto,
    @Request() req: Request,
  ): Promise<string> {
    if (!(await verifyUploadCallback(req, this.aliyunConfig.oss.bucket))) {
      throw new ForbiddenException();
    }

    return this.ossService.createFile(body);
  }

  @ApiOperation({
    summary: '上传文件',
  })
  @Post('uploadFile')
  async uploadFile(@Body() body: UploadFileDto): Promise<UploadFileResDto> {
    return this.ossService.uploadFile(body);
  }

  @ApiOperation({
    summary: '获取公共文件缩略图',
  })
  @Public()
  @Get('getPublicFileThumbnail')
  async getPublicFileThumbnail(
    @Query() query: GetFileThumbnailDto,
    @Req() req,
    @Res() res,
  ): Promise<void> {
    return this.ossService.getPublicFileThumbnail(query, req, res);
  }

  @ApiOperation({
    summary: '获取公共文件下载url',
  })
  @Get('getPublicFileDownloadUrl')
  async getPublicFileDownloadUrl(
    @Query() query: GetFileDownloadUrlDto,
  ): Promise<string> {
    return this.ossService.getPublicFileDownloadUrl(query);
  }
}
