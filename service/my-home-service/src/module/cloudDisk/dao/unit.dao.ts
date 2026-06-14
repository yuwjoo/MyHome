import { IsNull, Like, Not, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CloudDiskFileEntity } from '../entities/cloudDiskFile.entity';
import { getParentPaths, parseFilePath } from '../utils/utils';
import { PaginationDataDto } from 'src/common/dto/pagination/paginationData.dto';

@Injectable()
export class UnitDao {
  constructor(
    @InjectRepository(CloudDiskFileEntity)
    private readonly cloudDiskFileRepo: Repository<CloudDiskFileEntity>,
  ) {}

  /**
   * 更新上级文件项大小
   * @param filePath 文件路径
   * @param fileSize 文件大小
   * @param operate 文件操作 add: 添加，delete: 删除
   */
  async updateSupFileItemSize(
    filePath: string,
    fileSize: number,
    operate: 'add' | 'delete',
  ): Promise<void> {
    const parentPaths = getParentPaths(filePath);
    if (parentPaths.length === 0) return;

    const sizeDiff = (operate === 'add' ? 1 : -1) * fileSize;

    await this.cloudDiskFileRepo
      .createQueryBuilder()
      .update()
      .set({
        fileSize: () => `file_size + :sizeDiff`,
        updatedAt: () => 'updatedAt',
      })
      .setParameter('sizeDiff', sizeDiff)
      .where('file_path IN (:...paths)', { paths: parentPaths })
      .execute();
  }

  /**
   * 更新下级文件项路径
   * @param filePath 文件文件
   * @param newFilePath 新文件路径
   */
  async updateSubFileItemPath(
    filePath: string,
    newFilePath: string,
  ): Promise<void> {
    const subFileList = await this.cloudDiskFileRepo.findBy({
      parentPath: Like(`${filePath}%`),
    });
    const fileList = subFileList.map((file) => {
      const newInfo = parseFilePath(
        file.filePath.replace(filePath, newFilePath),
      );
      return this.cloudDiskFileRepo.create({
        ...file,
        fileName: newInfo.fileName,
        filePath: newInfo.filePath,
        parentPath: newInfo.fileParentPath,
        fileDepth: newInfo.fileDepth,
      });
    });

    await this.cloudDiskFileRepo.save(fileList);
  }

  /**
   * 文件项是否存在
   * @param {string} filePath 文件路径
   * @return {Promise<boolean>} 文件项是否存在
   */
  async fileItemIsExist(filePath: string): Promise<boolean> {
    return this.cloudDiskFileRepo.existsBy({
      filePath,
    });
  }

  /**
   * 根据路径获取文件项
   * @param {string} filePath 文件路径
   * @return {Promise<CloudDiskFileEntity>} 文件项
   */
  async getFileItemByPath(
    filePath: string,
  ): Promise<CloudDiskFileEntity | null> {
    return this.cloudDiskFileRepo.findOneBy({
      filePath,
    });
  }

  /**
   * 根据父级路径查找文件项列表
   * @param {string} parentPath 父级路径
   * @return {Promise<CloudDiskFileEntity[]>} 文件项列表
   */
  async findFileItemByParentPath(
    parentPath: string,
  ): Promise<CloudDiskFileEntity[]> {
    return this.cloudDiskFileRepo.findBy({
      parentPath,
    });
  }

  /**
   * 根据父级路径分页查找文件项列表
   * @param {string} parentPath 父级路径
   * @param {number} pageNum 页码
   * @param {number} pageSize 每页条数
   * @return {Promise<PaginationDataDto<CloudDiskFileEntity>>} 分页文件列表
   */
  async pageFileItemByParentPath(
    parentPath: string,
    pageNum: number,
    pageSize: number,
  ): Promise<PaginationDataDto<CloudDiskFileEntity>> {
    const skip = (pageNum - 1) * pageSize;
    const [records, total] = await this.cloudDiskFileRepo.findAndCount({
      where: { parentPath },
      skip,
      take: pageSize,
    });

    return {
      pageNum,
      pageSize,
      total,
      records,
    };
  }

  /**
   * 根据路径查找文件项列表（带oss object数据）
   * @param {string} filePath 文件路径
   * @return {Promise<CloudDiskFileEntity | null>} 文件项
   */
  async findFileItemByPathWithOssObject(
    filePath: string,
  ): Promise<CloudDiskFileEntity | null> {
    return this.cloudDiskFileRepo.findOne({
      where: { filePath },
      relations: ['ossObjectRef', 'ossObjectRef.ossObject'],
    });
  }

  /**
   * 查找被删除的文件列表
   * @return {Promise<CloudDiskFileEntity[]>} 文件项列表
   */
  async findDeleteFileItem(): Promise<CloudDiskFileEntity[]> {
    return await this.cloudDiskFileRepo.find({
      where: {
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
    });
  }

  /**
   * 删除所有软删除的文件项
   */
  async deleteFileItemBySoftDelete(): Promise<void> {
    await this.cloudDiskFileRepo.delete({
      deletedAt: Not(IsNull()),
    });
  }

}
