/* กราฟของบทที่ 15 พหุนาม */

import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ปัดสองตำแหน่ง */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

/* พจน์ cx เป็น HTML ไม่เขียน 1 หน้า x */
function xTerm(c: number): string {
  return c === 1 ? "<i>x</i>" : `${fmt(c)}<i>x</i>`;
}

export const boards: Record<string, BoardDef> = {
  /* แบบจำลองพื้นที่ของ (x + a)(x + b) สี่เหลี่ยมกว้าง x + a สูง x + b แบ่งเป็นสี่ชิ้น
     แถวบนสูง x แถวล่างสูง b คอลัมน์ซ้ายกว้าง x คอลัมน์ขวากว้าง a มุมล่างซ้ายอยู่ที่ (0, 0)
     x + a กับ x + b ไม่เกิน 10 ป้ายด้านบนอยู่ที่ y ไม่เกิน 10.45 ป้ายด้านซ้ายอยู่ที่ x = −0.55
     กรอบกว้าง 15.2 สูง 11.4 เป็นสัดส่วน 4 ต่อ 3 เท่ากล่องกราฟ ช่องสี่เหลี่ยมจึงไม่ถูกยืด */
  "c15-area-model": {
    bbox: [-3.15, 11, 12.05, -0.4],
    axis: false,
    initial: { x: 4, a: 2, b: 3 },
    sliders: [
      { key: "x", label: "<i>x</i>", min: 2, max: 6, step: 0.5 },
      { key: "a", label: "<i>a</i>", min: 1, max: 4, step: 1 },
      { key: "b", label: "<i>b</i>", min: 1, max: 4, step: 1 },
    ],
    draw(board, s, c) {
      const X = (): number => s.x ?? 4;
      const A = (): number => s.a ?? 2;
      const B = (): number => s.b ?? 3;
      const hide = { visible: false, fixed: true, withLabel: false };
      const rect = (x0: () => number, x1: () => number, y0: () => number, y1: () => number, fill: string): void => {
        const pts = [
          board.create("point", [x0, y0], hide),
          board.create("point", [x1, y0], hide),
          board.create("point", [x1, y1], hide),
          board.create("point", [x0, y1], hide),
        ];
        board.create("polygon", pts, {
          fillColor: fill, fillOpacity: 0.28, highlight: false, fixed: true,
          borders: { strokeColor: c.ink, strokeWidth: 1.5, highlight: false },
          vertices: { visible: false },
        });
      };
      const zero = (): number => 0;
      // แถวบน สูง x ชิ้น x² กับ ax
      rect(zero, X, B, () => B() + X(), c.accent);
      rect(X, () => X() + A(), B, () => B() + X(), c.teal);
      // แถวล่าง สูง b ชิ้น bx กับ ab
      rect(zero, X, zero, B, c.teal);
      rect(X, () => X() + A(), zero, B, c.violet);

      const txt = { fontSize: 15, strokeColor: c.ink, fixed: true, highlight: false, anchorX: "middle", anchorY: "middle" };
      const label = (px: () => number, py: () => number, html: () => string): void => {
        board.create("text", [px, py, html], txt);
      };
      // ชื่อชิ้นตรงกลางแต่ละชิ้น
      label(() => X() / 2, () => B() + X() / 2, () => "<i>x</i><sup>2</sup>");
      label(() => X() + A() / 2, () => B() + X() / 2, () => xTerm(A()));
      label(() => X() / 2, () => B() / 2, () => xTerm(B()));
      label(() => X() + A() / 2, () => B() / 2, () => fmt(A() * B()));
      // ความยาวด้านบนและด้านซ้าย
      label(() => X() / 2, () => B() + X() + 0.45, () => "<i>x</i>");
      label(() => X() + A() / 2, () => B() + X() + 0.45, () => fmt(A()));
      label(() => -0.55, () => B() + X() / 2, () => "<i>x</i>");
      label(() => -0.55, () => B() / 2, () => fmt(B()));
    },
    readout(s) {
      const x = s.x ?? 4;
      const a = s.a ?? 2;
      const b = s.b ?? 3;
      const xi = "<i>x</i>";
      const left = `(${xi} + ${a})(${xi} + ${b})`;
      const four = `${xi}<sup>2</sup> + ${xTerm(b)} + ${xTerm(a)} + ${a * b}`;
      const done = `${xi}<sup>2</sup> + ${xTerm(a + b)} + ${a * b}`;
      const total = (x + a) * (x + b);
      return `<span class="m">${left} = ${four} = ${done}</span><br>`
        + `ลอง <span class="m">${xi} = ${fmt(x)}</span> ทั้งรูป <span class="m">${fmt(x + a)} × ${fmt(x + b)} = ${fmt(total)}</span> `
        + `สี่ชิ้นรวมกัน <span class="m">${fmt(x * x)} + ${fmt(b * x)} + ${fmt(a * x)} + ${a * b} = ${fmt(x * x + (a + b) * x + a * b)}</span>`;
    },
  },
};
