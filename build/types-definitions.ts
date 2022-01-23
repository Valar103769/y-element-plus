import { resolve } from "path"
import path from "path"
import * as vueCompiler from "vue/compiler-sfc"
import { Project } from "ts-morph"
import { projRoot } from "./utils/paths"
import glob from "fast-glob"
import fs from "fs/promises"
import type { SourceFile } from "ts-morph"

function excludeFiles(files) {
  const excludes = ["gulpfile", "dist", "node_modules", "package.json"]
  return files.filter(
    (path) => !excludes.some((exclude) => path.includes(exclude))
  )
}

export const generateTypesDefinitions = async () => {
  const project = new Project({
    compilerOptions: {
      emitDeclarationOnly: true,
      outDir: resolve(projRoot, "dist/types"),
      baseUrl: projRoot,
      // 不要忘记加  /*
      paths: {
        "@y-element-plus/*": ["packages/*"],
      },
    },
    tsConfigFilePath: resolve(projRoot, "tsconfig.json"),
    skipAddingFilesFromTsConfig: true,
  })

  const filePaths = excludeFiles(
    await glob(["**/*.{js,ts,vue}", "!element-plus/**/*"], {
      cwd: resolve(projRoot, "packages"),
      absolute: true,
      onlyFiles: true,
    })
  )

  // 指定了 packages/element-plus 但是还会输出package下的目录
  const epPaths = excludeFiles(
    await glob("**/*.{js,ts,vue}", {
      cwd: resolve(projRoot, "packages/element-plus"),
      onlyFiles: true,
    })
  )

  const sourceFiles: SourceFile[] = []

  // Adding Source Files
  await Promise.all([
    ...filePaths.map(async (file) => {
      if (file.endsWith(".vue")) {
        const content = await fs.readFile(file, "utf-8")
        const sfc = vueCompiler.parse(content)
        const { script, scriptSetup } = sfc.descriptor
        if (script || scriptSetup) {
          let content = ""
          let isTS = false
          if (script && script.content) {
            content += script.content
            if (script.lang === "ts") isTS = true
          }
          if (scriptSetup) {
            const compiled = vueCompiler.compileScript(sfc.descriptor, {
              id: "xxx",
            })
            content += compiled.content
            if (scriptSetup.lang === "ts") isTS = true
          }
          const sourceFile = project.createSourceFile(
            path.relative(process.cwd(), file) + (isTS ? ".ts" : ".js"),
            content
          )
          sourceFiles.push(sourceFile)
        }
      } else {
        // By file path
        const sourceFile = project.addSourceFileAtPath(file)
        sourceFiles.push(sourceFile)
      }
    }),
    ...epPaths.map(async (file) => {
      // By string
      const content = await fs.readFile(
        resolve(projRoot, "packages/element-plus", file),
        "utf-8"
      )
      // 类似于 rollup 的 preserveModulesRoot,
      // 官方示例使用 basename ,但是这里无效, 改成absolutePath就行, 不明白

      sourceFiles.push(
        project.createSourceFile(resolve(projRoot, "packages", file), content)
      )
    }),
  ])

  // log
  const diagnostics = project.getPreEmitDiagnostics()
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))

  // write
  await project.emit({
    emitOnlyDtsFiles: true,
  })

  const tasks = sourceFiles.map(async (sourceFile) => {
    const relativePath = path.relative(
      path.resolve(projRoot, "packages"),
      sourceFile.getFilePath()
    )

    const emitOutput = sourceFile.getEmitOutput()
    const emitFiles = emitOutput.getOutputFiles()
    if (emitFiles.length === 0) {
      console.error(`Emit no file: ${relativePath}`)
    }

    const tasks = emitFiles.map(async (outputFile) => {
      const filepath = outputFile.getFilePath()
      await fs.mkdir(path.dirname(filepath), {
        recursive: true,
      })

      await fs.writeFile(
        filepath,
        outputFile.getText().replaceAll("@y-element-plus", "y-element-plus/es"),
        "utf8"
      )
    })

    await Promise.all(tasks)
  })

  await Promise.all(tasks)
}
