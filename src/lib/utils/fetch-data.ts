import { promises as fs } from "fs";
import matter from "gray-matter";
import path from "path";
import pLimit from "p-limit";

const HAS_EXTENSION = /\.[^/.]+$/;
const getPagePath = (kind: string) => path.resolve(`./src/routes/${kind}`);

interface ResultAttr {
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
}

export const getResources = async (
  kind: "post" | "project"
): Promise<ResultAttr[]> => {
  if (!kind) throw new Error("KIND IS REQUIRED!");
  const file = await fs.readdir(getPagePath(kind));

  const posts = await Promise.all(
    file
      .filter(
        (file: string) => !HAS_EXTENSION.test(file) && `${file}/index.svx`
      )
      .map(async (fileName: string): Promise<ResultAttr> => {
        const postContent = await fs.readFile(
          `${getPagePath(kind)}/${fileName}/index.svx`,
          { encoding: "utf8" }
        );

        const { data } = matter(postContent);

        return {
          ...(data as ResultAttr),
          slug: fileName.replace(HAS_EXTENSION, ""),
        };
      })
  );
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};
