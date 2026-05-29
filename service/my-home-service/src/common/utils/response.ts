import { ResponseCode, ResponseMsg } from '../enum/response.enum';
import { BaseResponseDto } from '../dto/response/baseResponse.dto';

/**
 * 创建成功响应
 * @param code 状态码
 * @param data 响应数据
 * @param message 响应消息
 * @returns 响应数据
 */
export function createSuccessResponse<T>(
  data: T,
  code: ResponseCode = ResponseCode.SUCCESS,
  message: string = ResponseMsg.SUCCESS,
): BaseResponseDto<T> {
  return {
    code,
    data: data ?? undefined,
    message,
  };
}

/**
 * 创建异常响应
 * @param code 状态码
 * @param data 响应数据
 * @param message 响应消息
 * @returns 响应数据
 */
export function createErrorResponse<T>(
  data: T,
  code: ResponseCode = ResponseCode.ERROR,
  message: string = ResponseMsg.ERROR,
): BaseResponseDto<T> {
  return {
    code,
    data: data ?? undefined,
    message,
  };
}

/**
 * 将HTTP状态码转换为响应状态文本
 * @param code HTTP状态码
 * @returns 响应状态文本
 */
export function HttpStatusToResponseStatusText(
  code: number,
): keyof typeof ResponseCode | '' {
  switch (code) {
    case 200:
      return 'SUCCESS';
    case 400:
      return 'ERROR';
    case 401:
      return 'UNAUTHORIZED';
    case 403:
      return 'UNAUTHORIZED';
    default:
      return '';
  }
}
