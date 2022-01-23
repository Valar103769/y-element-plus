import installer from "./defaults"
export * from "@y-element-plus/components"

export { makeInstaller } from "./make-installer"

export const install = installer.install
export const version = installer.version
export default installer
