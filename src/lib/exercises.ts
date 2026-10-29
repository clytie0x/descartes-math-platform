/* อ่านแบบฝึกหัด src/content/chapters/<slug>/exercises/<NN-ชื่อข้อ>/task.toml */

import { parse } from "smol-toml";
import type { Task } from "../scripts/mathexpr.ts";

export interface Wrong {
  answer: string | number | (string | number)[];
  message: string;
}

export interface Exercise extends Task {
  slug: string; // ชื่อโฟลเดอร์ไม่มีเลขนำหน้า ใช้เป็น id
  dir: string;
  title: string;
  level?: number;
  track?: "basic" | "adv";
  statement: string;
  solution?: string;
  hints?: string[];
  choices?: string[];
  steps?: string[];
  label?: string;
  unit?: string;
  board?: string;
  board_label?: string;
}

const TYPES = new Set(["number", "expr", "set", "choice", "point", "order", "self"]);

const raw = import.meta.glob<string>("/src/content/chapters/**/exercises/*/task.toml", {
  query: "?raw",
  import: "default",
  eager: true,
});

export function loadExercises(): Map<string, Exercise[]> {
  const out = new Map<string, Exercise[]>();
  for (const [file, text] of Object.entries(raw).sort(([a], [b]) => a.localeCompare(b))) {
    const m = /^\/src\/content\/chapters\/(.+)\/exercises\/([^/]+)\/task\.toml$/.exec(file);
    if (!m) continue;
    const [, chapter = "", dir = ""] = m;
    let task: Exercise;
    try {
      task = parse(text) as unknown as Exercise;
    } catch (e) {
      throw new Error(`${file} อ่าน TOML ไม่ได้\n${(e as Error).message}`);
    }
    const problems: string[] = [];
    if (!TYPES.has(task.type)) problems.push(`type '${task.type}' ไม่รู้จัก`);
    if (!task.title) problems.push("ไม่มี title");
    if (!task.statement) problems.push("ไม่มี statement");
    if (!["self", "order"].includes(task.type) && task.answer === undefined) problems.push("ไม่มี answer");
    if (task.type === "choice" && !task.choices?.length) problems.push("ข้อแบบ choice ต้องมี choices");
    if (task.type === "order" && (task.steps?.length ?? 0) < 3) problems.push("ข้อแบบ order ต้องมี steps อย่างน้อย 3 ขั้น");
    if (task.type === "point" && !task.board) problems.push("ข้อแบบ point ต้องมี board");
    if (task.type === "self" && !task.solution) problems.push("ข้อแบบ self ต้องมี solution");
    if (problems.length) throw new Error(`${file}\n  ${problems.join("\n  ")}`);
    task.dir = dir;
    task.slug = dir.replace(/^\d+-/, "");
    if (!out.has(chapter)) out.set(chapter, []);
    out.get(chapter)?.push(task);
  }
  return out;
}
