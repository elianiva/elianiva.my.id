import fs from "fs"
import matter from "gray-matter"
import path from "path"

const HAS_EXTENSION = /\.[^/.]+$/
const getPagePath = (kind: string) => path.resolve(`./src/routes/${kind}`)

interface ResultAttr {
  title: string
  date: string
  desc: string
  tags: Array<string>
  demo: string
  source: string
  layout: string
  stack: Array<Array<string>>
  slug: string
  draft: boolean
}

export const getResources = (kind: "post" | "project"): ResultAttr[] => {
  if (!kind) throw new Error("KIND IS REQUIRED!")

  return fs
    .readdirSync(getPagePath(kind))
    .filter((file: string) => !HAS_EXTENSION.test(file) && `${file}/index.svx`)
    .map(
      (fileName: string): ResultAttr => {
        const postContent = fs.readFileSync(
          `${getPagePath(kind)}/${fileName}/index.svx`,
          { encoding: "utf8" }
        )

        const { data } = matter(postContent)

        return {
          ...(data as ResultAttr),
          slug: fileName.replace(HAS_EXTENSION, ""),
        }
      }
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}
