import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { runInTransaction } from 'typeorm-transactional';
import { CloudDiskFileEntity } from '../entities/cloudDiskFile.entity';
import { UnitDao } from './unit.dao';
import {
  CreateDirOptions,
  DeleteDirOptions,
  MoveDirOptions,
  RenameDirOptions,
} from '../types/dao.type';

@Injectable()
export class DirectoryDao {
  constructor(
    @InjectRepository(CloudDiskFileEntity)
    private readonly cloudDiskFileRepo: Repository<CloudDiskFileEntity>,
    private readonly unitDao: UnitDao,
  ) {}

  /**
   * 创建目录
   * @param {CreateDirOptions} options 配置项
   * @return {Promise<CloudDiskFileEntity>} 创建的文件信息
   */
  async createDir(options: CreateDirOptions): Promise<CloudDiskFileEntity> {
    const saveFile = this.cloudDiskFileRepo.create({
      fileName: options.fileName,
      fileSize: 0,
      mimeType: undefined,
      fileType: 'directory',
      filePath: options.filePath,
      fileDepth: options.fileDepth,
      parentPath: options.parentPath,
      ossObjectRefId: undefined,
      createUserId: options.createUserId,
    });

    return this.cloudDiskFileRepo.save(saveFile);
  }

  /**
   * 删除目录
   * @param {DeleteDirOptions} options 配置项
   */
  async deleteDir(options: DeleteDirOptions): Promise<void> {
    runInTransaction(async () => {
      // 更新上级大小
      await this.unitDao.updateSupFileItemSize(
        options.filePath,
        options.fileSize,
        'delete',
      );
      // 软删除文件
      await this.cloudDiskFileRepo
        .createQueryBuilder()
        .update()
        .set({
          deletedAt: new Date(),
        })
        .where('diskFile.filePath = :rootPath', {
          rootPath: options.filePath,
        })
        .orWhere('diskFile.filePath LIKE :prefix', {
          prefix: `${options.filePath}/%`,
        })
        .andWhere('diskFile.deletedAt IS NULL')
        .execute();
    });
  }

  /**
   * 移动目录
   * @param {MoveDirOptions} options 配置项
   * @return 移动后的文件信息
   */
  async moveDir(options: MoveDirOptions): Promise<CloudDiskFileEntity> {
    const newFile = this.cloudDiskFileRepo.create({
      fileId: options.oldFile.fileId,
      filePath: options.newFile.filePath,
      parentPath: options.newFile.parentPath,
      fileDepth: options.newFile.fileDepth,
    });

    return runInTransaction(async () => {
      // 更新目标文件下的所有子文件
      await this.unitDao.updateSubFileItemPath(
        options.oldFile.filePath,
        options.newFile.filePath,
      );
      // 目标文件原上级所有目录size减去该文件size
      await this.unitDao.updateSupFileItemSize(
        options.oldFile.filePath,
        options.oldFile.fileSize,
        'delete',
      );
      // 目标文件新上级所有目录size加上该文件size
      await this.unitDao.updateSupFileItemSize(
        options.newFile.filePath,
        options.oldFile.fileSize,
        'add',
      );
      // 更新目标文件
      return this.cloudDiskFileRepo.save(newFile);
    });
  }

  /**
   * 重命名目录
   * @param {RenameDirOptions} options 配置项
   * @return 重命名后的文件信息
   */
  async renameDir(options: RenameDirOptions): Promise<CloudDiskFileEntity> {
    const newFile = this.cloudDiskFileRepo.create({
      fileId: options.oldFile.fileId,
      fileName: options.newFile.fileName,
      filePath: options.newFile.filePath,
    });

    return runInTransaction(async () => {
      // 更新目标文件下的所有子文件
      await this.unitDao.updateSubFileItemPath(
        options.oldFile.filePath,
        options.newFile.filePath,
      );
      // 更新目标文件
      return await this.cloudDiskFileRepo.save(newFile);
    });
  }

  /**
   * 目录是否存在
   * @param {string} filePath 文件路径
   * @return {Promise<boolean>} 目录是否存在
   */
  async dirIsExist(filePath: string): Promise<boolean> {
    if (filePath === '/') return true;
    return this.cloudDiskFileRepo.existsBy({
      filePath,
      fileType: 'directory',
    });
  }
}
