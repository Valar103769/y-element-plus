element-plus 代码一直在变, 找一个较前的[commit](https://github.com/element-plus/element-plus/tree/7a9c6f38d7d4a1c434839daf3bb77856a5850547)用于学习

## 一 使用 pnpm 初始化 monorepo 环境

> 最好不要叫@element-plus, 因为 pnpm install @element-plus/components -w 会安装远程的,而不是本地

1. 根 package 不发布, 所以设置 private:true,可以不需要 name
2. packages 下的所有包都需要初始化

   `cd packages/components && pnpm init -y`

   ```json
   {
        "name": "@element-plus/components",
        "main": "index.ts"`,
   }

   ```

QA:

- .npmrc 中 shamefully-hoist = true 作用?

  使得依赖安装到 node_modules,因为 pnpm 默认使用软链来节省内存

- typings 文件目的 ?

  .ts 文件中,import xxx form 'x.vue' 时,ts 报错:找不到模块“./app.vue”或其相应的类型声明, 会去当前项目查找 .d.ts 文件

- 运行 play 项目时, 不想 cd play,而是在根目录下运行,如何设置?

  1.  play/package.json 中 具有 scripts:dev:vite
  2.  根 package.json 中添加 [pnpm -C play dev](https://www.pnpm.cn/pnpm-cli)

- 希望各 package 可以相互引用?
  1.  cd 到根目录
  2.  pnpm install @element-plus/components -w
  3.  此时,检查 node_modules 目录, 应该出现@element-plus 软链接

### 常见错误

1. Preprocessor dependency "sass" not found. Did you install it?

- `pnpm install sass -w -D`

## 二 gulp + rollup 打包

1. `pnpm install gulp @types/gulp sucrase -w -D`

   - 默认只能使用 gulpfile.js,为了支持 gulpfile.ts,需要使用[Sucrase](https://www.npmjs.com/package/sucrase), 下载安装即可,无需显式引用

2. 添加打包命令

   `"build": "gulp -f build/gulpfile.ts"`

packages 目录下的所有包都需要处理, 目前只实现了三个包, 打包概览

| 入口        | 资源类型         | 插件                                                                                                          | target | module | 出口                    |
| ----------- | ---------------- | ------------------------------------------------------------------------------------------------------------- | ------ | ------ | ----------------------- |
| components  | \*{.vue,.js,.ts} | rollup                                                                                                        | ESNext | esnext | es                      |
| components  | \*{.vue,.js,.ts} | rollup                                                                                                        | es2015 | umd    | lib                     |
| theme-chalk | .scss            | gulp-sass @types/gulp-sass gulp-autoprefixer @types/gulp-autoprefixer gulp-clean-css @types/gulp-clean-css -D | .scss  |        | /theme-chalk/index.scss |
| theme-chalk | .scss            | rollup                                                                                                        | .css   |        | /theme-chalk/css.css    |
| utils       | .ts              | rollup                                                                                                        | ESNext | esnext | /shared/index.js        |

2. 如何打包?
   `pnpm run --filter ./packages --parallel --stream build` 会寻找 ./packages 下的子包的 build 命令, build 调用 gulp,gulp 寻找 gulpfile.js, gulpfile.js 里实现针对该包的打包细节

   1. cd packages/theme-chalk && touch gulpfile.ts

### 打包样式

1. 样式全部在.scss 文件, .scss 文件全部在 them-chalk 文件夹里, components 下的组件不支持使用<style></style>书写样式

2. 存在两种引用方式

- 全量引用

```js
import "element-plus/dist/index.css"
```

- 按需引用

```js
// vite.config.ts
import AutoImport from "unplugin-auto-import/vite"
import Components from "unplugin-vue-components/vite"
import { ElementPlusResolver } from "unplugin-vue-components/resolvers"

export default {
  plugins: [
    // ...
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
}
```

所以 build 后, 这两个地方需要有样式代码
全量: `element-plus/dist/index.css`,
按需: `element-plus/es/components/icon/style/css`

> 按需的路径参考 [unplugin-vue-components/resolvers](element-plus/es/components https://github.com/antfu/unplugin-vue-components/blob/a6f61ebae736cdfbbf2bbbf88a3d14fe643c6d23/src/core/resolvers/element-plus.ts#L72) 源码而来

```js
// @filename: element-plus/es/components/icon/style/css.ts
import "@element-plus/components/base/style/css" // 服务端渲染时,不加载这个文件
import "@element-plus/theme-chalk/el-icon.css"

// element-plus/es/components/icon/style/index.ts
import "@element-plus/components/base/style"
import "@element-plus/theme-chalk/src/icon.scss"

// @element-plus/components/base/style/css.ts
import "@element-plus/theme-chalk/base.css"

// @element-plus/components/base/style/index.ts
import "@element-plus/theme-chalk/src/base.scss"
```

错误信息:

1. sucrase

2. '@y-element-plus/utils/with-install' is imported by ../packages/components/icon/index.ts, but could not be resolved – treating it as an external dependency

```js
// @file packages/components/icon/index.ts
import { withInstall } from "@y-element-plus/utils/with-install"
```

rollup 对于 import 语句的默认处理方式是: 根据 node 的查找规则, 找到依赖模块的文件路径,结合当前
的模块路径, 计算出一个相对路径, 去替换掉原先的这个字符串

`@y-element-plus/utils/with-install` => `../../xxx`
报错原因是 ,@y-element-plus 在 node_modules 下是个软连接, 无法转成相对路径, 所以查不到该模块,
需要我们手动处理,
需要手写一个 rollup 插件

```js
import { withInstall } from "@y-element-plus/utils/with-install"
```

- Error: Unexpected character '@' (Note that you need plugins to import files that are not JavaScript)

原因: 解析到

```js
// @file  components/icon/style/index.ts
import "@y-element-plus/theme-chalk/src/icon.scss"
```

会去读取 scss 文件的内容, 因不识别 @use './mixins/mixins.scss' 而产生错误
解决办法: 创建一个 rollup 插件, 使 rollup 跳过 theme-chalk 下的文件,跳过的方式是添加为外部依赖

```js
function ElementPlusAlias(): any {
  return {
    name: "element-plus-alias-plugin",

    resolveId(id: string, importer, options) {
      if (!id.startsWith("@y-element-plus")) return

      if (id.startsWith("@y-element-plus/theme-chalk")) {
        return {
          id: id.replaceAll("@y-element-plus", "y-element-plus"),
          external: "absolute",
        }
      }
      return this.resolve(id, importer, { skipSelf: true, ...options })
    },
  }
}
```
