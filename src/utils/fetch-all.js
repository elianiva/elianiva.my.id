import fs from "fs"
import frontmatter from "front-matter"
import path from "path"

const HAS_EXTENSION = /\.[^/.]+$/
const getPagePath = kind => path.resolve(`./src/pages/${kind}`)

export const getResources = kind => {
  if (!kind) throw new Error("KIND IS REQUIRED!")

  const result = fs
    .readdirSync(getPagePath(kind))
    .filter(file => !HAS_EXTENSION.test(file) && `${file}/index.svx`)
    .map(fileName => {
      const postContent = fs.readFileSync(
        `${getPagePath(kind)}/${fileName}/index.svx`,
        {
          encoding: "utf8",
        }
      )
      const { attributes } = frontmatter(postContent)

      return {
        ...attributes,
        slug: fileName.replace(HAS_EXTENSION, ""),
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return result
}
