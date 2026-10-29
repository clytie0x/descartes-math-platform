/* รวมกราฟจากทุกไฟล์ในโฟลเดอร์นี้ ไฟล์ละบท ชื่อไฟล์ขึ้นต้นด้วยเลขบท เช่น 25-quadratic-graphs.ts
   แต่ละไฟล์ export const boards ออกมา ชื่อกราฟต้องไม่ซ้ำกับบทอื่น ให้ขึ้นต้นด้วยเลขบท เช่น c12-net
   (กราฟของบทที่ 25 ตั้งชื่อไว้ก่อนมีกฎนี้ จึงไม่มีเลขนำหน้า) */

import type { BoardDef } from "./types.ts";

export type { BoardDef, Colors, Slider } from "./types.ts";

const files = import.meta.glob<{ boards: Record<string, BoardDef> }>("./[0-9]*.ts", { eager: true });

export const BOARDS: Record<string, BoardDef> = {};
for (const [file, mod] of Object.entries(files)) {
  for (const [name, def] of Object.entries(mod.boards)) {
    if (BOARDS[name]) throw new Error(`ชื่อกราฟ ${name} ซ้ำ เจอใน ${file}`);
    BOARDS[name] = def;
  }
}
