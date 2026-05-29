import { SetMetadata } from '@nestjs/common';
import { MetadataKey } from '../enum/metadata.enum';

/**
 * 自定义响应装饰器（不走统一响应数据处理）
 */
export const CustomResponse = () =>
  SetMetadata(MetadataKey.IS_CUSTOM_RESPONSE, true);
