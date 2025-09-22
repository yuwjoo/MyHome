<template>
  <div class="test-page">
    <book-reader />
  </div>
</template>

<script setup lang="ts">
// import axios from "axios";
import { bridgeInterfaceForAndroid } from "@/utils/android/utils/bridge/bridgeInterfaceForAndroid";
import BookReader from "./components/book-reader/book-reader.vue";
// import { request } from "@/utils/axios";
// import { bridgeEmitter } from "@/utils/android/utils/bridge";
// import { crawlers } from "@/utils/crawler";
import webViewBridge from "@/utils/android/utils/webViewBridge";

async function test() {
  const socket = webViewBridge.createSocket("net/test");
  socket.on("message", (msg) => {
    console.log("收到消息", msg);
  });
  socket.on("done", (msg) => {
    console.log("连接关闭", msg);
  });
  socket.connect({ aa: 3, bb: true });
}

webViewBridge.globalChannel.on("version", (result) => {
  console.log("globalChannel-version", result);
});

test();

defineOptions({
  name: "test-page"
});

bridgeInterfaceForAndroid.callMethod({
  callMethodPath: [],
  data: "33333"
});

// const name = "lengku8";

// console.log("aa", crawlers[name]);

// const CancelToken = axios.CancelToken;
// const source = CancelToken.source();

const formData = new FormData();
formData.append("keyword", "姐姐");
formData.append("page", "2");
formData.append("size", "10");

const urlParams = new URLSearchParams();
urlParams.append("keyword", "姐姐");
urlParams.append("page", "2");
urlParams.append("size", "10");

// requestApp({
//   url: "http://192.168.0.108:3000/test-post",
//   method: "post",
//   params: {
//     name: "test22",
//     age: 18
//   },
//   cancelToken: source.token,
//   headers: {
//     // "Content-Type": "text/plain"
//   },
//   data: {
//     aa: 1,
//     bb: 2
//   }
// })
//   .then((res) => {
//     console.log("请求成功", res);
//   })
//   .catch((err) => {
//     if (axios.isCancel(err)) {
//       console.log("请求被取消", err.message);
//     } else {
//       console.error("请求失败", err);
//     }
//   });

// request({
//   url: "http://192.168.0.106:3000/test-post",
//   method: "post",
//   params: {
//     name: "test22",
//     age: 18
//   },
//   cancelToken: source.token,
//   // data: {
//   //   aa: 1,
//   //   bb: 2
//   // },
//   data: urlParams,
//   sendEnv: "android"
// })
//   .then((res) => {
//     console.log("请求成功1", res);
//   })
//   .catch((err) => {
//     if (axios.isCancel(err)) {
//       console.log("请求被取消", err.message);
//     } else {
//       console.error("请求失败", err);
//     }
//   });

// setTimeout(() => {
//   source.cancel("3333");
// }, 2000);

// const apiHandler = bridgeApi.request({
//   url: "",
//   method: "",
//   headers: {},
//   timeout: 0
// });

// apiHandler.on("downloadProgress", (result) => {
//   result;
// });

// apiHandler.done("cancel");

// bridgeGlobal.on("version", (result) => {
//   console.log(result);
// });

// bridgeEmitter.connect("request", {
//   url: "",
//   method: "",
//   headers: {},
//   timeout: 0
// });

// type FlattenApiRouter<T, Prefix extends string = "", Separator extends string = "/"> = {
//   [K in keyof T]: T[K] extends any[]
//     ? { [P in `${Prefix}${K & string}`]: T[K] }
//     : T[K] extends object
//     ? FlattenApiRouter<T[K], `${Prefix}${K & string}${Separator}`>
//     : never;
// }[keyof T] extends infer R
//   ? { [P in keyof R]: R[P] }
//   : never;

// type ApiRouter = {
//   openDialog: [string, number];
//   net: {
//     request: {
//       aa: [number, any[]];
//     };
//     bb: [string];
//   };
// };

// type Api = FlattenApiRouter<ApiRouter>;

// function send<K extends keyof Api>(name: K, data: Api[K]) {
//   console.log(data);
// }

// send("");

// 使用映射类型合并联合类型
// type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

// type FlattenPath<T, Separator extends string = "/", Prefix extends string = ""> = {
//   [K in keyof T]: T[K] extends any[]
//     ? { [P in `${Prefix}${K & string}`]: T[K] }
//     : T[K] extends object
//     ? FlattenPath<T[K], Separator, `${Prefix}${K & string}${Separator}`>
//     : never;
// }[keyof T];

// type Api = UnionToIntersection<FlattenPath<ApiRouter>>;

// function send<K extends keyof Api>(name: K, data: Api[K][0]) {
//   console.log(data);
// }

// send("net/request/aa");
</script>

<style lang="scss" scoped>
.test-page {
}
</style>
