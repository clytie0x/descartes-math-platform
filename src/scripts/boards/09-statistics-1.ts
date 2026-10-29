/* กราฟของบทที่ 9 สถิติ (1) */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ปัดทศนิยมสองตำแหน่ง */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/* ยอดขายน้ำส้มของสามร้าน ใช้ซ้ำในหน้า 9.4 */
const SHOPS: [string, number][] = [["ร้าน ก", 84], ["ร้าน ข", 88], ["ร้าน ค", 96]];
const TOP = 100; // ค่าบนสุดของแกนตั้ง
const H = 10; // ความสูงของพื้นที่วาดแท่งในพิกัดของกราฟ

export const boards: Record<string, BoardDef> = {
  /* แผนภูมิแท่งที่เลื่อนจุดเริ่มของแกนตั้งได้ ดูว่าแกนที่ไม่เริ่มที่ศูนย์ทำให้ความต่างดูใหญ่เกินจริง */
  "c9-truncated-axis": {
    bbox: [-2.4, 11.6, 10, -1.6],
    steps: [100, 100],
    initial: { base: 0 },
    sliders: [{ key: "base", label: "แกนเริ่มที่", min: 0, max: 80, step: 10 }],
    draw(board, s, c) {
      const base = (): number => s.base ?? 0;
      const y = (v: number): number => ((v - base()) / (TOP - base())) * H;
      // แกนตั้งของ JSXGraph บอกพิกัดของกราฟ ไม่ใช่จำนวนแก้ว จึงซ่อนแล้ววาดเส้นตารางกับตัวเลขเอง
      // ชนิดข้อมูลของ JSXGraph บอกว่า defaultAxes เป็นแค่ค่าตั้ง แต่ตอนรันเป็นแกนจริงที่มี defaultTicks
      const axes = board.defaultAxes as unknown as Partial<Record<"x" | "y", JXG.Axis>>;
      axes.y?.defaultTicks.setAttribute({ visible: false });
      axes.x?.defaultTicks.setAttribute({ visible: false });
      for (let i = 0; i <= 5; i++) {
        const v = (): number => base() + (i * (TOP - base())) / 5;
        board.create("segment", [[0, (i * H) / 5], [10, (i * H) / 5]], {
          strokeColor: c.rule, strokeWidth: 1, fixed: true, highlight: false,
        });
        board.create("text", [-0.25, (i * H) / 5, () => fmt(v())], {
          anchorX: "right", anchorY: "middle", fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false,
          cssStyle: "font-family: 'IBM Plex Mono', monospace",
        });
      }
      SHOPS.forEach(([name, val], i) => {
        const x = 1.8 + i * 3.2;
        board.create("polygon", [[x - 0.8, 0], [x + 0.8, 0], [x + 0.8, () => y(val)], [x - 0.8, () => y(val)]], {
          fillColor: c.accent, fillOpacity: 0.25, highlight: false, fixed: true, vertices: { visible: false },
          borders: { strokeColor: c.accent, strokeWidth: 2, highlight: false },
        });
        board.create("text", [x, () => y(val) + 0.5, String(val)], {
          anchorX: "middle", anchorY: "middle", fontSize: 13, strokeColor: c.ink, fixed: true, highlight: false,
          cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 600",
        });
        board.create("text", [x, -0.8, name], {
          anchorX: "middle", anchorY: "middle", fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false,
        });
      });
    },
    readout(s) {
      const base = s.base ?? 0;
      const a = SHOPS[0]?.[1] ?? 84;
      const cc = SHOPS[2]?.[1] ?? 96;
      const real = fmt(cc / a);
      const look = fmt((cc - base) / (a - base));
      const head = base === 0
        ? "แกนเริ่มที่ <span class=\"m\">0</span> ความสูงของแท่งเทียบกันได้ตรงกับจำนวนแก้ว"
        : `แกนเริ่มที่ <span class="m">${base}</span> แท่งถูกตัดส่วนล่างออกไป <span class="m">${base}</span> แก้วเท่ากันทุกแท่ง`;
      return `${head}<br>ร้าน ค ขายได้เป็น <span class="m">${real}</span> เท่าของร้าน ก แต่แท่งของร้าน ค สูงเป็น <span class="m">${look}</span> เท่า`;
    },
  },
};
