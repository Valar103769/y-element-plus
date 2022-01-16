import { dest, series, src } from "gulp"
import path from "path"
import autoPrefixer from "gulp-autoprefixer"
import gulpSass from "gulp-sass"
import dartSass from "sass"
import cleanCss from "gulp-clean-css"
import chalk from "chalk"
import { projectRoot } from "../../build/utils/paths"

const sass = gulpSass(dartSass)

const buildOutput = path.resolve(projectRoot, "dist")
const distBundle = path.resolve(buildOutput, "./element-plus/theme-chalk")

// scss -> css
// -> packages/theme-chalk/lib
function compileToLib() {
  return src("./src/*.scss")
    .pipe(sass.sync())
    .pipe(autoPrefixer())
    .pipe(
      cleanCss({}, (details) => {
        // console.log(
        //   `${chalk.cyan(details.name)}: ${chalk.yellow(
        //     details.stats.originalSize / 1000
        //   )} KB -> ${chalk.green(details.stats.minifiedSize / 1000)} KB`
        // )
      })
    )
    .pipe(dest("./lib"))
}
function copyFontToLib() {
  return src("./src/fonts/**").pipe(dest("./lib/fonts"))
}

// packages/theme-chalk/lib to dist/theme-chalk
function copyLibToDist() {
  return src("./lib/**").pipe(dest(distBundle))
}

function copySrcToDist() {
  return src("./src/**").pipe(dest(path.resolve(distBundle, "./src")))
}

export default series(compileToLib, copyFontToLib, copyLibToDist, copySrcToDist)
