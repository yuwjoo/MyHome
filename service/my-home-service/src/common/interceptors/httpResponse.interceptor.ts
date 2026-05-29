import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseResponseDto } from '../dto/response/baseResponse.dto';
import { createSuccessResponse } from '../utils/response';
import { MetadataKey } from '../enum/metadata.enum';

/**
 * http响应拦截器
 */
@Injectable()
export class HttpResponseInterceptor<T> implements NestInterceptor<
  T,
  BaseResponseDto<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<BaseResponseDto<T>> {
    const isCustomResponse = Reflect.getMetadata(
      MetadataKey.IS_CUSTOM_RESPONSE,
      context.getHandler(),
    );
    if (isCustomResponse) return next.handle(); // 需要自定义响应，不做拦截处理

    const handler = (data: T): BaseResponseDto<T> => {
      return createSuccessResponse(data);
    };

    return next.handle().pipe(map(handler));
  }
}
