// ตรวจเว็บที่ build แล้วใน dist (หรือโฟลเดอร์ใน DC_OUT)
//     node tools/check_dist.ts
// ทุกหน้าต้อง
//   มี <h1> หนึ่งตัว
//   ไม่มี id ซ้ำ
//   ลิงก์ภายในชี้ไปหน้าที่มีจริง และ #ส่วนท้าย ต้องมี id นั้นในหน้าปลายทาง
//   ไม่มีสูตรที่ KaTeX อ่านไม่ออก
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const DIST = path.resolve(ROOT, process.env.DC_OUT ?? "dist");

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    if (d.isDirectory()) return walk(p);
    return d.name.endsWith(".html") ? [p] : [];
  });
}

interface Parsed {
  ids: string[];
  links: string[];
  h1: number;
  katexError: boolean;
}

function parse(html: string): Parsed {
  // ไม่นับสิ่งที่อยู่ใน <script> เช่น JSON ของปุ่มก่อนหน้าถัดไป
  const body = html.replace(/<script[\s\S]*?<\/script>/g, "");
  const attr = (name: string): string[] =>
    [...body.matchAll(new RegExp(`\\s${name}="([^"]*)"`, "g"))].map((m) => m[1] ?? "");
  return {
    ids: attr("id"),
    links: [...attr("href"), ...attr("src")],
    h1: (body.match(/<h1[\s>]/g) ?? []).length,
    katexError: body.includes("katex-error"),
  };
}

const pages = new Map<string, Parsed>();
for (const f of walk(DIST)) {
  pages.set(path.relative(DIST, f).split(path.sep).join("/"), parse(fs.readFileSync(f, "utf8")));
}

function target(from: string, link: string): string | null {
  const [p = ""] = link.split(/[?#]/);
  if (!p) return from;
  const abs = p.startsWith("/") ? p.slice(1) : path.posix.join(path.posix.dirname(from), p);
  const clean = path.posix.normalize(decodeURI(abs));
  if (clean.endsWith("/") || clean === ".") return path.posix.join(clean, "index.html");
  if (fs.existsSync(path.join(DIST, clean))) return clean;
  return null;
}

const errors: string[] = [];
if (!pages.size) errors.push(`${DIST}: ไม่มีหน้า HTML ให้ตรวจ build อาจไม่สำเร็จ`);
for (const [file, p] of pages) {
  if (p.h1 !== 1) errors.push(`${file}: มี <h1> ${p.h1} ตัว ต้องมีหนึ่งตัว`);
  const dupes = [...new Set(p.ids.filter((id, i) => p.ids.indexOf(id) !== i))];
  if (dupes.length) errors.push(`${file}: id ซ้ำ ${dupes.join(" ")}`);
  if (p.katexError) errors.push(`${file}: มีสูตรที่ KaTeX อ่านไม่ออก`);
  for (const link of p.links) {
    if (/^[a-z]+:/i.test(link) || link.startsWith("//") || link.startsWith("data:")) continue;
    if (link.startsWith("/_astro/")) {
      if (!fs.existsSync(path.join(DIST, link))) errors.push(`${file}: ไม่มีไฟล์ ${link}`);
      continue;
    }
    const t = target(file, link);
    if (!t || (t.endsWith(".html") && !pages.has(t)) || (!t.endsWith(".html") && !fs.existsSync(path.join(DIST, t)))) {
      errors.push(`${file}: ลิงก์ ${link} ชี้ไปหน้าที่ไม่มี`);
      continue;
    }
    const frag = link.includes("#") ? decodeURIComponent(link.split("#")[1] ?? "") : "";
    if (frag && t.endsWith(".html") && !pages.get(t)?.ids.includes(frag)) {
      errors.push(`${file}: ลิงก์ ${link} ไม่มี id #${frag} ในหน้านั้น`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`ไม่ผ่าน ${errors.length} จุด`);
  process.exit(1);
}
console.log(`ตรวจ ${pages.size} หน้าใน ${path.relative(ROOT, DIST) || "."} ผ่าน`);
