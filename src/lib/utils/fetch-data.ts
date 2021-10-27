import { promises as fs } from "fs";
import matter from "gray-matter";
import path from "path";

const HAS_EXTENSION = /\.[^/.]+$/;
const getPagePath = (kind: string) => path.resolve(`./src/routes/${kind}`);

export interface Metadata {
  title: string;
  date: string;
  desc: string;
  tags: Array<string>;
  demo: string;
  source: string;
  layout: string;
  stack: Array<Array<string>>;
  slug: string;
  draft: boolean;
  type: string;
}

export const getResourcesAsync = async (
  kind: "post" | "project"
): Promise<Metadata[]> => {
  if (!kind) throw new Error("KIND IS REQUIRED!");
  const file = await fs.readdir(getPagePath(kind));

  const posts = await Promise.all(
    file
      .filter(
        (file: string) => !HAS_EXTENSION.test(file) && `${file}/index.svx`
      )
      .map(async (fileName: string): Promise<Metadata> => {
        const postContent = await fs.readFile(
          `${getPagePath(kind)}/${fileName}/index.svx`,
          { encoding: "utf8" }
        );

        const { data } = matter(postContent);

        return {
          ...(data as Metadata),
          slug: fileName.replace(HAS_EXTENSION, ""),
        };
      })
  );
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};
