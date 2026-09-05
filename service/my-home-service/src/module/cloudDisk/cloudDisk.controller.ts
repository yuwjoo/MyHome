import { Body, Controller, Get, Post, Query, Req, Res } from '@nestjs/common';
import { CloudDiskService } from './cloudDisk.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateDto } from './dto/create.dto';
import { FileItemDto } from './dto/fileItem.dto';
import { DeleteDto } from './dto/delete.dto';
import { MoveDto } from './dto/move.dto';
import { RenameDto } from './dto/rename.dto';
import { GetInfoDto } from './dto/getInfo.dto';
import { GetListDto } from './dto/getList.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { GetFileThumbnailDto } from './dto/getFileThumbnail.dto';
import { GetFileDownloadUrlDto } from './dto/getFileDownloadUrl.dto';
import { CreateShareLinkDto } from './dto/createShareLink.dto';

@ApiTags('云盘文件')
@Controller('cloudDisk')
export class CloudDiskController {
  constructor(private readonly cloudDiskService: CloudDiskService) {}

  @ApiOperation({
    summary: '创建文件/目录',
  })
  @Post('create')
  create(
    @Body() body: CreateDto,
    @Req() req: NestJsRequest,
  ): Promise<FileItemDto> {
    return this.cloudDiskService.create(body, req.user);
  }

  @ApiOperation({
    summary: '删除文件/目录',
  })
  @Post('delete')
  delete(@Body() body: DeleteDto): Promise<void> {
    return this.cloudDiskService.delete(body);
  }

  @ApiOperation({
    summary: '移动文件/目录',
  })
  @Post('move')
  move(@Body() body: MoveDto): Promise<FileItemDto> {
    return this.cloudDiskService.move(body);
  }

  @ApiOperation({
    summary: '重命名文件/目录',
  })
  @Post('rename')
  rename(@Body() body: RenameDto): Promise<FileItemDto> {
    return this.cloudDiskService.rename(body);
  }

  @ApiOperation({
    summary: '获取单个文件/目录信息',
  })
  @Get('getInfo')
  getInfo(@Query() query: GetInfoDto): Promise<FileItemDto> {
    return this.cloudDiskService.getInfo(query);
  }

  @ApiOperation({
    summary: '获取文件列表',
  })
  @Get('getList')
  getList(@Query() query: GetListDto): Promise<FileItemDto[]> {
    return this.cloudDiskService.getList(query);
  }

  @ApiOperation({
    summary: '获取文件缩略图',
  })
  @Public()
  @Get('getFileThumbnail')
  getFileThumbnail(
    @Query() getFileThumbnailDto: GetFileThumbnailDto,
    @Req() req: NestJsRequest,
    @Res() res: NestJsResponse,
  ): Promise<void> {
    return this.cloudDiskService.getFileThumbnail(
      getFileThumbnailDto,
      req,
      res,
    );
  }

  @ApiOperation({
    summary: '获取文件下载url',
  })
  @Get('getFileDownloadUrl')
  getFileDownloadUrl(@Query() query: GetFileDownloadUrlDto): Promise<string> {
    return this.cloudDiskService.getFileDownloadUrl(query);
  }

  @ApiOperation({
    summary: '生成分享链接',
  })
  @Post('createShareLink')
  createShareLink(@Body() body: CreateShareLinkDto): Promise<string> {
    return this.cloudDiskService.createShareLink(body);
  }

  @ApiOperation({
    summary: '获取回收站文件列表',
  })
  @Get('getRecycleBinList')
  getRecycleBinList(): Promise<FileItemDto[]> {
    return this.cloudDiskService.getRecycleBinList();
  }

  @ApiOperation({
    summary: '清空回收站',
  })
  @Post('clearRecycleBin')
  clearRecycleBin(): Promise<void> {
    return this.cloudDiskService.clearRecycleBin();
  }
}
