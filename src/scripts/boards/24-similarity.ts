/* กราฟของบทที่ 24 ความคล้าย
   ย่อหรือขยายรูปสามเหลี่ยมมุมฉาก ABC ที่มีด้าน 3 4 5 ด้วยอัตราส่วน k ดูว่าด้านเปลี่ยนแต่มุมเท่าเดิม */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

type XY = [number, number];

const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";
const NUM_CSS = "font-family: 'IBM Plex Mono', monospace; font-weight: 600";

/* ตัวเลขในข้อความ ปัดสองตำแหน่ง ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

/* รูปต้นแบบ มุมฉากที่ A ด้าน AB = 4 ตามแนวนอน AC = 3 ตามแนวตั้ง BC = 5 */
const ORIGIN: XY[] = [[0, 0], [4, 0], [0, 3]];
/* ภาพที่ย่อหรือขยาย วางจุด A′ ไว้ทางขวาของรูปต้นแบบ */
const IMAGE_AT: XY = [6, 0];

export const boards: Record<string, BoardDef> = {
  "c24-scale": {
    bbox: [-1, 9, 16, -3.75],
    axis: false,
    initial: { k: 1.5 },
    sliders: [{ key: "k", label: "ย่อหรือขยาย <i>k</i> เท่า", min: 0.5, max: 2, step: 0.25 }],
    draw(board, s, c) {
      const still = { fixed: true, highlight: false };
      const k = (): number => s.k ?? 1;

      // เส้นตารางหนึ่งหน่วย ช่วยนับความยาว
      const xs: number[] = [];
      const ys: number[] = [];
      for (let x = -1; x <= 16; x++) xs.push(x, x, Number.NaN), ys.push(-4, 9, Number.NaN);
      for (let y = -3; y <= 9; y++) xs.push(-1, 16, Number.NaN), ys.push(y, y, Number.NaN);
      board.create("curve", [xs, ys], { ...still, strokeColor: c.rule, strokeWidth: 1 });

      const corner = (at: () => XY): JXG.Point =>
        board.create("point", [() => at()[0], () => at()[1]], { ...still, visible: false, withLabel: false }) as JXG.Point;
      const orig = ORIGIN.map((p) => corner(() => p));
      const img = ORIGIN.map(([x, y]) => corner(() => [IMAGE_AT[0] + k() * x, IMAGE_AT[1] + k() * y]));

      const tri = (pts: JXG.Point[], color: string, opacity: number): void => {
        board.create("polygon", pts, {
          ...still, fillColor: color, fillOpacity: opacity, vertices: { visible: false },
          borders: { strokeColor: color, strokeWidth: 3, ...still },
        });
      };
      tri(orig, c.teal, 0.18);
      tri(img, c.accent, 0.22);

      // มุมที่เท่ากันใช้สีเดียวกัน มุมฉากที่ A เป็นสี่เหลี่ยมเล็ก
      for (const p of [orig, img]) {
        const [a, b, cc] = p as [JXG.Point, JXG.Point, JXG.Point];
        board.create("angle", [b, a, cc], {
          ...still, radius: 0.45, orthoType: "square", withLabel: false, name: "",
          fillColor: c.ink, fillOpacity: 0.12, strokeColor: c.ink, strokeWidth: 1.5,
        });
        board.create("angle", [cc, b, a], {
          ...still, radius: 0.7, withLabel: false, name: "",
          fillColor: c.violet, fillOpacity: 0.3, strokeColor: c.violet, strokeWidth: 1.5,
        });
        board.create("angle", [a, cc, b], {
          ...still, radius: 0.6, withLabel: false, name: "",
          fillColor: c.ink3, fillOpacity: 0.25, strokeColor: c.ink3, strokeWidth: 1.5,
        });
      }

      const text = (at: () => XY, content: () => string, css: string, size: number): void => {
        board.create("text", [() => at()[0], () => at()[1], content], {
          ...still, anchorX: "middle", anchorY: "middle", fontSize: size, strokeColor: c.ink, cssStyle: css,
        });
      };
      const name = (at: () => XY, label: string): void => text(at, () => label, LABEL_CSS, 18);
      const len = (at: () => XY, value: () => number): void => text(at, () => fmt(value()), NUM_CSS, 13);

      // ชื่อจุดยอดและความยาวด้านของรูปต้นแบบ
      name(() => [-0.45, -0.45], "A");
      name(() => [4.4, -0.45], "B");
      name(() => [-0.45, 3.4], "C");
      len(() => [2, -0.65], () => 4);
      len(() => [-0.5, 1.5], () => 3);
      len(() => [2.35, 1.95], () => 5);

      // ชื่อจุดยอดและความยาวด้านของภาพ
      const [ix, iy] = IMAGE_AT;
      name(() => [ix - 0.45, iy - 0.45], "A′");
      name(() => [ix + 4 * k() + 0.5, iy - 0.45], "B′");
      name(() => [ix - 0.45, iy + 3 * k() + 0.4], "C′");
      len(() => [ix + 2 * k(), iy - 0.65], () => 4 * k());
      len(() => [ix - 0.6, iy + 1.5 * k()], () => 3 * k());
      len(() => [ix + 2 * k() + 0.35, iy + 1.5 * k() + 0.45], () => 5 * k());
    },
    readout(s) {
      const k = s.k ?? 1;
      const m = (html: string): string => `<span class="m">${html}</span>`;
      const ratio = (img: string, org: string, a: number, b: number): string =>
        m(`<i>${img}</i> ÷ <i>${org}</i> = ${fmt(a)} ÷ ${fmt(b)} = ${fmt(a / b)}`);
      const head = k === 1
        ? "ขนาดเท่าเดิม รูปทั้งสองเท่ากันทุกประการ"
        : `${k > 1 ? "ขยาย" : "ย่อ"}เป็น ${m(fmt(k))} เท่าของรูปต้นแบบ`;
      const sides = [
        ratio("A′B′", "AB", 4 * k, 4),
        ratio("A′C′", "AC", 3 * k, 3),
        ratio("B′C′", "BC", 5 * k, 5),
      ].join("  ");
      const angles = `มุมเท่าเดิมทุกมุม ${m("90°")} ประมาณ ${m("37°")} และประมาณ ${m("53°")}`;
      const area = `พื้นที่จาก ${m("6")} เป็น ${m(fmt(6 * k * k))} ตารางหน่วย คือ ${m(fmt(k * k))} เท่า`;
      return `${head}<br>${sides}<br>${angles}<br>${area}`;
    },
  },
};
