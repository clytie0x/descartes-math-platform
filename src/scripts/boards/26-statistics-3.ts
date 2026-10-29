/* กราฟของบทที่ 26 สถิติ (3) */

import JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ปัดทศนิยมสองตำแหน่ง */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

const MONO = "font-family: 'IBM Plex Mono', monospace";

/* คะแนนสอบย่อยเต็ม 20 ของนักเรียน 11 คน ชุดเดียวกับตัวอย่าง 1 หน้า 26.1 เรียงตามลำดับที่จดมา */
const SCORES = [12, 15, 9, 18, 14, 11, 16, 13, 17, 10, 14];
const LO = 0;
const HI = 20;

/* ตำแหน่งในแนวตั้ง เส้นจำนวนอยู่ที่ 0 จุดซ้อนขึ้นไปจาก DOT_Y แผนภาพกล่องอยู่ข้างบนที่ BOX_Y */
const DOT_Y = 0.7;
const DOT_TOP = 5.6; // จุดแถวบนสุดต้องไม่สูงกว่านี้ จะได้ไม่ชนกล่อง
const BOX_Y = 7.4;
const BOX_HALF = 0.9;

function key(i: number): string {
  return `d${i}`;
}

function values(s: Record<string, number>): number[] {
  return SCORES.map((v, i) => s[key(i)] ?? v);
}

/* ควอร์ไทล์ที่ r อยู่ตำแหน่ง r(N + 1)/4 ถ้าตำแหน่งไม่เป็นจำนวนเต็ม ใช้ค่าระหว่างสองตัวที่ติดกันตามสัดส่วน */
function quartile(sorted: number[], r: number): number {
  const p = (r * (sorted.length + 1)) / 4;
  const n = Math.floor(p);
  const lo = sorted[n - 1] ?? sorted[0] ?? 0;
  const hi = sorted[n] ?? lo;
  return lo + (p - n) * (hi - lo);
}

interface Five {
  min: number;
  q1: number;
  q2: number;
  q3: number;
  max: number;
}

function five(xs: number[]): Five {
  const d = [...xs].sort((p, q) => p - q);
  return {
    min: d[0] ?? 0,
    q1: quartile(d, 1),
    q2: quartile(d, 2),
    q3: quartile(d, 3),
    max: d[d.length - 1] ?? 0,
  };
}

/* ความสูงของจุดแต่ละจุด ค่าเท่ากันซ้อนขึ้นไปทีละแถว ถ้ากองสูงเกินไปให้บีบระยะระหว่างแถว */
function stack(xs: number[]): number[] {
  const tallest = Math.max(...xs.map((v) => xs.filter((u) => u === v).length));
  const gap = tallest > 1 ? Math.min(0.75, (DOT_TOP - DOT_Y) / (tallest - 1)) : 0.75;
  return xs.map((v, i) => DOT_Y + gap * xs.slice(0, i).filter((u) => u === v).length);
}

export const boards: Record<string, BoardDef> = {
  /* แผนภาพจุดของคะแนน 11 คน ลากจุดไปทางซ้ายขวาได้ แผนภาพกล่องข้างบนเปลี่ยนตาม
     เส้นประจากกล่องลงมาที่เส้นจำนวนช่วยให้เห็นว่าแต่ละส่วนมีจุดประมาณหนึ่งในสี่ */
  "c26-box-drag": {
    bbox: [-1.5, 10, 21.5, -1.5],
    axis: false,
    aspect: 2,
    initial: Object.fromEntries(SCORES.map((v, i) => [key(i), v])),
    draw(board, s, c, changed) {
      const f = (): Five => five(values(s));

      // เส้นจำนวน ขีดทุก 1 คะแนน ตัวเลขทุก 2 คะแนน
      board.create("segment", [[LO - 0.6, 0], [HI + 0.6, 0]], {
        strokeColor: c.ink, strokeWidth: 1.5, fixed: true, highlight: false,
      });
      for (let x = LO; x <= HI; x++) {
        board.create("segment", [[x, 0], [x, -0.25]], { strokeColor: c.ink, strokeWidth: 1, fixed: true, highlight: false });
        if (x % 2 === 0) {
          board.create("text", [x, -0.8, String(x)], {
            anchorX: "middle", anchorY: "middle", fontSize: 11, strokeColor: c.ink3, fixed: true, highlight: false,
            cssStyle: MONO,
          });
        }
      }

      // เส้นประจาก Q1 Q2 Q3 ลงมาที่เส้นจำนวน
      for (const q of ["q1", "q2", "q3"] as const) {
        board.create("segment", [[() => f()[q], 0], [() => f()[q], BOX_Y - BOX_HALF]], {
          strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
        });
      }

      // กล่องจาก Q1 ถึง Q3
      const box = board.create("curve", [[0], [0]], {
        strokeColor: c.accent, strokeWidth: 2.5, fillColor: c.accent, fillOpacity: 0.2, highlight: false,
      });
      box.updateDataArray = function () {
        const t = f();
        this.dataX = [t.q1, t.q3, t.q3, t.q1, t.q1];
        this.dataY = [BOX_Y - BOX_HALF, BOX_Y - BOX_HALF, BOX_Y + BOX_HALF, BOX_Y + BOX_HALF, BOX_Y - BOX_HALF];
      };

      // มัธยฐาน เส้นยื่นสองข้าง และขีดปลายเส้นที่ค่าต่ำสุดกับค่าสูงสุด
      const line = { strokeColor: c.accent, strokeWidth: 2.5, fixed: true, highlight: false };
      board.create("segment", [[() => f().q2, BOX_Y - BOX_HALF], [() => f().q2, BOX_Y + BOX_HALF]], line);
      board.create("segment", [[() => f().min, BOX_Y], [() => f().q1, BOX_Y]], line);
      board.create("segment", [[() => f().q3, BOX_Y], [() => f().max, BOX_Y]], line);
      board.create("segment", [[() => f().min, BOX_Y - 0.45], [() => f().min, BOX_Y + 0.45]], line);
      board.create("segment", [[() => f().max, BOX_Y - 0.45], [() => f().max, BOX_Y + 0.45]], line);

      // จุดของข้อมูล ลากได้ทางซ้ายขวา ตำแหน่งตั้งจัดให้เองตามจำนวนจุดที่ซ้อนกัน
      const xs0 = values(s);
      const ys0 = stack(xs0);
      const pts = xs0.map((x, i) =>
        board.create("point", [x, ys0[i] ?? DOT_Y], {
          withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 1.5,
          highlightFillColor: c.accent, highlightStrokeColor: c.ink, showInfobox: false,
        }));
      const relayout = (): void => {
        const xs = values(s);
        const ys = stack(xs);
        pts.forEach((p, j) => {
          p.setPositionDirectly(JXG.COORDS_BY_USER, [xs[j] ?? 0, ys[j] ?? DOT_Y]);
        });
      };
      pts.forEach((p, i) => {
        p.on("drag", () => {
          s[key(i)] = Math.min(HI, Math.max(LO, Math.round(p.X())));
          relayout();
          changed();
        });
        p.on("up", () => {
          relayout();
          board.update();
        });
      });
    },
    readout(s) {
      const t = five(values(s));
      const m = (v: number): string => `<span class="m">${fmt(v)}</span>`;
      return `ค่าต่ำสุด ${m(t.min)}  <span class="m"><i>Q</i><sub>1</sub></span> ${m(t.q1)}  <span class="m"><i>Q</i><sub>2</sub></span> ${m(t.q2)}  <span class="m"><i>Q</i><sub>3</sub></span> ${m(t.q3)}  ค่าสูงสุด ${m(t.max)}<br>พิสัย ${m(t.max - t.min)}  พิสัยระหว่างควอร์ไทล์ ${m(t.q3 - t.q1)}`;
    },
  },
};
