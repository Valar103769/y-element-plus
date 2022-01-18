import { projRoot } from "./utils/paths"
import { rollup, OutputOptions } from "rollup"
import type { Plugin, ResolveIdHook } from "rollup"
import glob from "fast-glob"
import path from "path"
import css from "rollup-plugin-css-only"
import vue from "rollup-plugin-vue"
import commonjs from "@rollup/plugin-commonjs" // 解析node_modules 下的commonjs文件
import nodeResolve from "@rollup/plugin-node-resolve" // 解析node_modules 下的文件, 默认是main字段

const excludeFiles = (files: string[]) => {
  const excludes = ["node_modules", "gulpfile", "dist"]
  return files.filter(
    (path) => !excludes.some((exclude) => path.includes(exclude))
  )
}

function ElementPlusAlias(): any {
  return {
    name: "element-plus-alias-plugin",
    resolveId(id: string, importer: any, options: any) {
      console.log("ElementPlusAlias", id)
      if (!id.startsWith("@y-element-plus")) return

      if (id.startsWith("@y-element-plus/theme-chalk")) {
        return {
          id: id.replaceAll(
            "@y-element-plus/theme-chalk",
            "y-element-plus/theme-chalk"
          ),
          external: "absolute",
        }
      }
      // return null
      return this.resolve(id, importer, { skipSelf: true, ...options })
    },
  }
}

export const buildModules = async () => {
  const input = excludeFiles(
    await glob("**/*.{js,ts,vue}", {
      cwd: path.resolve(projRoot, "packages"),
      absolute: true,
    })
  )

  // /Users/valar/demo/z-plus-2/packages/components/icon/src/icon.ts'
  console.log("input", input)
  const inputOptions = {
    input,
    // 插件执行顺序?
    plugins: [
      // ElementPlusAlias(),
      nodeResolve(),
      commonjs(),
    ],
  }

  // https://rollupjs.org/guide/en/#big-list-of-options
  const outputOptions: OutputOptions[] = [
    {
      /** ems */
      format: "esm",
      // 多出口时, 必须指定输出的目录
      dir: path.resolve(projRoot, "dist/element-plus", "es"),
      exports: "auto", // default
      preserveModules: true,
      // /Users/valar/demo/z-plus-2/packages/element-plus
      // /Users/valar/demo/z-plus-2/dist/element-plus/es
      preserveModulesRoot: path.resolve(projRoot, "packages/element-plus"),
      sourcemap: true,
      entryFileNames: `[name].mjs`,
    },
    {
      /** cjs */
      format: "cjs",
      dir: path.resolve(projRoot, "dist/element-plus", "lib"),
      exports: "named", // rollup推荐
      preserveModules: true,
      preserveModulesRoot: path.resolve(projRoot, "packages/element-plus"),
      sourcemap: true,
      entryFileNames: `[name].js`,
    },
  ]

  const bundle = await rollup(inputOptions)
  // or write the bundle to disk
  await Promise.all(outputOptions.map((option) => bundle.write(option)))
}
