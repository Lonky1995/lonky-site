import { defineConfig, s } from "velite";

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    posts: {
      name: "Post",
      pattern: "blog/**/*.md",
      schema: s
        .object({
          title: s.string().max(200),
          slug: s.slug("posts"),
          description: s.string().max(500).optional().default(""),
          date: s.isodate(),
          category: s.string().optional().default("Uncategorized"),
          tags: s.array(s.string()).optional().default([]),
          published: s.boolean().optional().default(true),
          body: s.markdown(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/blog/${data.slug}`,
        })),
    },
  },
});
