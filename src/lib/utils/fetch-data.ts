import matter from "gray-matter";

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

const POSTS = import.meta.globEager("/src/routes/post/**/index.svx", {
  assert: { type: "raw" },
});
const PROJECTS = import.meta.globEager("/src/routes/project/**/index.svx", {
  assert: { type: "raw" },
});

export const getResourcesAsync = async (
  kind: ResourceKind
): Promise<ResourceMetadata[]> => {
  if (!kind) throw new Error("KIND IS REQUIRED!");

  const validFiles = kind === "post" ? POSTS : PROJECTS;
  const fileMetadata = Object.keys(validFiles).map(
    async (fileName): Promise<ResourceMetadata> => {
      const postContent = validFiles[fileName] as unknown as string;
      const { data } = matter(postContent);
      const slug = fileName.replace(
        new RegExp(`/src/routes/${kind}/(.*)/index.svx`),
        "$1"
      );

      return {
        ...(data as ResourceMetadata),
        slug,
      };
    }
  );

  const result = await Promise.all(fileMetadata);

  return result
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .filter((post) => (kind === "post" ? !post.draft : true));
};
