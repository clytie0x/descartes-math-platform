/* กราฟของบทที่ 17 ความเท่ากันทุกประการ
   เลื่อน หมุน และพลิกรูปสามเหลี่ยม ABC ไปทับรูปสามเหลี่ยม DEF ที่อยู่กับที่ */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

type XY = [number, number];

/* รูปสามเหลี่ยม ABC ก่อนเคลื่อน วางจุด A ที่จุดกำเนิด ด้าน AB ยาว 4 อยู่บนแกน x */
const SHAPE: XY[] = [[0, 0], [4, 0], [1, 3]];

/* เป้าหมาย DEF ได้จาก ABC ที่พลิกข้าม AB หมุน 90° แล้วเลื่อน A ไปที่ (2, −3) */
const TARGET: XY[] = [[2, -3], [2, 1], [5, -2]];

const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";

/* ตำแหน่งของจุดยอดที่ i หลังพลิก หมุน และเลื่อน ตามค่าใน state */
function vertex(s: Record<string, number>, i: number): XY {
  const [x0, y0] = SHAPE[i] ?? [0, 0];
  const y1 = (s.flip ?? 0) > 0 ? -y0 : y0;
  const t = ((s.rot ?? 0) * Math.PI) / 180;
  const x = x0 * Math.cos(t) - y1 * Math.sin(t);
  const y = x0 * Math.sin(t) + y1 * Math.cos(t);
  return [x + (s.px ?? 0), y + (s.py ?? 0)];
}

function fits(s: Record<string, number>): boolean {
  return TARGET.every(([x, y], i) => {
    const [vx, vy] = vertex(s, i);
    return Math.hypot(vx - x, vy - y) < 1e-6;
  });
}

export const boards: Record<string, BoardDef> = {
  "c17-overlay": {
    bbox: [-7, 5.5, 7, -5],
    initial: { px: -5, py: 0, rot: 0, flip: 0 },
    sliders: [
      { key: "rot", label: "หมุนรอบ <i>A</i> (องศา)", min: 0, max: 345, step: 15 },
      { key: "flip", label: "พลิกข้าม <i>AB</i>", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c, changed) {
      const still = { fixed: true, highlight: false };
      board.create("polygon", TARGET, {
        ...still, fillColor: c.teal, fillOpacity: 0.18,
        borders: { strokeColor: c.teal, strokeWidth: 2.5, dash: 2, highlight: false, fixed: true },
        vertices: { visible: false },
      });
      const away: XY[] = [[0.1, -0.5], [-0.5, 0.45], [0.3, 0.3]];
      TARGET.forEach(([x, y], i) => {
        const [dx, dy] = away[i] ?? [0, 0];
        board.create("text", [x + dx, y + dy, "DEF"[i] ?? ""], {
          ...still, fontSize: 18, strokeColor: c.teal, cssStyle: LABEL_CSS,
        });
      });

      const a = board.create("point", [s.px ?? 0, s.py ?? 0], {
        name: "A", size: 6, snapToGrid: true, snapSizeX: 1, snapSizeY: 1,
        fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
        label: { offset: [-18, -12], fontSize: 18, strokeColor: c.ink, cssStyle: LABEL_CSS },
      }) as JXG.Point;
      a.on("drag", () => {
        s.px = Math.round(a.X());
        s.py = Math.round(a.Y());
        changed();
      });
      const corner = (i: number, name: string): JXG.Point =>
        board.create("point", [() => vertex(s, i)[0], () => vertex(s, i)[1]], {
          ...still, name, size: 3, fillColor: c.ink, strokeColor: c.ink,
          label: { offset: [8, 10], fontSize: 18, strokeColor: c.ink, cssStyle: LABEL_CSS },
        }) as JXG.Point;
      const b = corner(1, "B");
      const cc = corner(2, "C");
      board.create("polygon", [a, b, cc], {
        ...still, fillColor: c.accent, fillOpacity: 0.3,
        borders: { strokeColor: c.accent, strokeWidth: 3, highlight: false, fixed: true },
      });
    },
    readout(s) {
      if (fits(s)) {
        return "ทับกันสนิท จุด <i>A</i> ทับ <i>D</i> จุด <i>B</i> ทับ <i>E</i> จุด <i>C</i> ทับ <i>F</i> จึงเขียนได้ว่า <span class=\"m\">△<i>ABC</i> ≅ △<i>DEF</i></span>";
      }
      const flip = (s.flip ?? 0) > 0 ? "พลิกแล้ว" : "ยังไม่พลิก";
      const turned = `หมุน <span class="m">${s.rot ?? 0}°</span> ${flip}`;
      if ((s.flip ?? 0) > 0 && (s.rot ?? 0) === 90) {
        return `${turned} รูปหันถูกทางแล้ว เหลือลากจุด <i>A</i> ไปวางที่ <i>D</i>`;
      }
      return `${turned} ลากจุด <i>A</i> เพื่อเลื่อนรูป แล้วลองหมุนหรือพลิกจนรูปหันแบบเดียวกับ <i>DEF</i>`;
    },
  },
};
