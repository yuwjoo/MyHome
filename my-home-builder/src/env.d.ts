/// <reference types="vite/client" />

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

/**
 * unplugin-icons 虚拟模块类型声明
 * 通过 ~icons/<collection>/<icon> 引入的 SVG 图标组件
 */
declare module "~icons/*" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}
