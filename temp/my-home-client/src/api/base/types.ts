import type { paths } from "./api.d";

/**
 * 提取对象value类型
 */
type ExtractValue<T> = T[keyof T];

/**
 * 提取的请求方法类型
 */
type Method = "get" | "post" | "put" | "delete";

/**
 * 排除T为undefind的类型
 */
type ExcludeUndefined<T, K> = T extends undefined ? never : K;

/**
 * 排除T不为请求方法的类型
 */
type ExcludeNotMethod<T> = T extends Method ? T : never;

/**
 * 提取响应数据类型
 */
type ExtractResponse<M, T extends Record<string, any>> = M extends "post"
  ? T["responses"]["201"]["content"]["application/json"]
  : T["responses"]["200"]["content"]["application/json"];

/**
 * 提取api相关数据类型
 */
type ExtractApi<U, T extends Record<string, any>> = {
  [M in keyof T as ExcludeNotMethod<ExcludeUndefined<T[M], M>>]: {
    config: {
      url: RemoveApiPrefix<U>;
      method: M extends string ? Uppercase<M> : never;
      params?: T[M]["parameters"]["query"];
      data?: T[M]["requestBody"]["content"]["application/json"];
    };
    response: ExtractResponse<M, T[M]>;
  };
};

/**
 * 去除api前缀
 */
type RemoveApiPrefix<T> = T extends `/api${infer Rest}` ? Rest : T;

/**
 * 转换为api类型
 */
type PathsToApis<T extends Record<string, any>> = {
  [U in keyof T as RemoveApiPrefix<U>]: ExtractValue<ExtractApi<U, T[U]>>;
};

/**
 * 接口api类型
 */
export type ServerApi = PathsToApis<paths>;
