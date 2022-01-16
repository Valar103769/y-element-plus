import path from "path"

export const projectRoot = path.resolve(__dirname, "../../")

/** dist */
export const buildOutput = path.resolve(projectRoot, "dist")
/** dist/element-plus */
export const epOutput = path.resolve(buildOutput, "element-plus")
