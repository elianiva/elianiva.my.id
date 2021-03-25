import fs from "fs"
import frontmatter, { FrontMatterResult } from "front-matter"
import path from "path"

const HAS_EXTENSION = /\.[^/.]+$/
const getPagePath = (kind: string): string =>
  path.resolve(`./src/pages/${kind}`)

interface ResultAttr {
  title: string
  date: string
  desc: string
  tags: Array<string>
  demo: string
  source: string
  layout: string
  stack: Array<Array<string>>
}

export const getResources = (kind: string) => {
  if (!kind) throw new Error("KIND IS REQUIRED!")

  return fs
    .readdirSync(getPagePath(kind))
    .filter((file: string) => !HAS_EXTENSION.test(file) && `${file}/index.svx`)
    .map((fileName: string) => {
      const postContent = fs.readFileSync(
        `${getPagePath(kind)}/${fileName}/index.svx`,
        { encoding: "utf8" }
      )

      const {
        attributes,
      }: FrontMatterResult<Partial<ResultAttr>> = frontmatter(postContent)

      return { ...attributes, slug: fileName.replace(HAS_EXTENSION, "") }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
