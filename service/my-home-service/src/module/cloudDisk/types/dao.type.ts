import { CloudDiskFileEntity } from '../entities/cloudDiskFile.entity';

/**
 * 创建文件-配置项
 */
export type CreateFileOptions = Required<
  Pick<
    CloudDiskFileEntity,
    | 'fileName'
    | 'fileSize'
    | 'mimeType'
    | 'fileDepth'
    | 'filePath'
    | 'parentPath'
    | 'ossObjectRefId'
    | 'createUserId'
  >
>;

/**
 * 删除文件-配置项
 */
export type DeleteFileOptions = Required<
  Pick<CloudDiskFileEntity, 'fileId' | 'filePath' | 'fileSize'>
>;

/**
 * 移动文件-配置项
 */
export type MoveFileOptions = {
  oldFile: Required<
    Pick<CloudDiskFileEntity, 'fileId' | 'filePath' | 'fileSize'>
  >;
  newFile: Required<
    Pick<CloudDiskFileEntity, 'filePath' | 'parentPath' | 'fileDepth'>
  >;
};

/**
 * 重命名文件-配置项
 */
export type RenameFileOptions = {
  oldFile: Required<Pick<CloudDiskFileEntity, 'fileId'>>;
  newFile: Pick<CloudDiskFileEntity, 'fileName' | 'filePath'>;
};

/**
 * 创建目录-配置项
 */
export type CreateDirOptions = Required<
  Pick<
    CloudDiskFileEntity,
    'fileName' | 'filePath' | 'fileDepth' | 'parentPath' | 'createUserId'
  >
>;

/**
 * 删除目录-配置项
 */
export type DeleteDirOptions = Required<
  Pick<CloudDiskFileEntity, 'fileId' | 'filePath' | 'fileSize'>
>;

/**
 * 移动目录-配置项
 */
export type MoveDirOptions = {
  oldFile: Required<
    Pick<CloudDiskFileEntity, 'fileId' | 'filePath' | 'fileSize'>
  >;
  newFile: Required<
    Pick<CloudDiskFileEntity, 'filePath' | 'parentPath' | 'fileDepth'>
  >;
};

/**
 * 重命名目录-配置项
 */
export type RenameDirOptions = {
  oldFile: Required<Pick<CloudDiskFileEntity, 'fileId' | 'filePath'>>;
  newFile: Pick<CloudDiskFileEntity, 'fileName' | 'filePath'>;
};
