import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { runInTransaction } from 'typeorm-transactional';
import { CloudDiskFileEntity } from '../entities/cloudDiskFile.entity';
import { UnitDao } from './unit.dao';
import { OssService } from 'src/module/oss/oss.service';
import {
  CreateFileOptions,
  DeleteFileOptions,
  MoveFileOptions,
  RenameFileOptions,
} from '../types/dao.type';

@Injectable()
export class FileDao {
  constructor(
    @InjectRepository(CloudDiskFileEntity)
    private readonly cloudDiskFileRepo: Repository<CloudDiskFileEntity>,
    private readonly unitDao: UnitDao,
    private readonly ossService: OssService,
  ) {}

  /**
   * 创建文件
   * @param {CreateFileOptions} options 配置项
   * @return {Promise<CloudDiskFileEntity>} 创建的文件信息
   */
  async createFile(options: CreateFileOptions): Promise<CloudDiskFileEntity> {
    return runInTransaction(async () => {
      await this.ossService.useFile(options.ossObjectRefId, 'cloudDisk');
      await this.unitDao.updateSupFileItemSize(
        options.filePath,
        options.fileSize,
        'add',
      );
      return this.cloudDiskFileRepo.save(
        this.cloudDiskFileRepo.create({
          fileName: options.fileName,
          fileSize: options.fileSize,
          mimeType: options.mimeType,
          fileType: 'file',
          filePath: options.filePath,
          fileDepth: options.fileDepth,
          parentPath: options.parentPath,
          ossObjectRefId: options.ossObjectRefId,
          createUserId: options.createUserId,
        }),
      );
    });
  }

  /**
   * 删除文件
   * @param {CreateFileOptions} options 配置项
   */
  async deleteFile(options: DeleteFileOptions): Promise<void> {
    runInTransaction(async () => {
      await this.unitDao.updateSupFileItemSize(
        options.filePath,
        options.fileSize,
        'delete',
      );
      await this.cloudDiskFileRepo.softRemove(
        this.cloudDiskFileRepo.create({ fileId: options.fileId }),
      );
    });
  }

  /**
   * 移动文件
   * @param {MoveFileOptions} options 配置项
   * @return 移动后的文件信息
   */
  async moveFile(options: MoveFileOptions): Promise<CloudDiskFileEntity> {
    const newFile = this.cloudDiskFileRepo.create({
      fileId: options.oldFile.fileId,
      filePath: options.newFile.filePath,
      parentPath: options.newFile.parentPath,
      fileDepth: options.newFile.fileDepth,
    });

    return runInTransaction(async () => {
      await this.unitDao.updateSupFileItemSize(
        options.oldFile.filePath,
        options.oldFile.fileSize,
        'delete',
      );
      await this.unitDao.updateSupFileItemSize(
        options.newFile.filePath,
        options.oldFile.fileSize,
        'add',
      );
      return await this.cloudDiskFileRepo.save(newFile);
    });
  }

  /**
   * 重命名文件
   * @param {RenameFileOptions} options 配置项
   * @return 重命名后的文件信息
   */
  async renameFile(options: RenameFileOptions): Promise<CloudDiskFileEntity> {
    const newFile = this.cloudDiskFileRepo.create({
      fileId: options.oldFile.fileId,
      fileName: options.newFile.fileName,
      filePath: options.newFile.filePath,
    });

    return this.cloudDiskFileRepo.save(newFile);
  }
}
