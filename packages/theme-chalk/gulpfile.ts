import { dest, series, src, parallel } from "gulp"
import path from "path"
import autoPrefixer from "gulp-autoprefixer"
import gulpSass from "gulp-sass"
import dartSass from "sass"
import cleanCss from "gulp-clean-css"
import chalk from "chalk"
import { projRoot } from "../../build/utils/paths"

const sass = gulpSass(dartSass)

const copy = (input, output) => () => src(input).pipe(dest(output))
const buildThemeChalk = (output) => () => {
  return src(path.resolve(__dirname, "src/*.scss"))
    .pipe(sass.sync())
    .pipe(autoPrefixer({ cascade: true }))
    .pipe(
      cleanCss({}, (details) => {
        // console.log(
        //   `${chalk.cyan(details.name)}: ${chalk.yellow(
        //     details.stats.originalSize / 1000
        //   )} KB -> ${chalk.green(details.stats.minifiedSize / 1000)} KB`
        // )
      })
    )
    .pipe(dest(output))
}
const build = parallel(
  copy("src/**", path.resolve(projRoot, "dist/element-plus/theme-chalk/src/")),
  series(
    buildThemeChalk("dist/"),
    copy("dist/**", path.resolve(projRoot, "dist/element-plus/theme-chalk/"))
  )
)
export default build
