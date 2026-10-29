import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import { defineConfig } from "astro/config";
import remarkMath from "remark-math";
import { rehypeKatexStrict, rehypeWrapTables } from "./src/lib/math.ts";

// DC_OUT กับ DC_CACHE ให้หลายคนสร้างเว็บพร้อมกันในโฟลเดอร์เดียวได้โดยไม่ทับกัน
// DC_ONLY=<slug> สร้างแค่หน้าแรกกับบทนั้นบทเดียว ใช้ตอนเขียนบทใหม่
export default defineConfig({
  site: "https://math.teerapat.codes",
  outDir: process.env.DC_OUT ?? "./dist",
  cacheDir: process.env.DC_CACHE ?? "./node_modules/.astro",
  trailingSlash: "always",
  build: { format: "directory" },
  devToolbar: { enabled: false },
  markdown: {
    // smartypants เปลี่ยนเครื่องหมายคำพูดและขีดเป็นตัวอักษรอื่น ปิดไว้ให้ข้อความออกมาตามที่เขียน
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatexStrict, rehypeWrapTables],
      smartypants: false,
    }),
  },
  integrations: [mdx()],
});
