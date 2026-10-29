/* ตั้งค่าการแปลงสูตรที่ใช้ร่วมกันทั้ง MDX และข้อความใน task.toml
   ถ้าสูตรไหนผิด build ต้องพัง ไม่ปล่อยกล่องสีแดงขึ้นเว็บ */

import rehypeKatex from "rehype-katex";
import type { Root } from "hast";
import type { VFile } from "vfile";

export const katexOptions = {
  // ข้อความไทยใน \text{} เป็นเรื่องปกติของเว็บนี้ ที่เหลือให้เป็น error
  strict: (code: string): "ignore" | "error" => (code === "unicodeTextInMathMode" ? "ignore" : "error"),
};

export function rehypeKatexStrict() {
  const transform = rehypeKatex(katexOptions) as unknown as (tree: Root, file: VFile) => void;
  return (tree: Root, file: VFile): void => {
    transform(tree, file);
    const bad = file.messages.filter((m) => m.source === "rehype-katex");
    if (bad.length) {
      const where = file.path ? `${file.path}\n` : "";
      throw new Error(`สูตรผิด ${bad.length} ที่\n${where}` + bad.map((m) => `  ${m.cause instanceof Error ? m.cause.message : m.reason}`).join("\n"));
    }
  };
}

/* ห่อตารางด้วย div.table-wrap ให้เลื่อนแนวนอนได้บนจอแคบ */
export function rehypeWrapTables() {
  return (tree: Root): void => {
    const walk = (node: Root | Root["children"][number]): void => {
      if (!("children" in node)) return;
      node.children = node.children.map((child) => {
        if (child.type === "element" && child.tagName === "table") {
          return { type: "element", tagName: "div", properties: { className: ["table-wrap"] }, children: [child] };
        }
        walk(child);
        return child;
      }) as typeof node.children;
    };
    walk(tree);
  };
}
