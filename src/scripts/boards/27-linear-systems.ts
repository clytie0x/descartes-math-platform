/* กราฟของบทที่ 27 ระบบสมการเชิงเส้นสองตัวแปร */

import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/* เศษส่วน p/q อย่างต่ำ p กับ q เป็นจำนวนเต็ม q ไม่เป็นศูนย์ */
function frac(p: number, q: number): string {
  if (q < 0) {
    p = -p;
    q = -q;
  }
  const g = gcd(Math.abs(p), q) || 1;
  const n = p / g;
  const d = q / g;
  return d === 1 ? fmt(n) : `${n < 0 ? "−" : ""}${Math.abs(n)}/${d}`;
}

/* y = ax + b เป็น HTML */
function lineEq(a: number, b: number): string {
  const x = "<i>x</i>";
  let head = "";
  if (a === 1) head = x;
  else if (a === -1) head = `−${x}`;
  else if (a !== 0) head = `${fmt(a)}${x}`;
  let tail = "";
  if (head === "") tail = fmt(b);
  else if (b !== 0) tail = ` ${b > 0 ? "+" : "−"} ${fmt(Math.abs(b))}`;
  return `<span class="m"><i>y</i> = ${head}${tail}</span>`;
}

const MONO = "font-family: 'IBM Plex Mono', monospace; font-weight: 600";

export const boards: Record<string, BoardDef> = {
  /* เส้นตรงสองเส้น y = a₁x + b₁ (ส้ม) กับ y = a₂x + b₂ (ม่วง) บอกจุดตัด หรือบอกว่าขนานหรือทับกัน
     ค่าเริ่มต้นคือระบบ x + y = 5 กับ 2x − y = 1 ในตัวอย่างที่ 1 ของหน้า 27.2 ตัดกันที่ (2, 3) */
  "c27-two-lines": {
    bbox: [-8, 6, 8, -6],
    initial: { a1: -1, b1: 5, a2: 2, b2: -1 },
    sliders: [
      { key: "a1", label: "ส้ม <i>a</i>", min: -3, max: 3, step: 0.5 },
      { key: "b1", label: "ส้ม <i>b</i>", min: -5, max: 5, step: 1 },
      { key: "a2", label: "ม่วง <i>a</i>", min: -3, max: 3, step: 0.5 },
      { key: "b2", label: "ม่วง <i>b</i>", min: -5, max: 5, step: 1 },
    ],
    draw(board, s, c) {
      const a1 = (): number => s.a1 ?? 0;
      const b1 = (): number => s.b1 ?? 0;
      const a2 = (): number => s.a2 ?? 0;
      const b2 = (): number => s.b2 ?? 0;
      // จุดตัด ถ้าเส้นขนานหรือทับกันให้เป็น NaN จุดและเส้นประจะไม่ถูกวาด
      const X = (): number => (a1() === a2() ? Number.NaN : (b2() - b1()) / (a1() - a2()));
      const Y = (): number => a1() * X() + b1();
      // เส้นส้มหนากว่า ตอนสองเส้นทับกันจะเห็นทั้งสองสี
      board.create("functiongraph", [(x: number) => a1() * x + b1()], {
        strokeColor: c.accent, strokeWidth: 5, highlight: false,
      });
      board.create("functiongraph", [(x: number) => a2() * x + b2()], {
        strokeColor: c.violet, strokeWidth: 2.5, highlight: false,
      });
      board.create("segment", [[X, 0], [X, Y]], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      board.create("segment", [[0, Y], [X, Y]], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      board.create("point", [X, Y], {
        fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
      });
      // ป้ายพิกัด ถ้าจุดอยู่ใกล้ขอบบนให้ย้ายไปไว้ใต้จุด
      board.create("text", [
        () => X() + 0.3,
        () => Y() + (Y() > 4 ? -0.7 : 0.6),
        () => (Number.isNaN(X()) ? "" : `(${fmt(X())}, ${fmt(Y())})`),
      ], { fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false, cssStyle: MONO });
    },
    readout(s) {
      const a1 = s.a1 ?? 0;
      const b1 = s.b1 ?? 0;
      const a2 = s.a2 ?? 0;
      const b2 = s.b2 ?? 0;
      const eqs = `เส้นส้ม ${lineEq(a1, b1)}  เส้นม่วง ${lineEq(a2, b2)}<br>`;
      if (a1 === a2 && b1 === b2) {
        return `${eqs}สองเส้น<strong>ทับกัน</strong> ทุกจุดบนเส้นเป็นคำตอบ ระบบมีคำตอบมากมายนับไม่ถ้วน`;
      }
      if (a1 === a2) {
        return `${eqs}สองเส้น<strong>ขนานกัน</strong> ค่า <span class="m"><i>a</i></span> เท่ากันแต่ <span class="m"><i>b</i></span> ต่างกัน ไม่มีจุดตัด ระบบไม่มีคำตอบ`;
      }
      // a เป็นพหุคูณของ 0.5 และ b เป็นจำนวนเต็ม คูณ 2 ทั้งเศษและส่วนจะได้จำนวนเต็ม
      const q = Math.round(2 * (a1 - a2));
      const px = Math.round(2 * (b2 - b1));
      const py = Math.round(2 * (a1 * b2 - a2 * b1));
      const x = px / q;
      const y = py / q;
      const exact = `(${frac(px, q)}, ${frac(py, q)})`;
      const whole = Number.isInteger(x) && Number.isInteger(y);
      const approx = whole ? "" : ` ประมาณ <span class="m">(${fmt(x)}, ${fmt(y)})</span>`;
      const outside = Math.abs(x) > 8 || Math.abs(y) > 6 ? " อยู่นอกกรอบรูป" : "";
      return `${eqs}ตัดกันจุดเดียวที่ <span class="m">${exact}</span>${approx}${outside} ระบบมีคำตอบเดียว`;
    },
  },

  /* แบบฝึกหัด อ่านจุดตัดของ y = 2x − 1 กับ x + y = 5 แล้วลากจุดไปวาง */
  "c27-ex-read": {
    bbox: [-6, 6, 6, -3],
    initial: { x: 0, y: 0 },
    draw(board, s, c, changed) {
      board.create("functiongraph", [(x: number) => 2 * x - 1], {
        strokeColor: c.accent, strokeWidth: 3, highlight: false,
      });
      board.create("functiongraph", [(x: number) => 5 - x], {
        strokeColor: c.violet, strokeWidth: 3, highlight: false,
      });
      const p = board.create("point", [s.x ?? 0, s.y ?? 0], {
        withLabel: false, size: 7, snapToGrid: true, snapSizeX: 1, snapSizeY: 1,
        fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2,
        highlightFillColor: c.ink, highlightStrokeColor: c.accent,
      });
      p.on("drag", () => {
        s.x = Math.round(p.X());
        s.y = Math.round(p.Y());
        changed();
      });
    },
    readout(s) {
      return `จุดที่ลากอยู่ที่ <span class="m">(${fmt(s.x ?? 0)}, ${fmt(s.y ?? 0)})</span>`;
    },
    value(s) {
      return `${s.x ?? 0}, ${s.y ?? 0}`;
    },
  },
};
