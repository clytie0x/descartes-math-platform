import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/* หน้าเนื้อหาทุกหน้า src/content/chapters/<slug>/<หน้า>.mdx
   index.mdx คือหน้าบท หน้าอื่นต้องมี num กับ title */
const chapters = defineCollection({
  loader: glob({
    pattern: "**/*.mdx",
    base: "./src/content/chapters",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
  }),
  schema: z.object({
    num: z.string().optional(),
    title: z.string().optional(),
    level: z.enum(["basic", "adv"]).optional(),
    goal: z.string().optional(),
    checklist: z.array(z.string()).optional(),
  }),
});

export const collections = { chapters };
