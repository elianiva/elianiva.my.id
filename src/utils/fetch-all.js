import fs from "fs"
import frontmatter from "front-matter"

const HAS_EXTENSION = /\.[^/.]+$/

export const getResources = kind => {
  if (!kind) throw new Error("KIND IS REQUIRED!")

  const result = fs
    .readdirSync(`./src/pages/${kind}`)
    .filter(file => !HAS_EXTENSION.test(file) && `${file}/index.svx`)
    .map(fileName => {
      const postContent = fs.readFileSync(`./src/pages/${kind}/${fileName}/index.svx`, {
        encoding: "utf8",
      })
      const { attributes } = frontmatter(postContent)

      return {
        ...attributes,
        slug: fileName.replace(HAS_EXTENSION, ""),
      }
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return result
}
