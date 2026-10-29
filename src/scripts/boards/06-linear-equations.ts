/* กราฟของบทที่ 6 สมการเชิงเส้นตัวแปรเดียว
   ตาชั่งสองแขน วางกล่องปริศนาหนัก x กิโลกรัม กับตุ้มน้ำหนักลูกละ 1 กิโลกรัม ได้ทั้งสองข้าง
   ข้างที่หนักกว่าจะลดต่ำลง แขนตาชั่งอยู่ในแนวนอนเมื่อสองข้างหนักเท่ากันเท่านั้น */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

const MAX_BOX = 5;
const MAX_WEIGHT = 12;
const PIVOT_Y = 1.6; // จุดหมุนของแขนตาชั่ง
const ARM = 3.9; // ครึ่งหนึ่งของความยาวแขน
const PAN = 1.75; // ครึ่งหนึ่งของความกว้างจาน
const POST = 0.35; // เสาสั้นระหว่างปลายแขนกับจาน
const OFF = 1000; // ของที่ยังไม่ได้วาง ซ่อนไว้นอกกรอบ

function txt(n: number): string {
  return String(n).replace("-", "−");
}

/* นิพจน์ของของบนจานหนึ่งข้าง เช่น 3x + 2 */
function side(box: number, weight: number): string {
  const x = "<i>x</i>";
  const b = box === 0 ? "" : box === 1 ? x : `${box}${x}`;
  if (!b) return txt(weight);
  return weight === 0 ? b : `${b} + ${weight}`;
}

function hideAxes(board: JXG.Board): void {
  const axes = board.defaultAxes as unknown as Record<string, JXG.GeometryElement & { defaultTicks?: JXG.GeometryElement }>;
  for (const ax of Object.values(axes)) {
    ax.defaultTicks?.setAttribute({ visible: false });
    ax.setAttribute({ visible: false });
  }
}

function balance(initial: Record<string, number>): BoardDef {
  return {
    bbox: [-6, 4.4, 6, -0.6],
    initial,
    sliders: [
      { key: "lb", label: "กล่องข้างซ้าย", min: 0, max: MAX_BOX, step: 1 },
      { key: "lw", label: "ตุ้มข้างซ้าย", min: 0, max: MAX_WEIGHT, step: 1 },
      { key: "rb", label: "กล่องข้างขวา", min: 0, max: MAX_BOX, step: 1 },
      { key: "rw", label: "ตุ้มข้างขวา", min: 0, max: MAX_WEIGHT, step: 1 },
      { key: "show", label: "เปิดดูน้ำหนักกล่อง", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      hideAxes(board);
      const x = (): number => s.x ?? 3;
      const diff = (): number => ((s.lb ?? 0) * x() + (s.lw ?? 0)) - ((s.rb ?? 0) * x() + (s.rw ?? 0));
      // มุมเอียง ข้างซ้ายหนักกว่าได้มุมบวก ปลายซ้ายจึงลดลง
      const tilt = (): number => Math.max(-0.26, Math.min(0.26, diff() * 0.05));
      const endX = (dir: number): number => dir * ARM * Math.cos(tilt());
      const endY = (dir: number): number => PIVOT_Y + dir * ARM * Math.sin(tilt());
      const panY = (dir: number): number => endY(dir) + POST;
      // ระยะของที่วางบนจานคิดเป็นพิกเซล ของจะได้ชิดกันพอดีทั้งบนมือถือและบนคอม
      const px = (p: number): number => p / board.unitX;
      const py = (p: number): number => p / board.unitY;

      const fixed = { fixed: true, highlight: false };
      board.create("segment", [[-2.2, 0], [2.2, 0]], { ...fixed, strokeColor: c.ink, strokeWidth: 3 });
      board.create("polygon", [[-0.6, 0], [0.6, 0], [0, PIVOT_Y]], {
        ...fixed, fillColor: c.ink3, fillOpacity: 0.25,
        borders: { strokeColor: c.ink, strokeWidth: 2, highlight: false },
        vertices: { visible: false },
      });
      board.create("segment", [[() => endX(-1), () => endY(-1)], [() => endX(1), () => endY(1)]], {
        ...fixed, strokeColor: c.ink, strokeWidth: 4,
      });
      board.create("point", [0, PIVOT_Y], {
        ...fixed, withLabel: false, size: 4, fillColor: c.paper, strokeColor: c.ink, strokeWidth: 2,
      });

      for (const dir of [-1, 1]) {
        const boxes = (): number => (dir < 0 ? s.lb : s.rb) ?? 0;
        const weights = (): number => (dir < 0 ? s.lw : s.rw) ?? 0;
        board.create("segment", [[() => endX(dir), () => endY(dir)], [() => endX(dir), () => panY(dir)]], {
          ...fixed, strokeColor: c.ink, strokeWidth: 2,
        });
        board.create("segment", [[() => endX(dir) - PAN, () => panY(dir)], [() => endX(dir) + PAN, () => panY(dir)]], {
          ...fixed, strokeColor: c.ink, strokeWidth: 5,
        });

        // กล่องเรียงแถวเดียวบนจาน
        for (let i = 0; i < MAX_BOX; i++) {
          const bx = (): number => (i < boxes() ? endX(dir) + (i - (boxes() - 1) / 2) * px(19) : OFF);
          const by = (): number => (i < boxes() ? panY(dir) + py(12) : OFF);
          board.create("point", [bx, by], {
            ...fixed, withLabel: false, face: "[]", size: 8,
            fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
          });
          board.create("text", [bx, by, () => ((s.show ?? 0) > 0 ? txt(x()) : "x")], {
            ...fixed, anchorX: "middle", anchorY: "middle", fontSize: 12, strokeColor: c.paper,
            cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-style: italic",
          });
        }

        // ตุ้มเรียงแถวละ 6 ลูก วางบนกล่อง หรือบนจานถ้าไม่มีกล่อง
        for (let j = 0; j < MAX_WEIGHT; j++) {
          const row = Math.floor(j / 6);
          const col = j % 6;
          const inRow = (): number => Math.min(6, weights() - row * 6);
          const base = (): number => panY(dir) + py(boxes() > 0 ? 32 : 9);
          board.create("point", [
            () => (j < weights() ? endX(dir) + (col - (inRow() - 1) / 2) * px(13) : OFF),
            () => (j < weights() ? base() + row * py(13) : OFF),
          ], {
            ...fixed, withLabel: false, face: "o", size: 6,
            fillColor: c.teal, strokeColor: c.ink, strokeWidth: 1.2,
          });
        }
      }
    },
    readout(s) {
      const x = s.x ?? 3;
      const lb = s.lb ?? 0;
      const lw = s.lw ?? 0;
      const rb = s.rb ?? 0;
      const rw = s.rw ?? 0;
      const left = lb * x + lw;
      const right = rb * x + rw;
      const eq = left === right ? "=" : "≠";
      const state = left === right
        ? "สมดุล สองข้างหนักเท่ากัน"
        : left > right ? "เอียงลงทางซ้าย ข้างซ้ายหนักกว่า" : "เอียงลงทางขวา ข้างขวาหนักกว่า";
      const weigh = (s.show ?? 0) > 0
        ? `<br>กล่องละ <span class="m">${txt(x)}</span> กิโลกรัม ข้างซ้ายหนัก <span class="m">${txt(left)}</span> ข้างขวาหนัก <span class="m">${txt(right)}</span> กิโลกรัม`
        : "";
      return `<span class="m">${side(lb, lw)} ${eq} ${side(rb, rw)}</span>  ${state}${weigh}`;
    },
  };
}

export const boards: Record<string, BoardDef> = {
  /* 3x + 2 = 11 */
  "c6-balance": balance({ x: 3, lb: 3, lw: 2, rb: 0, rw: 11, show: 0 }),
  /* 5x + 1 = 2x + 10 */
  "c6-balance-both": balance({ x: 3, lb: 5, lw: 1, rb: 2, rw: 10, show: 0 }),
};
