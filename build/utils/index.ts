import { spawn } from "child_process"
import { projRoot } from "./paths"

export const withTaskName = <T>(name: string, fn: T) =>
  Object.assign(fn, { displayName: name })

export const run = async (command: string) => {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(" ")
    const app = spawn(cmd, args, {
      cwd: projRoot,
      stdio: "inherit",
      shell: true,
    })
    app.on("close", resolve)
  })
}
