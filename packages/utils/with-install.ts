import type { App, Plugin } from "vue"; //import type 类型和值同名时, 只导入类型

// 必须导出 type 否则生成不了.d.ts
export type SFCWithInstall<T> = T & Plugin;

export const withInstall = <T>(comp: T) => {
  (comp as SFCWithInstall<T>).install = function (app: App) {
    app.component((comp as any).name, comp);
  };
  return comp as SFCWithInstall<T>;
};
