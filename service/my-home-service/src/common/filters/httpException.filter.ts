import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { BaseResponseDto } from '../dto/response/baseResponse.dto';
import {
  createErrorResponse,
  HttpStatusToResponseStatusText,
} from '../utils/response';
import { ResponseCode, ResponseMsg } from '../enum/response.enum';

/**
 * http异常过滤器
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    let httpStatus: number; // http状态码
    let responseData: BaseResponseDto; // 响应数据

    if (exception instanceof HttpException) {
      // 处理http异常
      const status = exception.getStatus();
      const statusText = HttpStatusToResponseStatusText(status);
      const errorRes = exception.getResponse();
      let data: any;
      let code: ResponseCode;
      let msg: string;

      if (typeof errorRes === 'object') {
        const object = <any>errorRes;
        data = object.data;
        code = object.code ?? ResponseCode[statusText || 'ERROR'];

        if (
          object.hasOwnProperty('statusCode') &&
          !object.hasOwnProperty('error')
        ) {
          msg = ResponseMsg[statusText] ?? object.message;
        } else {
          msg = object.message ?? ResponseMsg[statusText || 'ERROR'];
        }
      } else {
        code = ResponseCode[statusText || 'ERROR'];
        msg = errorRes;
      }
      httpStatus = status;
      responseData = createErrorResponse(data, code, msg);
    } else {
      // 处理未知异常
      const status = HttpStatus.INTERNAL_SERVER_ERROR;
      const code = ResponseCode.SERVER_ERROR;
      let msg: string | undefined = ResponseMsg.SERVER_ERROR;

      // 在开发环境下显示详细错误信息
      if (process.env.NODE_ENV === 'development') {
        console.error('http未捕获的异常:', exception);
        if (exception instanceof Error) msg = exception.message;
      }

      httpStatus = status;
      responseData = createErrorResponse(undefined, code, msg);
    }

    response.status(httpStatus).json(responseData);
  }
}
