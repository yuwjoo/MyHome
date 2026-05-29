import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 从请求对象中获取用户信息
 * @param data 指定要获取的用户属性，不传则返回整个用户对象
 * @param ctx 执行上下文对象
 * @returns 当前用户信息或指定属性值
 */
export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
