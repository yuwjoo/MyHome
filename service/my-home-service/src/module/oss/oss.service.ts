import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { UploadCallbackDto } from './dto/uploadCallback.dto';
import { UploadFileResDto } from './dto/uploadFileRes.dto';
import { UploadFileDto } from './dto/uploadFile.dto';
import { generateOssObject } from './utils/object';
import {
  OssObjectRefEntity,
  RefTypeEnum,
} from './entities/ossObjectRef.entity';
import { GetFileThumbnailDto } from './dto/getFileThumbnail.dto';
import { GetFileDownloadUrlDto } from './dto/getFileDownloadUrl.dto';
import { OssObjectDao } from './dao/ossObject.dao';
import { OssClientService } from './service/ossClient.service';

@Injectable()
export class OssService {
  constructor(
    private readonly ossClientService: OssClientService,
    private readonly ossObjectDao: OssObjectDao,
  ) {}

  /**
   * 获取文件
   * @param {string} ossObjectRefId oss object引用id
   * @return {OssObjectRefEntity} object引用数据
   */
  async getFile(ossObjectRefId: string): Promise<OssObjectRefEntity | null> {
    return this.ossObjectDao.getObjectRefById(ossObjectRefId);
  }

  /**
   * 创建文件
   * @param {UploadCallbackDto} uploadCallbackDto 上传回调dto
   * @return {Promise<string>} oss文件id
   */
  async createFile(uploadCallbackDto: UploadCallbackDto): Promise<string> {
    const newOssObjectRef = await this.ossObjectDao.createObjectAndRef({
      bucketKey: uploadCallbackDto.bucket,
      objectKey: uploadCallbackDto.object,
      fileHash: uploadCallbackDto.hash,
      fileSize: uploadCallbackDto.size,
      fileMime: uploadCallbackDto.mimeType,
      fileEtag: uploadCallbackDto.etag,
    });

    return newOssObjectRef.refId;
  }

  /**
   * 上传文件
   * @param {UploadFileDto} uploadFileDto 上传文件dto
   * @return {Promise<UploadFileResDto>} 上传数据结果
   */
  async uploadFile(uploadFileDto: UploadFileDto): Promise<UploadFileResDto> {
    const ossObject = await this.ossObjectDao.getObjectByFileInfo(
      uploadFileDto.fileHash,
      uploadFileDto.fileSize,
    );

    if (ossObject) {
      const newOssObjectRef = await this.ossObjectDao.refObject(
        ossObject.objectId,
      );
      return {
        isUploaded: true,
        ossObjectRefId: newOssObjectRef.refId,
      };
    }

    const extraHeaders = {
      'x-oss-forbid-overwrite': true,
    };
    const object = generateOssObject(uploadFileDto.fileName);
    const uploadUrl = await this.ossClientService.signUploadUrl({
      object,
      hash: uploadFileDto.fileHash,
      mimeType: uploadFileDto.fileMime,
      extraHeaders,
    });

    return {
      isUploaded: false,
      signData: {
        signUrl: uploadUrl,
        signHeaders: extraHeaders,
      },
    };
  }

  /**
   * 使用文件
   * @param {string} ossObjectRefId oss object引用id
   * @param {RefTypeEnum} refType 引用类型
   */
  async useFile(ossObjectRefId: string, refType: RefTypeEnum): Promise<void> {
    const notExistIds = await this.ossObjectDao.getNotExistObjectRefs([
      ossObjectRefId,
    ]);
    if (notExistIds.length) {
      throw new BadRequestException('oss引用数据不存在');
    }
    await this.ossObjectDao.updateRefToUsed(ossObjectRefId, refType);
  }

  /**
   * 批量使用文件
   * @param {string[]} ossObjectRefIds oss object引用id集合
   * @param {RefTypeEnum} refType 引用类型
   */
  async batchUseFile(
    ossObjectRefIds: string[],
    refType: RefTypeEnum,
  ): Promise<void> {
    const notExistIds =
      await this.ossObjectDao.getNotExistObjectRefs(ossObjectRefIds);
    if (notExistIds.length) {
      throw new BadRequestException('oss引用数据不存在');
    }
    await this.ossObjectDao.batchUpdateRefToUsed(ossObjectRefIds, refType);
  }

  /**
   * 删除文件
   * @param {string} ossObjectRefId oss object引用id
   */
  async deleteFile(ossObjectRefId: string): Promise<void> {
    await this.ossObjectDao.deleteRef(ossObjectRefId);
  }

  /**
   * 批量删除文件
   * @param {string[]} ossObjectRefIds oss object引用id集合
   */
  async batchDeleteFile(ossObjectRefIds: string[]): Promise<void> {
    await this.ossObjectDao.batchDeleteRef(ossObjectRefIds);
  }

  /**
   * 获取公共文件缩略图
   * @param {GetFileThumbnailDto} getFileThumbnailDto 获取文件缩略图dto
   * @param {NestJsRequest} req 请求对象
   * @param {NestJsResponse} res 响应对象
   */
  async getPublicFileThumbnail(
    getFileThumbnailDto: GetFileThumbnailDto,
    req: NestJsRequest,
    res: NestJsResponse,
  ): Promise<void> {
    const ossObjectRef = await this.ossObjectDao.getObjectRefById(
      getFileThumbnailDto.ossObjectRefId,
    );
    if (!ossObjectRef) {
      throw new BadRequestException('文件不存在');
    }
    if (ossObjectRef.refType !== 'public' || !ossObjectRef.isUsed) {
      throw new BadRequestException('无权访问');
    }

    const ossObject = ossObjectRef.ossObject;

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
   * 获取公共文件下载url
   * @param downloadFileDto 获取文件下载url dto
   * @return 下载url
   */
  async getPublicFileDownloadUrl(
    getFileDownloadUrlDto: GetFileDownloadUrlDto,
  ): Promise<string> {
    const ossObjectRef = await this.ossObjectDao.getObjectRefById(
      getFileDownloadUrlDto.ossObjectRefId,
    );
    if (!ossObjectRef) {
      throw new BadRequestException('文件不存在');
    }
    if (ossObjectRef.refType !== 'public' || !ossObjectRef.isUsed) {
      throw new BadRequestException('无权访问');
    }

    const ossObject = ossObjectRef.ossObject;

    return this.ossClientService.signDownloadUrl({
      object: ossObject.objectKey,
      filename: ossObject.objectKey,
    });
  }
}
