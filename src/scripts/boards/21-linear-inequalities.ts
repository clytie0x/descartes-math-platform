/* กราฟของบทที่ 21 อสมการเชิงเส้นตัวแปรเดียว */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function n1(v: number): string {
  const r = Math.round(v * 100) / 100;
  return String(r).replace("-", "−");
}

/* ตัวเลขที่ตามหลังคำว่าคูณด้วย ถ้าติดลบให้ใส่วงเล็บ */
function paren(v: number): string {
  return v < 0 ? `(${n1(v)})` : n1(v);
}

function m(s: string): string {
  return `<span class="m">${s}</span>`;
}

const X = "<i>x</i>";

/* เส้นจำนวนใช้แกนนอนอย่างเดียว ซ่อนแกนตั้ง แล้วให้แกนนอนเขียนเลข 0 ด้วย
   ชนิดข้อมูลของ defaultAxes ใน jsxgraph เป็นค่าตั้งของแกน แต่ของจริงคือตัวแกน จึงต้องแปลงชนิด */
function numberLine(board: JXG.Board): void {
  type Settable = { setAttribute(attrs: Record<string, unknown>): void };
  const axes = board.defaultAxes as unknown as Record<string, Settable & { defaultTicks?: Settable }>;
  axes.y?.defaultTicks?.setAttribute({ visible: false });
  axes.y?.setAttribute({ visible: false });
  axes.x?.defaultTicks?.setAttribute({ drawZero: true });
}

/* ซ่อนจุดด้วยการย้ายออกไปนอกกรอบ */
const OFF = -100;

export const boards: Record<string, BoardDef> = {
  /* กราฟคำตอบของ x > a  x ≥ a  x < a  x ≤ a พร้อมจุดทดลองที่เลื่อนไปแทนค่าได้ */
  "c21-solution": {
    bbox: [-8.4, 3.6, 8.4, -2],
    aspect: 3,
    steps: [1, 10],
    initial: { a: 2, right: 1, closed: 0, t: 4 },
    sliders: [
      { key: "a", label: "จุดปลาย", min: -6, max: 6, step: 1 },
      { key: "right", label: "ไปทางขวา (มากกว่า)", min: 0, max: 1, step: 1, toggle: true },
      { key: "closed", label: "รวมจุดปลาย", min: 0, max: 1, step: 1, toggle: true },
      { key: "t", label: `ลองแทน ${X}`, min: -8, max: 8, step: 0.5 },
    ],
    draw(board, s, c) {
      const a = (): number => s.a ?? 0;
      const right = (): boolean => (s.right ?? 0) > 0;
      const closed = (): boolean => (s.closed ?? 0) > 0;
      const t = (): number => s.t ?? 0;
      const ok = (): boolean => {
        if (right()) return closed() ? t() >= a() : t() > a();
        return closed() ? t() <= a() : t() < a();
      };

      numberLine(board);
      // เส้นทึบแทนคำตอบทั้งหมด ลากจากจุดปลายไปจนสุดกรอบ
      board.create("arrow", [[a, 0], [() => (right() ? 8.3 : -8.3), 0]], {
        strokeColor: c.accent, strokeWidth: 6, fixed: true, highlight: false,
      });
      // จุดทดลอง เส้นประลงมาที่เส้นจำนวน สีเขียวเมื่อเป็นคำตอบ สีเทาเมื่อไม่เป็น
      board.create("segment", [[t, 0], [t, 1.3]], {
        strokeColor: c.ink3, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      board.create("point", [t, () => (ok() ? 1.3 : OFF)], {
        face: "triangledown", size: 7, fillColor: c.teal, strokeColor: c.teal,
        fixed: true, withLabel: false, highlight: false,
      });
      board.create("point", [t, () => (ok() ? OFF : 1.3)], {
        face: "triangledown", size: 7, fillColor: c.ink3, strokeColor: c.ink3,
        fixed: true, withLabel: false, highlight: false,
      });
      board.create("text", [t, 2.35, () => `x = ${n1(t())}`], {
        anchorX: "middle", fontSize: 13, strokeColor: c.ink, fixed: true, highlight: false,
        cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 600",
      });
      // จุดปลาย มีสองจุดซ้อนกัน แสดงทีละจุด จุดทึบเมื่อรวมจุดปลาย จุดโปร่งเมื่อไม่รวม
      board.create("point", [a, () => (closed() ? 0 : OFF)], {
        fixed: true, withLabel: false, size: 7, fillColor: c.ink, strokeColor: c.ink, strokeWidth: 2, highlight: false,
      });
      board.create("point", [a, () => (closed() ? OFF : 0)], {
        fixed: true, withLabel: false, size: 7, fillColor: c.paper, strokeColor: c.ink, strokeWidth: 3, highlight: false,
      });
    },
    readout(s) {
      const a = s.a ?? 0;
      const right = (s.right ?? 0) > 0;
      const closed = (s.closed ?? 0) > 0;
      const t = s.t ?? 0;
      const sign = right ? (closed ? "≥" : "&gt;") : (closed ? "≤" : "&lt;");
      const ok = right ? (closed ? t >= a : t > a) : (closed ? t <= a : t < a);
      const dot = closed
        ? `จุดทึบ เพราะ ${m(n1(a))} เป็นคำตอบด้วย`
        : `จุดโปร่ง เพราะ ${m(n1(a))} ไม่เป็นคำตอบ`;
      const test = `แทน ${m(`${X} = ${n1(t)}`)} ได้ ${m(`${n1(t)} ${sign} ${n1(a)}`)} ${ok ? "เป็นจริง จึงเป็นคำตอบ" : "เป็นเท็จ จึงไม่เป็นคำตอบ"}`;
      return `กราฟของ ${m(`${X} ${sign} ${n1(a)}`)}  ${dot}<br>${test}`;
    },
  },

  /* คูณ 1 กับ 3 ด้วยจำนวนเดียวกัน ดูว่าลำดับมากน้อยเปลี่ยนหรือไม่ เส้นบนก่อนคูณ เส้นล่างหลังคูณ */
  "c21-flip": {
    bbox: [-10, 4.4, 10, -1.6],
    aspect: 10 / 3,
    axis: false,
    initial: { c: 2 },
    sliders: [{ key: "c", label: "คูณด้วย", min: -3, max: 3, step: 0.5 }],
    draw(board, s, c) {
      const k = (): number => s.c ?? 1;
      const TOP = 2.4;
      const BOT = 0;
      const plain = { fixed: true, highlight: false };
      const mono = "font-family: 'IBM Plex Mono', monospace";

      for (const y of [TOP, BOT]) {
        board.create("segment", [[-9.7, y], [9.7, y]], { ...plain, strokeColor: c.ink, strokeWidth: 1.5 });
        for (let i = -9; i <= 9; i++) {
          const h = i === 0 ? 0.25 : 0.12;
          board.create("segment", [[i, y - h], [i, y + h]], {
            ...plain, strokeColor: i === 0 ? c.ink : c.ink3, strokeWidth: i === 0 ? 2 : 1,
          });
        }
      }
      board.create("text", [-9.7, TOP + 0.75, "ก่อนคูณ"], { ...plain, fontSize: 12, strokeColor: c.ink3 });
      board.create("text", [-9.7, BOT + 0.75, "หลังคูณ"], { ...plain, fontSize: 12, strokeColor: c.ink3 });
      board.create("text", [0, TOP + 0.6, "0"], { ...plain, anchorX: "middle", fontSize: 11, strokeColor: c.ink3, cssStyle: mono });

      // 1 สีเขียว 3 สีส้ม เส้นประต่อจากจุดเดิมไปผลคูณ ถ้าเส้นไขว้กันแปลว่าลำดับกลับ
      const pairs: [number, string][] = [[1, c.teal], [3, c.accent]];
      for (const [v, col] of pairs) {
        const img = (): number => v * k();
        board.create("segment", [[v, TOP], [img, BOT]], { ...plain, strokeColor: col, strokeWidth: 1.5, dash: 2 });
        board.create("point", [v, TOP], {
          ...plain, withLabel: false, size: 6, fillColor: col, strokeColor: c.paper, strokeWidth: 2,
        });
        board.create("point", [img, BOT], {
          ...plain, withLabel: false, size: 6, fillColor: col, strokeColor: c.paper, strokeWidth: 2,
        });
        board.create("text", [v, TOP + 0.6, n1(v)], {
          ...plain, anchorX: "middle", fontSize: 13, strokeColor: col, cssStyle: `${mono}; font-weight: 600`,
        });
        board.create("text", [img, BOT - 0.7, () => n1(img())], {
          ...plain, anchorX: "middle", fontSize: 13, strokeColor: col, cssStyle: `${mono}; font-weight: 600`,
        });
      }
    },
    readout(s) {
      const k = s.c ?? 1;
      const p = k * 1;
      const q = k * 3;
      const head = `${m("1 &lt; 3")} คูณทั้งสองข้างด้วย ${m(paren(k))} ได้`;
      if (k === 0) return `${head} ${m("0 = 0")} ไม่เป็นอสมการแล้ว จึงคูณด้วยศูนย์ไม่ได้`;
      const rel = p < q ? "&lt;" : "&gt;";
      const res = m(`${n1(p)} ${rel} ${n1(q)}`);
      if (k > 0) return `${head} ${res}  คูณด้วยจำนวนบวก เครื่องหมายเหมือนเดิม เส้นประไม่ไขว้กัน`;
      return `${head} ${res}  คูณด้วยจำนวนลบ จุดพลิกไปอีกฝั่งของ 0 ลำดับจึงกลับกัน เครื่องหมายกลับข้าง`;
    },
  },
};
