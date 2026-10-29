/* แปลงข้อความ Markdown ที่มีสูตร เช่นโจทย์ในแบบฝึกหัดหรือเช็กลิสต์ใน frontmatter เป็น HTML
   ใช้สูตรแบบเดียวกับหน้า MDX คือ $...$ กับ $$...$$ */

import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import type { ElementContent, Root as HtmlRoot, RootContent } from "hast";
import type { Root as MarkdownRoot, Nodes as MarkdownNode } from "mdast";
import type { VFile } from "vfile";
import { rehypeKatexStrict, rehypeWrapTables } from "./math.ts";

type HtmlMathData = { htmlMathRanges?: [number, number][] };
const mathParser = unified().use(remarkParse).use(remarkMath);

// Only raw HTML needs a second math pass. Markdown text has already consumed
// escapes, so reparsing all HAST text would turn literal \$ into formulas.
function remarkHtmlMathRanges() {
  return (tree: MarkdownRoot, file: VFile): void => {
    const ranges: [number, number][] = [];
    const walk = (node: MarkdownNode): void => {
      if (node.type === "html" && node.position?.start.offset !== undefined && node.position.end.offset !== undefined) {
        ranges.push([node.position.start.offset, node.position.end.offset]);
      }
      if ("children" in node) node.children.forEach(walk);
    };
    walk(tree);
    (file.data as HtmlMathData).htmlMathRanges = ranges;
  };
}

function rehypeHtmlMath() {
  return (tree: HtmlRoot, file: VFile): void => {
    const ranges = (file.data as HtmlMathData).htmlMathRanges ?? [];
    const walk = (node: HtmlRoot | RootContent): void => {
      if (!("children" in node)) return;
      if (node.type === "element" && ["code", "pre", "svg", "math", "script", "style", "textarea"].includes(node.tagName)) return;
      for (let index = 0; index < node.children.length; index++) {
        const child = node.children[index]!;
        if (child.type !== "text" || !child.value.includes("$") || child.position?.start.offset === undefined || child.position.end.offset === undefined) {
          walk(child);
          continue;
        }
        const start = child.position.start.offset;
        const end = child.position.end.offset;
        if (!ranges.some(([from, to]) => start >= from && end <= to)) continue;

        const replacements: ElementContent[] = [];
        let cursor = 0;
        const collect = (part: MarkdownNode): void => {
          if ((part.type === "inlineMath" || part.type === "math") && part.position?.start.offset !== undefined && part.position.end.offset !== undefined) {
            const from = part.position.start.offset;
            const to = part.position.end.offset;
            if (from > cursor) replacements.push({ type: "text", value: child.value.slice(cursor, from) });
            replacements.push({
              type: "element", tagName: "code",
              properties: { className: ["language-math", part.type === "math" ? "math-display" : "math-inline"] },
              children: [{ type: "text", value: part.value }],
            });
            cursor = to;
          } else if ("children" in part) part.children.forEach(collect);
        };
        collect(mathParser.parse(child.value));
        if (cursor < child.value.length) replacements.push({ type: "text", value: child.value.slice(cursor) });
        node.children.splice(index, 1, ...replacements);
        index += replacements.length - 1;
      }
    };
    walk(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkHtmlMathRanges)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeHtmlMath)
  .use(rehypeKatexStrict)
  .use(rehypeWrapTables)
  .use(rehypeStringify);

export function md(text: string, where = ""): string {
  try {
    return String(processor.processSync(text.trim()));
  } catch (e) {
    throw new Error(`${where}\n${(e as Error).message}`);
  }
}

/* แบบในบรรทัด ไม่ห่อด้วย <p> ใช้กับตัวเลือก หัวข้อ และเช็กลิสต์ */
export function mdInline(text: string, where = ""): string {
  const html = md(text, where);
  const m = /^<p>([\s\S]*)<\/p>$/.exec(html);
  return m ? (m[1] ?? "") : html;
}
