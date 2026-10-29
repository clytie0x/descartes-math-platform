/* กราฟของบทที่ 1 จำนวนเต็ม เส้นจำนวนที่เดินเป็นลูกศร */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function n1(v: number): string {
  return String(v).replace("-", "−");
}

/* ตัวเลขที่อยู่หลังเครื่องหมาย + − × ถ้าติดลบให้ใส่วงเล็บ */
function paren(v: number): string {
  return v < 0 ? `(${n1(v)})` : n1(v);
}

function m(s: string): string {
  return `<span class="m">${s}</span>`;
}

function side(v: number): string {
  return v > 0 ? "ทางขวา" : "ทางซ้าย";
}

/* เส้นจำนวนใช้แกนนอนอย่างเดียว ซ่อนแกนตั้ง แล้วให้แกนนอนเขียนเลข 0 ด้วย
   ชนิดข้อมูลของ defaultAxes ใน jsxgraph เป็นค่าตั้งของแกน แต่ของจริงคือตัวแกน จึงต้องแปลงชนิด */
function numberLine(board: JXG.Board): void {
  type Settable = { setAttribute(attrs: Record<string, unknown>): void };
  const axes = board.defaultAxes as unknown as Record<string, Settable & { defaultTicks?: Settable }>;
  axes.y?.defaultTicks?.setAttribute({ visible: false });
  axes.y?.setAttribute({ visible: false });
  axes.x?.defaultTicks?.setAttribute({ drawZero: true });
}

/* ซ่อนลูกศรด้วยการย้ายออกไปนอกกรอบ */
const OFF = -100;

export const boards: Record<string, BoardDef> = {
  /* a + b หรือ a − b บนเส้นจำนวน เริ่มที่ a แล้วเดินเป็นลูกศร การลบคือเดินกลับทิศของการบวก */
  "c1-walk": {
    bbox: [-11.2, 3.6, 11.2, -1.4],
    aspect: 3,
    steps: [1, 10],
    initial: { a: 3, b: -5, minus: 0 },
    sliders: [
      { key: "a", label: "เริ่มที่", min: -5, max: 5, step: 1 },
      { key: "b", label: "จำนวนที่สอง", min: -5, max: 5, step: 1 },
      { key: "minus", label: "เปลี่ยนเป็นการลบ", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      const a = (): number => s.a ?? 0;
      const b = (): number => s.b ?? 0;
      const sub = (): boolean => (s.minus ?? 0) > 0;
      const end = (): number => (sub() ? a() - b() : a() + b());

      numberLine(board);
      // ตอนลบ แสดงทิศที่การบวกจะไปเป็นเส้นประ ไว้เทียบ
      board.create("arrow", [[a, () => (sub() ? 2.4 : OFF)], [() => a() + b(), () => (sub() ? 2.4 : OFF)]], {
        strokeColor: c.teal, strokeWidth: 2, dash: 2, fixed: true, highlight: false,
      });
      board.create("arrow", [[a, 1.2], [end, 1.2]], {
        strokeColor: c.accent, strokeWidth: 3.5, fixed: true, highlight: false,
      });
      board.create("segment", [[a, 0], [a, 1.2]], {
        strokeColor: c.ink3, strokeWidth: 1, dash: 2, fixed: true, highlight: false,
      });
      board.create("segment", [[end, 0], [end, 1.2]], {
        strokeColor: c.ink3, strokeWidth: 1, dash: 2, fixed: true, highlight: false,
      });
      board.create("point", [a, 0], {
        fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
      });
      board.create("point", [end, 0], {
        fixed: true, withLabel: false, size: 6, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 2, highlight: false,
      });
    },
    readout(s) {
      const a = s.a ?? 0;
      const b = s.b ?? 0;
      const sub = (s.minus ?? 0) > 0;
      const end = sub ? a - b : a + b;
      const eq = m(`${n1(a)} ${sub ? "−" : "+"} ${paren(b)} = ${n1(end)}`);
      if (b === 0) return `${eq}  เดิน 0 หน่วย จึงอยู่ที่เดิม`;
      if (!sub) return `${eq}  เริ่มที่ ${m(n1(a))} เดิน${side(b)} ${m(n1(Math.abs(b)))} หน่วย`;
      return `${eq}  การลบ ${m(paren(b))} เดินกลับทิศของการบวก (เส้นประ) จึงไป${side(-b)} ${m(n1(Math.abs(b)))} หน่วย เท่ากับ ${m(`${n1(a)} + ${paren(-b)}`)}`;
    },
  },

  /* a × b คือกระโดดจาก 0 ไป a ครั้ง ครั้งละ b หน่วย ถ้า a ติดลบ ให้กลับทิศของ |a| × b */
  "c1-jumps": {
    bbox: [-11.2, 3.6, 11.2, -1.4],
    aspect: 3,
    steps: [1, 10],
    initial: { a: 3, b: -2 },
    sliders: [
      { key: "a", label: "ตัวตั้ง", min: -3, max: 3, step: 1 },
      { key: "b", label: "ตัวคูณ", min: -3, max: 3, step: 1 },
    ],
    draw(board, s, c) {
      const a = (): number => s.a ?? 0;
      const b = (): number => s.b ?? 0;
      const step = (): number => Math.sign(a()) * b();

      numberLine(board);
      for (let i = 0; i < 3; i++) {
        const on = (): boolean => i < Math.abs(a());
        // ถ้าตัวตั้งติดลบ แสดงการกระโดดของ |a| × b เป็นเส้นประไว้เทียบ
        const ghost = (): number => (on() && a() < 0 ? 2.4 : OFF);
        board.create("arrow", [[() => i * b(), ghost], [() => (i + 1) * b(), ghost]], {
          strokeColor: c.teal, strokeWidth: 2, dash: 2, fixed: true, highlight: false,
        });
        const y = (): number => (on() ? 1.2 : OFF);
        board.create("arrow", [[() => i * step(), y], [() => (i + 1) * step(), y]], {
          strokeColor: c.accent, strokeWidth: 3.5, fixed: true, highlight: false,
        });
        board.create("point", [() => (i + 1) * step(), () => (on() ? 0 : OFF)], {
          fixed: true, withLabel: false, size: 3, fillColor: c.accent, strokeColor: c.accent, highlight: false,
        });
      }
      board.create("point", [() => a() * b(), 0], {
        fixed: true, withLabel: false, size: 6, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 2, highlight: false,
      });
    },
    readout(s) {
      const a = s.a ?? 0;
      const b = s.b ?? 0;
      const eq = m(`${paren(a)} × ${paren(b)} = ${n1(a * b)}`);
      if (a === 0) return `${eq}  ไม่ได้กระโดดเลย จึงอยู่ที่ 0`;
      if (b === 0) return `${eq}  กระโดดครั้งละ 0 หน่วย จึงอยู่ที่ 0`;
      if (a > 0) return `${eq}  กระโดด ${m(n1(a))} ครั้ง ครั้งละ ${m(n1(Math.abs(b)))} หน่วยไป${side(b)}`;
      return `${eq}  กลับทิศของ ${m(`${n1(-a)} × ${paren(b)} = ${n1(-a * b)}`)} (เส้นประ) จึงไป${side(-b)}`;
    },
  },
};
