import esbuild from "rollup-plugin-esbuild"
import commonjs from "@rollup/plugin-commonjs"
import { nodeResolve } from "@rollup/plugin-node-resolve"
import { projRoot } from "./utils/paths"
import path from "path"
import { parallel } from "gulp"
import filesize from "rollup-plugin-filesize"
import replace from "@rollup/plugin-replace"
import { rollup } from "rollup"
import { withTaskName } from "./utils"
import { ElementPlusAlias } from "./modules"

let generateExternal = async () => {
  const { peerDependencies = {} } = await import(
    path.resolve(projRoot, "packages/element-plus/package.json")
  )
  const peerDependenciesKeys = Object.keys(peerDependencies)

  return (id) =>
    [...new Set(peerDependenciesKeys)].some(
      (pkg) => id === pkg || id.startsWith(`${pkg}/`)
    )
}
const buildFullEntry = async (minify: boolean) => {
  const { version = "default" } = await import(
    path.resolve(projRoot, "packages/element-plus/package.json")
  )
  const bundle = await rollup({
    input: path.resolve(projRoot, "packages/element-plus/index.ts"),
    plugins: [
      ElementPlusAlias(),
      nodeResolve({
        extensions: [".mjs", ".js", ".json", ".ts"],
      }),
      commonjs(),
      esbuild({
        minify,
        sourceMap: minify,
        target: "es2018",
      }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("production"),
        "process.env.version": JSON.stringify(version),
        preventAssignment: true, // 赋值操作时, 在get时再替换,默认会预先替换
      }),
      filesize(),
    ],
    external: await generateExternal(),
  })

  await Promise.all([
    bundle.write({
      format: "umd",
      file: path.resolve(
        projRoot,
        "dist/element-plus/dist",
        `index.umd${minify ? ".min" : ""}.js`
      ),
      exports: "named",
      name: "ElementPlus", // var ElementPlus = (function () {..
      globals: {
        // iife 和umd时使用
        vue: "Vue",
      },
      sourcemap: minify,
      banner: `/*! y-ElementPLus v1.0.0 */\n`,
    }),
    bundle.write({
      format: "esm",
      file: path.resolve(
        projRoot,
        "dist/element-plus/dist",
        `index.ems${minify ? ".min" : ""}.mjs`
      ),
      sourcemap: minify,
      banner: `/*! y-ElementPLus v1.0.0 */\n`,
    }),
  ])
}

export const buildFull = (minify) => async () =>
  Promise.all([buildFullEntry(minify)])

export const buildFullBundle = parallel(
  withTaskName("buildFullMinified", buildFull(true)),
  withTaskName("buildFull", buildFull(false))
)
