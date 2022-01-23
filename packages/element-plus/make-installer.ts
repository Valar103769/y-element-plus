import { version } from "./version"
export const makeInstaller = (installables) => {
  const install = (app) => {
    installables.forEach((element) => {
      app.use(element)
    })
  }

  return {
    install,
    version,
  }
}
