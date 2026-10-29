/* โครงทั้งเว็บ อ่าน src/site.toml กับเนื้อหาใน src/content/chapters แล้วคืนลำดับหน้าทั้งหมด
   ใช้ตอน build เท่านั้น */

import fs from "node:fs";
import { getCollection, type CollectionEntry } from "astro:content";
import { parse } from "smol-toml";
import { loadExercises, type Exercise } from "./exercises.ts";

type Entry = CollectionEntry<"chapters">;

export type Level = "basic" | "adv";
export type Topic = "number" | "shape" | "data";

export interface ChapterMeta {
  num: string;
  slug: string;
  title: string;
  grade: string;
  book: string;
  topic: Topic;
  summary: string;
  levels?: Level[];
}

export interface SiteConfig {
  name: string;
  description: string;
  repo: string;
  author: string;
  home: { title: string };
  tracks: Record<Level, string[]>;
  chapters: ChapterMeta[];
}

export interface PageNode {
  kind: "chapter" | "page" | "exercises";
  url: string;
  num: string;
  title: string;
  label: string; // ชื่อเต็มที่ใช้ในแท็บ หัวหน้า และปุ่มก่อนหน้าถัดไป
  level?: Level;
  goal?: string;
  chapter: ChapterNode;
  entry?: CollectionEntry<"chapters">;
  source: string; // ไฟล์ต้นฉบับ ใช้กับลิงก์แก้บน GitHub
}

export interface ChapterNode {
  meta: ChapterMeta;
  url: string;
  self: PageNode;
  pages: PageNode[]; // ไม่รวมหน้าบทเอง หน้าแบบฝึกหัดอยู่ท้ายสุด
  exercises: Exercise[];
}

export interface Neighbors {
  prev?: PageNode;
  next?: PageNode;
}

export interface Site {
  config: SiteConfig;
  chapters: ChapterNode[]; // เฉพาะบทที่เขียนแล้ว
  all: PageNode[];
  neighbors: Map<string, Record<"all" | Level, Neighbors>>;
}

const NUM = (s: string): number[] => s.split(".").map(Number);
const byNum = (a: { num: string }, b: { num: string }): number => {
  const [x, y] = [NUM(a.num), NUM(b.num)];
  return (x[0] ?? 0) - (y[0] ?? 0) || (x[1] ?? 0) - (y[1] ?? 0);
};

let cache: Promise<Site> | undefined;

export function loadSite(): Promise<Site> {
  cache ??= build();
  return cache;
}

async function build(): Promise<Site> {
  const config = parse(fs.readFileSync("src/site.toml", "utf8")) as unknown as SiteConfig;
  const only = process.env.DC_ONLY;
  const entries: Entry[] = await getCollection("chapters");
  const exercises = loadExercises();
  const chapters: ChapterNode[] = [];

  for (const meta of config.chapters) {
    if (only && meta.slug !== only) continue;
    const mine = entries.filter((e: Entry) => e.id.startsWith(meta.slug + "/") && e.id.split("/").length === meta.slug.split("/").length + 1);
    const index = mine.find((e: Entry) => e.id === `${meta.slug}/index`);
    if (!index) continue; // บทที่ยังไม่ได้เขียน
    const url = `/${meta.slug}/`;
    const node = { meta, url, pages: [], exercises: exercises.get(meta.slug) ?? [] } as unknown as ChapterNode;
    node.self = {
      kind: "chapter", url, num: meta.num, title: meta.title, label: meta.title, chapter: node, entry: index,
      source: `src/content/chapters/${meta.slug}/index.mdx`,
    };
    const pages = mine.filter((e: Entry) => e !== index).map((e: Entry): PageNode => {
      const d = e.data;
      if (!d.num || !d.title) throw new Error(`${e.id}.mdx ต้องมี num กับ title ใน frontmatter`);
      if (!d.num.startsWith(meta.num + ".")) throw new Error(`${e.id}.mdx num ${d.num} ไม่ได้ขึ้นต้นด้วยเลขบท ${meta.num}`);
      return {
        kind: "page", url: `/${e.id}/`, num: d.num, title: d.title, label: `${d.num} ${d.title}`,
        ...(d.level ? { level: d.level } : {}), ...(d.goal ? { goal: d.goal } : {}),
        chapter: node, entry: e, source: `src/content/chapters/${e.id}.mdx`,
      };
    });
    pages.sort(byNum);
    if (node.exercises.length) {
      const num = `${meta.num}.${pages.length + 1}`;
      pages.push({
        kind: "exercises", url: `/${meta.slug}/exercises/`, num, title: "แบบฝึกหัด", label: `${num} แบบฝึกหัด`,
        goal: `${node.exercises.length} ข้อ เว็บตรวจคำตอบให้ทันที`, chapter: node,
        source: `src/content/chapters/${meta.slug}/exercises`,
      });
    }
    node.pages = pages;
    chapters.push(node);
  }

  const flatten = (chs: ChapterNode[], level?: Level): PageNode[] =>
    chs.flatMap((c) => [c.self, ...c.pages.filter((p) => !level || !p.level || p.level === level)]);
  const all = flatten(chapters);

  // ลำดับของแต่ละสาย ม.ต้น เหมือนกันทุกสาย ม.ปลาย เรียงตามหนังสือของสายนั้น
  const lower = chapters.filter((c) => !c.meta.levels);
  const trackOrder = (level: Level): PageNode[] => {
    const upper = config.tracks[level].map((n) => chapters.find((c) => c.meta.num === n)).filter((c): c is ChapterNode => !!c);
    return flatten([...lower, ...upper], level);
  };
  const seqs = { all, basic: trackOrder("basic"), adv: trackOrder("adv") };
  const neighbors = new Map<string, Record<"all" | Level, Neighbors>>();
  for (const p of all) {
    const rec = {} as Record<"all" | Level, Neighbors>;
    for (const [k, seq] of Object.entries(seqs) as ["all" | Level, PageNode[]][]) {
      const i = seq.indexOf(p);
      if (i < 0) continue;
      rec[k] = { ...(seq[i - 1] ? { prev: seq[i - 1] } : {}), ...(seq[i + 1] ? { next: seq[i + 1] } : {}) };
    }
    neighbors.set(p.url, rec);
  }
  return { config, chapters, all, neighbors };
}

export const TOPIC_NAMES: Record<Topic, string> = { number: "ตัวเลขและสมการ", shape: "รูปและการวัด", data: "ข้อมูลและโอกาส" };
export const LEVEL_NAMES: Record<Level, string> = { basic: "พื้นฐาน", adv: "เพิ่มเติม" };
export const shortTitle = (t: string): string => t.replace(/^บทที่\s*\S+\s*/, "");
