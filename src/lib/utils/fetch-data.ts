import { promises as fs } from "fs";
import matter from "gray-matter";
import { resolve } from "path";

export interface ResourceMetadata {
  title: string;
  date: string;
  desc: string;
  tags: string[];
  demo: string;
  source: string;
  layout: string;
  stack: [string, string][];
  slug: string;
  draft: boolean;
  type: string;
}

export type ResourceKind = "post" | "project";

const HAS_EXTENSION = /\.[^/.]+$/;
const resolveFilepath = (kind: string) => resolve(`./src/routes/${kind}`);

export const getResourcesAsync = async (
  kind: ResourceKind
): Promise<ResourceMetadata[]> => {
  if (!kind) throw new Error("KIND IS REQUIRED!");
  const files = await fs.readdir(resolveFilepath(kind));
  const validFiles = files.filter(
    (file) => !HAS_EXTENSION.test(file) && `${file}/index.svx`
  );
  const fileMetadata = validFiles.map(
    async (fileName): Promise<ResourceMetadata> => {
      const postContent = await fs.readFile(
        `${resolveFilepath(kind)}/${fileName}/index.svx`,
        { encoding: "utf8" }
      );

      const { data } = matter(postContent);

      return {
        ...(data as ResourceMetadata),
        slug: fileName.replace(HAS_EXTENSION, ""),
      };
    }
  );

  const result = await Promise.all(fileMetadata);

  return result
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((post) => (kind === "post" ? !post.draft : true));
};
