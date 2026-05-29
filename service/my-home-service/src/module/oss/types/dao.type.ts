import { OssObjectEntity } from '../entities/ossObject.entity';

/**
 * 创建oss对象并引用文件-配置项
 */
export type CreateObjectAndRefOptions = Pick<
  OssObjectEntity,
  'bucketKey' | 'objectKey' | 'fileHash' | 'fileSize' | 'fileMime' | 'fileEtag'
>;
