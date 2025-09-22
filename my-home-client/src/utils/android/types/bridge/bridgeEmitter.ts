import type { AndroidApiRoutes } from "./androidApiRoutes";
import type { IChannel } from "./channel";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never; // 使用映射类型合并联合类型

type FlattenPath<T, Separator extends string = "/", Prefix extends string = ""> = {
  [K in keyof T]: T[K] extends any[]
    ? { [P in `${Prefix}${K & string}`]: T[K] }
    : T[K] extends object
    ? FlattenPath<T[K], Separator, `${Prefix}${K & string}${Separator}`>
    : never;
}[keyof T]; // 扁平化处理

export type FlattenAndroidApiRoutes = UnionToIntersection<FlattenPath<AndroidApiRoutes>>;

export interface IBridgeEmitterSend {
  <K extends keyof FlattenAndroidApiRoutes>(name: K, data?: FlattenAndroidApiRoutes[K][0]): void;
}

export interface IBridgeEmitterInvoke {
  <K extends keyof FlattenAndroidApiRoutes>(name: K, data?: FlattenAndroidApiRoutes[K][0]): Promise<
    FlattenAndroidApiRoutes[K][1]
  >;
}

export interface IBridgeEmitterConnect {
  <K extends keyof FlattenAndroidApiRoutes>(name: K, data?: FlattenAndroidApiRoutes[K][0]): IChannel<
    FlattenAndroidApiRoutes[K][2],
    FlattenAndroidApiRoutes[K][3]
  >;
}
