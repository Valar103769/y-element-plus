import { series, parallel } from "gulp"
import path from "path"
import { mkdir, copyFile } from "fs/promises"
import { withTaskName, run } from "./utils"
import { epOutput, projRoot } from "./utils/paths"

const runTask = (name: string) =>
  withTaskName(name, () => run(`pnpm run build ${name}`))

export const copyFullStyle = async () => {
  await mkdir(path.resolve(projRoot, "dist", "element-plus", "dist"), {
    recursive: true,
  })
  await copyFile(
    path.resolve(projRoot, "dist", "element-plus", "theme-chalk/index.css"),
    path.resolve(projRoot, "dist", "element-plus", "dist/index.css")
  )
}

export default series(
  /**
   * "clean": "rimraf dist && pnpm run clean -r --stream",
   * -r 也要执行子包里的scripts.clean
   */
  withTaskName("clean", async () => run("pnpm run clean")),

  parallel(
    runTask("buildModules"),
    runTask("buildFullBundle"),
    runTask("generateTypesDefinitions"),
    // runTask("buildHelper"),
    series(
      /* dist/element-plus/theme-chalk/ */
      withTaskName("buildThemeChalk", async () =>
        /* -C: 在 <path> 中启动 pnpm ，而不是当前的工作目录。 */
        run("pnpm run -C packages/theme-chalk build")
      ),
      copyFullStyle
    )
  )
)

export * from "./modules"
export * from "./full-bundle"
export * from "./types-definitions"
