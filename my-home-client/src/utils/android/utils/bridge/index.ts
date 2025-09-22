import { bridgeGlobal } from "./bridgeGlobal";
import { bridgeInterfaceForAndroid } from "./bridgeInterfaceForAndroid";
import "./bridgeInterfaceForWeb";

export * from "./bridgeConfig";
export * from "./bridgeEmitter";
export * from "./bridgeGlobal";

bridgeGlobal.send("ready"); // 发送Bridge就绪事件

window.addEventListener("unload", () => {
  bridgeInterfaceForAndroid.rebuild(); // 通知Android端重新构建Bridge，防止内存泄漏
});
