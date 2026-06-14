import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateDto } from './dto/create.dto';
import { CloudDiskFileEntity } from './entities/cloudDiskFile.entity';
import { FileItemDto } from './dto/fileItem.dto';
import { DeleteDto } from './dto/delete.dto';
import { MoveDto } from './dto/move.dto';
import { RenameDto } from './dto/rename.dto';
import { GetInfoDto } from './dto/getInfo.dto';
import { GetListDto } from './dto/getList.dto';
import { JwtPayload } from 'src/types/jwt';
import { GetFileThumbnailDto } from './dto/getFileThumbnail.dto';
import { GetFileDownloadUrlDto } from './dto/getFileDownloadUrl.dto';
import { CreateShareLinkDto } from './dto/createShareLink.dto';
import { OssService } from '../oss/oss.service';
import { runInTransaction } from 'typeorm-transactional';
import { OssClientService } from '../oss/service/ossClient.service';
import { FileDao } from './dao/file.dao';
import { DirectoryDao } from './dao/directory.dao';
import { parseFilePath } from './utils/utils';
import { testFileName } from './utils/rules';
import { UnitDao } from './dao/unit.dao';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CloudDiskService {
  constructor(
    private readonly unitDao: UnitDao,
    private readonly fileDao: FileDao,
    private readonly directoryDao: DirectoryDao,
    private readonly ossClientService: OssClientService,
    private readonly ossService: OssService,
  ) {}

  /**
   * 创建文件/目录
   * @param createDto 创建dto
   * @param user 用户信息
   * @return 创建的文件项数据
   */
  async create(createDto: CreateDto, user: JwtPayload): Promise<FileItemDto> {
    const pathInfo = parseFilePath(createDto.path);
    let newFile: CloudDiskFileEntity;

    if (!testFileName(pathInfo.fileName)) {
      throw new BadRequestException('文件名称不合法');
    }
    if (!(await this.directoryDao.dirIsExist(pathInfo.fileParentPath))) {
      throw new BadRequestException('父级目录不存在');
    }
    if (await this.unitDao.fileItemIsExist(pathInfo.filePath)) {
      throw new BadRequestException('文件已存在');
    }

    if (createDto.type === 'file') {
      if (!createDto.ossObjectRefId) {
        throw new BadRequestException('oss文件不存在');
      }
      const ossFile = await this.ossService.getFile(createDto.ossObjectRefId);
      if (!ossFile) {
        throw new BadRequestException('oss文件不存在');
      }
      newFile = await this.fileDao.createFile({
        fileName: pathInfo.fileName,
        fileSize: ossFile.ossObject.fileSize,
        mimeType: ossFile.ossObject.fileMime,
        filePath: pathInfo.filePath,
        fileDepth: pathInfo.fileDepth,
        parentPath: pathInfo.fileParentPath,
        ossObjectRefId: ossFile.refId,
        createUserId: user.userId,
      });
    } else {
      newFile = await this.directoryDao.createDir({
        fileName: pathInfo.fileName,
        filePath: pathInfo.filePath,
        parentPath: pathInfo.fileParentPath,
        createUserId: user.userId,
        fileDepth: 0,
      });
    }

    return plainToInstance(FileItemDto, newFile);
  }

  /**
   * 删除文件/目录
   * @param deleteDto 删除dto
   */
  async delete(deleteDto: DeleteDto): Promise<void> {
    const oldFile = await this.unitDao.getFileItemByPath(deleteDto.path);
    if (!oldFile) {
      throw new BadRequestException('文件不存在');
    }

    if (oldFile.fileType === 'file') {
      await this.fileDao.deleteFile({
        fileSize: oldFile.fileSize,
        filePath: oldFile.filePath,
        fileId: oldFile.fileId,
      });
    } else {
      await this.directoryDao.deleteDir({
        fileSize: oldFile.fileSize,
        filePath: oldFile.filePath,
        fileId: oldFile.fileId,
      });
    }
  }

  /**
   * 移动文件/目录
   * @param moveDto 移动dto
   * @return 移动后的文件项数据
   */
  async move(moveDto: MoveDto): Promise<FileItemDto> {
    const oldFile = await this.unitDao.getFileItemByPath(moveDto.path);
    if (!oldFile) {
      throw new BadRequestException('文件不存在');
    }
    const newPathInfo = parseFilePath(moveDto.parentPath, oldFile.fileName);
    if (!(await this.directoryDao.dirIsExist(newPathInfo.fileParentPath))) {
      throw new BadRequestException('目标父级目录不存在');
    }
    let newFile: CloudDiskFileEntity;

    if (oldFile.fileType === 'file') {
      newFile = await this.fileDao.moveFile({
        oldFile: {
          filePath: oldFile.filePath,
          fileId: oldFile.fileId,
          fileSize: oldFile.fileSize,
        },
        newFile: {
          filePath: newPathInfo.filePath,
          fileDepth: newPathInfo.fileDepth,
          parentPath: newPathInfo.fileParentPath,
        },
      });
    } else {
      newFile = await this.directoryDao.moveDir({
        oldFile: {
          filePath: oldFile.filePath,
          fileId: oldFile.fileId,
          fileSize: oldFile.fileSize,
        },
        newFile: {
          filePath: newPathInfo.filePath,
          fileDepth: newPathInfo.fileDepth,
          parentPath: newPathInfo.fileParentPath,
        },
      });
    }

    return plainToInstance(FileItemDto, newFile);
  }

  /**
   * 重命名文件/目录
   * @param renameDto 重命名dto
   * @return 重命名后的文件项数据
   */
  async rename(renameDto: RenameDto): Promise<FileItemDto> {
    const oldFile = await this.unitDao.getFileItemByPath(renameDto.path);
    if (!oldFile) {
      throw new BadRequestException('文件不存在');
    }
    const newPathInfo = parseFilePath(
      oldFile.parentPath,
      renameDto.newFileName,
    );
    if (!testFileName(newPathInfo.fileName)) {
      throw new BadRequestException('文件名称不合法');
    }
    let newFile: CloudDiskFileEntity;

    if (oldFile.fileType === 'file') {
      newFile = await this.fileDao.renameFile({
        oldFile: {
          fileId: oldFile.fileId,
        },
        newFile: {
          filePath: newPathInfo.filePath,
          fileName: newPathInfo.fileName,
        },
      });
    } else {
      newFile = await this.directoryDao.renameDir({
        oldFile: {
          fileId: oldFile.fileId,
          filePath: oldFile.filePath,
        },
        newFile: {
          filePath: newPathInfo.filePath,
          fileName: newPathInfo.fileName,
        },
      });
    }

    return plainToInstance(FileItemDto, newFile);
  }

  /**
   * 获取单个文件/目录信息
   * @param getInfoDto 查询参数
   * @return 文件项数据
   */
  async getInfo(getInfoDto: GetInfoDto): Promise<FileItemDto> {
    const targetFile = await this.unitDao.getFileItemByPath(getInfoDto.path);
    if (!targetFile) {
      throw new BadRequestException();
    }
    return plainToInstance(FileItemDto, targetFile);
  }

  /**
   * 获取文件列表
   * @param getListDto 查询参数
   * @return 文件项数据列表
   */
  async getList(getListDto: GetListDto): Promise<FileItemDto[]> {
    const fileItemList = await this.unitDao.findFileItemByParentPath(
      getListDto.parentPath,
    );
    return plainToInstance(FileItemDto, fileItemList);
  }

  /**
   * 获取文件缩略图
   * @param {GetFileThumbnailDto} getFileThumbnailDto 获取文件缩略图dto
   * @param {NestJsRequest} req 请求对象
   * @param {NestJsResponse} res 响应对象
   */
  async getFileThumbnail(
    getFileThumbnailDto: GetFileThumbnailDto,
    req: NestJsRequest,
    res: NestJsResponse,
  ): Promise<void> {
    const targetFile = await this.unitDao.findFileItemByPathWithOssObject(
      getFileThumbnailDto.filePath,
    );
    if (
      !targetFile ||
      targetFile.fileType !== 'file' ||
      !targetFile.ossObjectRef
    ) {
      throw new BadRequestException('文件不存在');
    }

    const ossObject = targetFile.ossObjectRef.ossObject;

    // 检查缓存
    const isNotModified = req.headers['if-none-match'] === ossObject.fileEtag;
    if (isNotModified) {
      res.status(HttpStatus.NOT_MODIFIED).send();
      return;
    }

    res
      .status(HttpStatus.OK)
      .header('ETag', `${ossObject.fileEtag}`)
      .header('Cache-Control', `private, max-age=${24 * 60 * 60}`)
      .header('Content-Type', ossObject.fileMime);

    const ossClient = await this.ossClientService.getOssClient();
    const streamRes = await ossClient.getStream(ossObject.objectKey, {
      process: `image/resize,w_${getFileThumbnailDto.imageWidth}`,
    });
    streamRes.stream.pipe(res);
  }

  /**
   * 获取文件下载url
   * @param downloadFileDto 获取文件下载url dto
   * @return 下载url
   */
  async getFileDownloadUrl(
    getFileDownloadUrlDto: GetFileDownloadUrlDto,
  ): Promise<string> {
    const targetFile = await this.unitDao.findFileItemByPathWithOssObject(
      getFileDownloadUrlDto.filePath,
    );
    if (
      !targetFile ||
      targetFile.fileType !== 'file' ||
      !targetFile.ossObjectRef
    ) {
      throw new BadRequestException('文件不存在');
    }
    const ossObject = targetFile.ossObjectRef.ossObject;

    return this.ossClientService.signDownloadUrl({
      object: ossObject.objectKey,
      filename: targetFile.fileName,
    });
  }

  /**
   * 生成分享链接
   * @param createShareLinkDto 创建分享链接dto
   * @return 文件下载链接
   */
  async createShareLink(
    createShareLinkDto: CreateShareLinkDto,
  ): Promise<string> {
    const targetFile = await this.unitDao.findFileItemByPathWithOssObject(
      createShareLinkDto.filePath,
    );
    if (
      !targetFile ||
      targetFile.fileType !== 'file' ||
      !targetFile.ossObjectRef
    ) {
      throw new BadRequestException('文件不存在');
    }
    const ossObject = targetFile.ossObjectRef.ossObject;

    return this.ossClientService.signDownloadUrl({
      object: ossObject.objectKey,
      filename: targetFile.fileName,
      expire: createShareLinkDto.expiresIn,
    });
  }

  /**
   * 获取回收站文件列表
   */
  async getRecycleBinList(): Promise<FileItemDto[]> {
    const deletedFiles = await this.unitDao.findDeleteFileItem();
    return plainToInstance(FileItemDto, deletedFiles);
  }

  /**
   * 清空回收站（删除所有软删除的文件）
   */
  async clearRecycleBin(): Promise<void> {
    const deletedFiles = await this.unitDao.findDeleteFileItem();
    if (!deletedFiles || deletedFiles.length === 0) {
      return;
    }
    const refIds = deletedFiles
      .filter((file) => file.ossObjectRefId)
      .map((file) => file.ossObjectRefId!);

    runInTransaction(async () => {
      await this.unitDao.deleteFileItemBySoftDelete();
      await this.ossService.batchDeleteFile(refIds);
    });
  }
}
