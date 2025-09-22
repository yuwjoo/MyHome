import type {
  AndroidRequestOptions,
  BodyMultipartField,
  BodyMultipartBlob,
  XMLHttpRequestForAndroid,
  AndroidRequestResult
} from "../types/xhr";
import dsBridge from "dsbridge";

class XMLHttpRequestEventTargetForAndroid extends EventTarget implements XMLHttpRequestEventTarget {
  #onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  #onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  #onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  #onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  #onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  #onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
  #ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;

  get onabort() {
    return this.#onabort;
  }

  set onabort(val: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this.removeEventListener("abort", this.#onabort as any);
    this.addEventListener("abort", val as any);
    this.#onabort = val;
  }

  get onerror() {
    return this.#onerror;
  }

  set onerror(val: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this.removeEventListener("error", this.#onerror as any);
    this.addEventListener("error", val as any);
    this.#onerror = val;
  }

  get onload() {
    return this.#onload;
  }

  set onload(val: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this.removeEventListener("load", this.#onload as any);
    this.addEventListener("load", val as any);
    this.#onload = val;
  }

  get onloadend() {
    return this.#onloadend;
  }

  set onloadend(val: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this.removeEventListener("loadend", this.#onloadend as any);
    this.addEventListener("loadend", val as any);
    this.#onloadend = val;
  }

  get onloadstart() {
    return this.#onloadstart;
  }

  set onloadstart(val: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this.removeEventListener("loadstart", this.#onloadstart as any);
    this.addEventListener("loadstart", val as any);
    this.#onloadstart = val;
  }

  get onprogress() {
    return this.#onprogress;
  }

  set onprogress(val: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this.removeEventListener("progress", this.#onprogress as any);
    this.addEventListener("progress", val as any);
    this.#onprogress = val;
  }

  get ontimeout() {
    return this.#ontimeout;
  }

  set ontimeout(val: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null) {
    this.removeEventListener("timeout", this.#ontimeout as any);
    this.addEventListener("timeout", val as any);
    this.#ontimeout = val;
  }

  constructor() {
    super();
    this.#onabort = null;
    this.#onerror = null;
    this.#onload = null;
    this.#onloadend = null;
    this.#onloadstart = null;
    this.#onprogress = null;
    this.#ontimeout = null;
  }
}

class XMLHttpRequestUploadForAndroid extends XMLHttpRequestEventTargetForAndroid implements XMLHttpRequestUpload {}

export class XHR extends XMLHttpRequestEventTargetForAndroid implements XMLHttpRequestForAndroid {
  private options: AndroidRequestOptions; // android请求选项
  private requestId: string | undefined; // 请求id（用于取消请求）
  private responseHeaders: Record<string, string> | undefined; // 响应头
  private cancelled = false; // 需要被取消

  #onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null;
  #readyState: number;
  response: any;
  responseText: string;
  responseType: XMLHttpRequestResponseType;
  responseURL: string;
  responseXML: Document | null;
  status: number;
  statusText: string;
  timeout: number;
  upload: XMLHttpRequestUploadForAndroid;
  withCredentials: boolean;

  readonly UNSENT: 0;
  readonly OPENED: 1;
  readonly HEADERS_RECEIVED: 2;
  readonly LOADING: 3;
  readonly DONE: 4;

  get onreadystatechange() {
    return this.#onreadystatechange;
  }

  set onreadystatechange(val: ((this: XMLHttpRequest, ev: Event) => any) | null) {
    this.removeEventListener("readystatechange", this.#onreadystatechange as any);
    this.addEventListener("readystatechange", val as any);
    this.#onreadystatechange = val;
  }

  get readyState() {
    return this.#readyState;
  }

  set readyState(val) {
    this.#readyState = val;
    this.dispatchEvent(new Event("readystatechange"));
  }

  constructor() {
    super();

    this.options = {
      url: "",
      method: "",
      headers: {},
      timeout: 0
    };

    this.#onreadystatechange = null;
    this.#readyState = 0;
    this.responseText = "";
    this.responseType = "";
    this.responseURL = "";
    this.responseXML = null;
    this.status = 0;
    this.statusText = "";
    this.upload = new XMLHttpRequestUploadForAndroid();
    this.timeout = 0;
    this.withCredentials = false;

    this.UNSENT = 0;
    this.OPENED = 1;
    this.HEADERS_RECEIVED = 2;
    this.LOADING = 3;
    this.DONE = 4;
  }

  abort(): void {
    if (this.requestId === undefined) {
      this.cancelled = true;
      return;
    }
    this.handleAbort();
  }

  getAllResponseHeaders(): string {
    if (!this.responseHeaders) return "";
    let headersText = "";
    for (const key in this.responseHeaders) {
      headersText += `${key}: ${this.responseHeaders[key]}\r\n`;
    }
    return headersText;
  }

  getResponseHeader(name: string): string | null {
    if (!this.responseHeaders) return null;
    return this.responseHeaders[name.toLowerCase()];
  }

  open(method: string, url: string | URL): void;
  open(method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null): void;
  open(method: unknown, url: unknown): void {
    this.options.method = (<string>method || "GET").toUpperCase();
    this.options.url = typeof url === "string" ? url : (<URL>url).toString();
    this.readyState = this.OPENED;
  }

  overrideMimeType(mime: string): void {
    throw new Error("Method not implemented." + mime);
  }

  async send(body?: Document | XMLHttpRequestBodyInit | null): Promise<void> {
    const { bodyContentType, bodyText, bodyBlobText, bodyMultipartList } = await handleSendBody(body);
    this.options.bodyText = bodyText;
    this.options.bodyBlobText = bodyBlobText;
    this.options.bodyMultipartList = bodyMultipartList;
    this.options.headers["content-type"] = this.options.headers["content-type"] ?? bodyContentType;
    this.options.headers["accept"] = this.options.headers["accept"] ?? "*/*";
    this.options.timeout = this.timeout;

    dsBridge.call("request", this.options, (result: string) => {
      if (this.readyState === this.DONE) return; // 请求已完成，不再接收任何响应
      const { type, data } = <AndroidRequestResult>JSON.parse(result);
      switch (type) {
        case "requestId":
          this.requestId = data;
          if (this.cancelled) this.handleAbort();
          break;
        case "uploadProgress":
          this.upload.dispatchEvent(new ProgressEvent("progress", data));
          break;
        case "downloadProgress":
          this.dispatchEvent(new ProgressEvent("progress", data));
          this.readyState = this.LOADING;
          break;
        case "response":
          this.status = data.status;
          this.statusText = data.statusText;
          this.responseHeaders = data.headers;
          this.responseURL = data.url;
          this.readyState = this.HEADERS_RECEIVED; // 该状态代表响应头已返回，但实际响应头和响应体是一起回来的，所以和完成状态放在一起
          this.readyState = this.DONE;
          try {
            switch (this.responseType) {
              case "arraybuffer":
                this.response = new TextEncoder().encode(data.body).buffer;
                break;
              case "blob":
                this.response = new Blob([data.body], { type: this.getResponseHeader("content-type") || undefined });
                break;
              case "document":
                this.response = new DOMParser().parseFromString(data.body, "text/html");
                break;
              case "json":
                this.response = JSON.parse(data.body);
                break;
              case "text":
              default:
                this.response = data.body;
            }
          } catch {
            this.response = null;
          }
          this.responseText = data.body;
          this.dispatchEventAll(new ProgressEvent("load"));
          this.dispatchEventAll(new ProgressEvent("loadend"));
          break;
        case "error":
          this.readyState = this.DONE;
          if (data === "timeout") {
            this.dispatchEventAll(new ProgressEvent("timeout"));
          } else {
            this.dispatchEventAll(new ProgressEvent("error"));
          }
          this.dispatchEventAll(new ProgressEvent("loadend"));
          break;
      }
    });

    this.dispatchEventAll(new ProgressEvent("loadstart"));
  }

  setRequestHeader(name: string, value: string): void {
    const lName = name.toLowerCase();
    const oldValue = this.options.headers[lName];
    this.options.headers[lName] = oldValue !== undefined ? `${oldValue}, ${value}` : value;
  }

  /**
   * @description: 触发所有监听该事件的对象
   * @param {Event} event 事件
   */
  private dispatchEventAll(event: Event) {
    this.dispatchEvent(event);
    this.upload.dispatchEvent(event);
  }

  /**
   * @description: 处理取消请求
   */
  private handleAbort() {
    this.#readyState = this.DONE;
    dsBridge.call("cancelRequest", this.requestId);
    this.dispatchEventAll(new ProgressEvent("abort"));
    this.dispatchEventAll(new ProgressEvent("loadend"));
  }
}

/**
 * @description: 处理发送的body数据
 * @param {Document | XMLHttpRequestBodyInit | null} body body数据
 */
async function handleSendBody(body?: Document | XMLHttpRequestBodyInit | null) {
  let bodyContentType: string | undefined = undefined;
  let bodyText: string | undefined = undefined;
  let bodyBlobText: string | undefined = undefined;
  let bodyMultipartList: (BodyMultipartField | BodyMultipartBlob)[] | undefined = undefined;

  if (body === null || body === undefined) {
    return { bodyContentType, bodyText, bodyBlobText, bodyMultipartList };
  }

  if (typeof body === "string") {
    bodyContentType = "text/plain";
    bodyText = body;
  } else if (body instanceof FormData) {
    bodyContentType = "multipart/form-data";
    bodyMultipartList = [];
    for (const [key, value] of body.entries()) {
      let bodyMultipart: BodyMultipartField | BodyMultipartBlob;
      if (value instanceof File) {
        bodyMultipart = {
          type: "blob",
          name: key,
          filePath: value.webkitRelativePath,
          fileName: value.name,
          mimeType: value.type,
          blobText: value.webkitRelativePath ? undefined : await value.text()
        };
      } else {
        bodyMultipart = {
          type: "field",
          name: key,
          value
        };
      }
      bodyMultipartList.push(bodyMultipart);
    }
  } else if (body instanceof URLSearchParams) {
    bodyContentType = "application/x-www-form-urlencoded";
    bodyText = body.toString();
  } else if (body instanceof Document) {
    bodyContentType = "text/html";
    bodyText = new XMLSerializer().serializeToString(body);
  } else if (body instanceof Blob) {
    bodyContentType = body.type;
    bodyBlobText = await body.text();
  } else {
    bodyBlobText = new TextDecoder("utf-8").decode(body);
  }

  return { bodyContentType, bodyText, bodyBlobText, bodyMultipartList };
}
