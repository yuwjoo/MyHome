import { SetMetadata } from '@nestjs/common';
import { MetadataKey } from '../enum/metadata.enum';

/**
 * 公共接口装饰器（不需要认证授权）
 */
export const Public = () => SetMetadata(MetadataKey.IS_PUBLIC, true);
