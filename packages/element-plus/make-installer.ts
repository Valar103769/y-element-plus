export const makeInstaller = async (installables) => {
  const install = (app) => {
    installables.forEach((element) => {
      app.use(element)
    })
  }

  return {
    install,
    version: process.env.version,
  }
}
