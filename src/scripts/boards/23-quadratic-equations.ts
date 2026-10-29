/* กราฟของบทที่ 23 สมการกำลังสองตัวแปรเดียว */

import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ปัดสองตำแหน่ง ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r === 0 ? 0 : r).replace("-", "−");
}

/* คำตอบของสมการ x = ... ถ้าไม่ลงตัวใช้ ≈ แทน = */
function root(n: number): string {
  const exact = Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;
  return `<span class="m"><i>x</i> ${exact ? "=" : "≈"} ${fmt(n)}</span>`;
}

/* ax² + bx + c = 0 เป็น HTML ข้ามพจน์ที่สัมประสิทธิ์เป็นศูนย์ */
function equation(a: number, b: number, c: number): string {
  const terms: [number, string][] = [[a, "<i>x</i><sup>2</sup>"], [b, "<i>x</i>"], [c, ""]];
  let out = "";
  for (const [k, body] of terms) {
    if (k === 0) continue;
    const size = body && Math.abs(k) === 1 ? "" : fmt(Math.abs(k));
    if (out === "") out = `${k < 0 ? "−" : ""}${size}${body}`;
    else out += ` ${k < 0 ? "−" : "+"} ${size}${body}`;
  }
  return `<span class="m">${out || "0"} = 0</span>`;
}

/* รากจริงของ ax² + bx + c = 0 เรียงจากน้อยไปมาก */
function realRoots(a: number, b: number, c: number): number[] {
  const d = b * b - 4 * a * c;
  if (d < 0) return [];
  if (d === 0) return [-b / (2 * a)];
  const r1 = (-b - Math.sqrt(d)) / (2 * a);
  const r2 = (-b + Math.sqrt(d)) / (2 * a);
  return r1 < r2 ? [r1, r2] : [r2, r1];
}

export const boards: Record<string, BoardDef> = {
  /* เส้นโค้ง y = ax² + bx + c จุดตัดแกน x คือคำตอบของสมการ ax² + bx + c = 0 */
  "c23-roots": {
    bbox: [-6, 9, 6, -9],
    steps: [1, 2],
    initial: { a: 1, b: -2, c: -3 },
    sliders: [
      { key: "a", label: "<i>a</i>", min: -3, max: 3, step: 0.5 },
      { key: "b", label: "<i>b</i>", min: -6, max: 6, step: 1 },
      { key: "c", label: "<i>c</i>", min: -6, max: 6, step: 1 },
    ],
    draw(board, s, c) {
      const A = (): number => s.a ?? 1;
      const B = (): number => s.b ?? 0;
      const C = (): number => s.c ?? 0;
      board.create("functiongraph", [(x: number) => A() * x * x + B() * x + C()], {
        strokeColor: c.accent, strokeWidth: 3.5, highlight: false,
      });
      // จุดตัดแกน x สองจุด ถ้าไม่มีรากให้พิกัดเป็น NaN จุดจะถูกซ่อน
      for (const i of [0, 1]) {
        const at = (): number => {
          if (A() === 0) return Number.NaN;
          const r = realRoots(A(), B(), C());
          return r[i] ?? Number.NaN;
        };
        board.create("point", [at, () => (Number.isNaN(at()) ? Number.NaN : 0)], {
          fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
        });
      }
    },
    readout(s) {
      const a = s.a ?? 1;
      const b = s.b ?? 0;
      const c = s.c ?? 0;
      if (a === 0) return "<span class=\"m\"><i>a</i> = 0</span> ไม่ใช่สมการกำลังสอง ลองเลื่อน <span class=\"m\"><i>a</i></span> ออกจากศูนย์";
      const d = b * b - 4 * a * c;
      const disc = `<span class="m"><i>b</i><sup>2</sup> − 4<i>ac</i> = ${fmt(d)}</span>`;
      const r = realRoots(a, b, c);
      let tail: string;
      if (d > 0) tail = `มากกว่า 0 ตัดแกน <span class="m"><i>x</i></span> สองจุด คำตอบคือ ${root(r[0] ?? 0)} และ ${root(r[1] ?? 0)}`;
      else if (d === 0) tail = `เท่ากับ 0 แตะแกน <span class="m"><i>x</i></span> จุดเดียว คำตอบเดียวคือ ${root(r[0] ?? 0)}`;
      else tail = "น้อยกว่า 0 ไม่ตัดแกน <span class=\"m\"><i>x</i></span> สมการไม่มีคำตอบที่เป็นจำนวนจริง";
      return `${equation(a, b, c)}<br>${disc}  ${tail}`;
    },
  },
};
