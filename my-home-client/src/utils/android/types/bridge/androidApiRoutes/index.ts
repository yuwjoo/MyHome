import type { RequestData, RequestOnEvent, RequestResult, RequestSendEvent } from "./request";

export interface AndroidApiRoutes {
  request: AndroidApiRouterConfig<RequestData, RequestResult, RequestOnEvent, RequestSendEvent>;
}

export type AndroidApiRouterConfig<
  Data = any,
  Result = any,
  OnEvent extends Record<string, any> = any,
  SendEvent extends Record<string, any> = any
> = [Data, Result, OnEvent, SendEvent];
