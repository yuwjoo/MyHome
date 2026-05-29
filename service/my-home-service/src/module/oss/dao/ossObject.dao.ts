import { DeepPartial, In, Repository } from 'typeorm';
import { BadRequestException, Injectable } from '@nestjs/common';
import { OssObjectEntity } from '../entities/ossObject.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { runInTransaction, Transactional } from 'typeorm-transactional';
import { CreateObjectAndRefOptions } from '../types/dao.type';
import {
  OssObjectRefEntity,
  RefTypeEnum,
} from '../entities/ossObjectRef.entity';

@Injectable()
export class OssObjectDao {
  constructor(
    @InjectRepository(OssObjectEntity)
    private readonly ossObjectRepo: Repository<OssObjectEntity>,
    @InjectRepository(OssObjectRefEntity)
    private readonly ossObjectRefRepo: Repository<OssObjectRefEntity>,
  ) {}

  /**
   * 根据文件信息获取object
   * @param {string} fileHash 文件hash
   * @param {number} fileSize 文件大小
   * @return {Promise<OssObjectEntity | null>} object
   */
  async getObjectByFileInfo(
    fileHash: string,
    fileSize: number,
  ): Promise<OssObjectEntity | null> {
    return this.ossObjectRepo.findOneBy({
      fileHash,
      fileSize,
    });
  }

  /**
   * 根据id获取object引用数据
   * @param {string} ossObjectRefId oss object引用id
   * @return {OssObjectRefEntity} object引用数据
   */
  async getObjectRefById(
    ossObjectRefId: string,
  ): Promise<OssObjectRefEntity | null> {
    return this.ossObjectRefRepo.findOne({
      where: {
        refId: ossObjectRefId,
      },
      relations: ['ossObject'],
    });
  }

  /**
   * 获取不存在的引用id列表
   * @param refIds 引用id列表
   * @return {Promise<string[]>} 不存在的引用id
   */
  async getNotExistObjectRefs(refIds: string[]): Promise<string[]> {
    if (!refIds || refIds.length === 0) {
      return [];
    }
    const existRefs = await this.ossObjectRefRepo.find({
      select: ['refId'],
      where: {
        refId: In(refIds),
      },
    });
    const existRefIds = new Set(existRefs.map((item) => item.refId));
    const notExistRefIds = refIds.filter((id) => !existRefIds.has(id));

    return notExistRefIds;
  }

  /**
   * 创建object
   * @param {DeepPartial<OssObjectEntity>} options 配置项
   * @return {Promise<OssObjectEntity>} oss对象数据
   */
  async createObject(
    options: DeepPartial<OssObjectEntity>,
  ): Promise<OssObjectEntity> {
    const newObject = this.ossObjectRepo.create(options);
    return this.ossObjectRepo.save(newObject);
  }

  /**
   * 创建object引用
   * @param {number} objectId oss对象id
   * @return {Promise<OssObjectRefEntity>} 引用数据
   */
  async createObjectRef(objectId: number): Promise<OssObjectRefEntity> {
    const newRef = this.ossObjectRefRepo.create({
      ossObject: {
        objectId,
      },
    });
    return this.ossObjectRefRepo.save(newRef);
  }

  /**
   * 创建object并引用
   */
  @Transactional()
  async createObjectAndRef(
    options: CreateObjectAndRefOptions,
  ): Promise<OssObjectRefEntity> {
    const saveObject = await this.createObject({
      ...options,
      refCount: 1,
      lastRefUpdatedAt: new Date(),
    });
    return this.createObjectRef(saveObject.objectId);
  }

  /**
   * 引用object
   * @param {number} objectId object id
   * @return {Promise<OssObjectRefEntity>} object引用数据
   */
  @Transactional()
  async refObject(objectId: number): Promise<OssObjectRefEntity> {
    await this.ossObjectRepo.update(
      { objectId },
      {
        refCount: () => `refCount + 1`,
        lastRefUpdatedAt: new Date(),
        updatedAt: () => 'updatedAt',
      },
    );
    return this.createObjectRef(objectId);
  }

  /**
   * 更新object引用为已使用
   * @param refId 引用ID
   * @param refType 引用类型
   */
  async updateRefToUsed(refId: string, refType: RefTypeEnum): Promise<void> {
    await this.batchUpdateRefToUsed([refId], refType);
  }

  /**
   * 批量更新object引用为已使用
   * @param refIds 引用ID数组
   * @param refType 引用类型
   */
  async batchUpdateRefToUsed(
    refIds: string[],
    refType: RefTypeEnum,
  ): Promise<void> {
    if (!refIds || refIds.length === 0) {
      return;
    }
    await this.ossObjectRefRepo
      .createQueryBuilder()
      .update()
      .set({
        isUsed: true,
        refType: refType,
      })
      .andWhere('isUsed = :isUsed', { isUsed: false })
      .where('refId IN (:...refIds)', { refIds })
      .execute();
  }

  /**
   * 删除object引用
   * @param refId 引用ID
   */
  async deleteRef(refId: string): Promise<void> {
    const objectRef = await this.ossObjectRefRepo.findOne({
      select: ['ossObjectId'],
      where: {
        refId,
      },
    });
    if (!objectRef) {
      throw new BadRequestException();
    }
    await this.ossObjectRefRepo.delete({ refId });
  }

  /**
   * 批量删除object引用
   * @param refIds 引用ID数组
   */
  async batchDeleteRef(refIds: string[]): Promise<void> {
    if (!refIds || refIds.length === 0) {
      return;
    }

    await runInTransaction(async () => {
      await this.ossObjectRefRepo.delete({
        refId: In(refIds),
      });

      // 减少object引用数
      await this.ossObjectRepo.query(
        `UPDATE oss_object
       SET refCount = refCount - (
         SELECT COUNT(*) FROM oss_object_ref
         WHERE oss_object_id = oss_object.objectId AND ref_id IN (?)
       ),
       lastRefUpdatedAt = CURRENT_TIMESTAMP
       WHERE objectId IN (
         SELECT DISTINCT oss_object_id FROM oss_object_ref WHERE ref_id IN (?)
       )`,
        [refIds, refIds],
      );
    });
  }
}
