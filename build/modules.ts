import { projRoot } from "./utils/paths"
import { rollup, OutputOptions } from "rollup"
import type { Plugin, ResolveIdHook } from "rollup"
import glob from "fast-glob"
import path from "path"
import filesize from "rollup-plugin-filesize"
// import vue from 'unplugin-vue/rollup'
import esbuild from "rollup-plugin-esbuild"
import css from "rollup-plugin-css-only"
import vue from "rollup-plugin-vue"
import commonjs from "@rollup/plugin-commonjs" // 解析node_modules 下的commonjs文件
import nodeResolve from "@rollup/plugin-node-resolve" // 解析node_modules 下的文件, 默认是main字段
import { cyan, bold, yellow, green } from "chalk"

const excludeFiles = (files: string[]) => {
  const excludes = ["node_modules", "gulpfile", "dist"]
  return files.filter(
    (path) => !excludes.some((exclude) => path.includes(exclude))
  )
}

const generateExternal = async () => {
  const { dependencies = {}, peerDependencies = {} } = await import(
    path.resolve(projRoot, "packages/element-plus/package.json")
  )
  console.log(dependencies, peerDependencies)

  const pkgs = [
    ...new Set([
      ...Object.keys(dependencies),
      ...Object.keys(peerDependencies),
      "element-plus/theme-chalk",
    ]),
  ]
  return (id) => pkgs.some((pkg) => id === pkg || id.startsWith(`${pkg}/`))
}

export function ElementPlusAlias(): any {
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

export const buildModules = async () => {
  const input = excludeFiles(
    await glob("**/*.{js,ts,vue}", {
      cwd: path.resolve(projRoot, "packages"),
      absolute: true,
    })
  )

  const inputOptions = {
    input,
    // 插件有执行顺序要求,先左后右
    plugins: [
      ElementPlusAlias(),
      nodeResolve({
        extensions: [".mjs", ".js", ".json", ".ts"],
      }),
      commonjs(),

      // css(),
      vue({
        target: "browser",
      }),
      esbuild({
        target: "es2018",
      }),
      // filesize({
      //   reporter: (opt, outputOptions, info) => {
      //     return `${cyan(bold(info.fileName))}: bundle size ${yellow(
      //       info.bundleSize
      //     )} -> minified ${green(info.minSize)}`
      //   },
      // }),
    ],
    external: await generateExternal(),
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
