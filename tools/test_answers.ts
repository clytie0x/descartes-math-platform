// ทดสอบตัวตรวจคำตอบกับแบบฝึกหัดทุกข้อ ใช้ตัวตรวจตัวเดียวกับที่หน้าเว็บใช้
//     npm test
// ทุกข้อต้อง
//   รับ answer และทุกค่าใน accept
//   ปฏิเสธทุกค่าใน reject
//   ปฏิเสธทุกค่าใน wrong และขึ้นข้อความตรงกับ message ของค่านั้น
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseToml } from "smol-toml";
import { checkAnswer, type Task } from "../src/scripts/mathexpr.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT = path.join(ROOT, "src", "content", "chapters");

type Raw = Task & { accept?: unknown[]; reject?: unknown[]; steps?: string[] };

function asInput(v: unknown): string {
  return Array.isArray(v) ? v.map(String).join(", ") : String(v);
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.name === "task.toml" && path.basename(path.dirname(dir)) === "exercises" ? [p] : [];
  });
}

const failures: string[] = [];
let cases = 0;
for (const file of walk(CONTENT).sort()) {
  const task = parseToml(fs.readFileSync(file, "utf8")) as unknown as Raw;
  const where = path.relative(CONTENT, path.dirname(file)).split(path.sep).join("/");
  if (task.type === "self") continue;
  // ข้อเรียงขั้น ลำดับที่ถูกคือลำดับที่เขียนใน steps เหมือนที่ ExerciseList.astro ส่งให้หน้าเว็บ
  if (task.type === "order") task.answer = [...Array(task.steps?.length ?? 0).keys()];

  for (const good of [task.answer, ...(task.accept ?? [])]) {
    cases++;
    const v = checkAnswer(task, asInput(good));
    if (!v.ok) failures.push(`${where}: ควรรับ ${asInput(good)} แต่ได้ "${v.message}"`);
  }
  for (const bad of task.reject ?? []) {
    cases++;
    const v = checkAnswer(task, asInput(bad));
    if (v.ok) failures.push(`${where}: ควรปฏิเสธ ${asInput(bad)} แต่รับ`);
  }
  for (const w of task.wrong ?? []) {
    cases++;
    const v = checkAnswer(task, asInput(w.answer));
    if (v.ok) failures.push(`${where}: ควรปฏิเสธคำตอบผิด ${asInput(w.answer)} แต่รับ`);
    else if (v.message !== w.message) failures.push(`${where}: คำตอบ ${asInput(w.answer)} ได้ข้อความ "${v.message}" แทนที่จะเป็น "${w.message}"`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  console.error(`ไม่ผ่าน ${failures.length} จาก ${cases} กรณี`);
  process.exit(1);
}
console.log(`ตัวตรวจคำตอบผ่านทั้ง ${cases} กรณี`);
