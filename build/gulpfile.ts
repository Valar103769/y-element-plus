import { series } from "gulp"
import { withTaskName, run } from "./utils"

const runTask = (name: string) =>
  withTaskName(name, () => run("pnpm run build ${name}"))

export default series(
  withTaskName("clean", async () => run("pnpm run clean")),

  runTask("buildModules"),

  withTaskName("buildEachPackages", async () =>
    run("pnpm run --filter ./packages --parallel --stream build")
  )
)

export * from "./modules"
