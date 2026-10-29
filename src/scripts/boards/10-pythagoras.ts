/* กราฟของบทที่ 10 ทฤษฎีบทพีทาโกรัส
   ทุกกราฟซ่อนแกน และตั้งให้หนึ่งหน่วยแนวนอนยาวเท่าแนวตั้ง สี่เหลี่ยมจัตุรัสบนด้านจะได้ไม่เบี้ยว
   รูปสามเหลี่ยมเรียงจุดยอดทวนเข็มนาฬิกาเสมอ สี่เหลี่ยมจัตุรัสบนด้านจึงสร้างออกด้านนอกด้วยสูตรเดียวกัน */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type XY = [number, number];
type Box = [number, number, number, number];

const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";
const NUM_CSS = "font-family: 'IBM Plex Mono', monospace; font-weight: 600";

/* ตัวเลขในข้อความ ปัดสองตำแหน่ง ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

function m(text: string): string {
  return `<span class="m">${text}</span>`;
}

const sq = (v: string): string => `<i>${v}</i><sup>2</sup>`;

/* ความยาวด้านจากกำลังสองที่เป็นจำนวนเต็ม ถ้าไม่ใช่กำลังสองสมบูรณ์ให้ค่าประมาณ */
function rootText(n: number): string {
  const r = Math.round(Math.sqrt(n));
  return r * r === n ? String(r) : `√${n} ≈ ${fmt(Math.sqrt(n))}`;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const d2 = (p: XY, q: XY): number => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;

/* สี่เหลี่ยมจัตุรัสบนด้าน p ไป q ของรูปที่เรียงจุดทวนเข็มนาฬิกา หันออกด้านนอก */
function outward(p: XY, q: XY): XY[] {
  const n: XY = [q[1] - p[1], p[0] - q[0]];
  return [p, q, [q[0] + n[0], q[1] + n[1]], [p[0] + n[0], p[1] + n[1]]];
}

function centre(ps: XY[]): XY {
  const s = ps.reduce<XY>((acc, p) => [acc[0] + p[0], acc[1] + p[1]], [0, 0]);
  return [s[0] / ps.length, s[1] / ps.length];
}

/* จุดสำหรับชื่อด้าน ขยับจากจุดกึ่งกลางด้านเข้าไปทางจุดเซนทรอยด์ของรูปสามเหลี่ยม */
function sideLabel(p: XY, q: XY, g: XY, gap = 0.5): XY {
  const mid: XY = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const v: XY = [g[0] - mid[0], g[1] - mid[1]];
  const len = Math.hypot(v[0], v[1]) || 1;
  return [mid[0] + (gap * v[0]) / len, mid[1] + (gap * v[1]) / len];
}

/* กระดานไม่มีแกน ใช้กับ axis: false */
function plain(board: JXG.Board, box: Box): void {
  board.setBoundingBox(box, true);
}

/* รูปหลายเหลี่ยมที่คำนวณจุดใหม่ทุกครั้งที่กราฟอัปเดต คืนรายการว่างเมื่อต้องการซ่อน */
function shape(board: JXG.Board, pts: () => XY[], attrs: object, closed = true): JXG.Curve {
  const cv = board.create("curve", [[0], [0]], { fixed: true, highlight: false, ...attrs });
  cv.updateDataArray = function () {
    const ps = pts();
    const all = closed && ps.length ? [...ps, ps[0] as XY] : ps;
    this.dataX = all.map((p) => p[0]);
    this.dataY = all.map((p) => p[1]);
  };
  return cv;
}

/* เส้นตารางหนึ่งหน่วย ช่วยนับช่องและบอกว่าจุดอยู่บนจุดตัดของเส้นตาราง */
function grid(board: JXG.Board, c: Colors, x0: number, x1: number, y0: number, y1: number): void {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let x = x0; x <= x1; x++) xs.push(x, x, Number.NaN), ys.push(y0, y1, Number.NaN);
  for (let y = y0; y <= y1; y++) xs.push(x0, x1, Number.NaN), ys.push(y, y, Number.NaN);
  board.create("curve", [xs, ys], { strokeColor: c.rule, strokeWidth: 1, fixed: true, highlight: false });
}

function text(board: JXG.Board, c: Colors, at: () => XY, content: () => string, size = 14, css = NUM_CSS): void {
  board.create("text", [() => at()[0], () => at()[1], content], {
    fixed: true, highlight: false, anchorX: "middle", anchorY: "middle", fontSize: size, strokeColor: c.ink, cssStyle: css,
  });
}

function vertex(board: JXG.Board, c: Colors, p: XY, name: string, offset: [number, number]): void {
  board.create("point", p, {
    fixed: true, highlight: false, size: 3.5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 1.5,
    name, withLabel: true, label: { offset, fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
  });
}

/* จุดที่นักเรียนลากได้ place รับตำแหน่งที่ลากไป คืนตำแหน่งที่ติดเส้นตารางและอยู่ในช่วงที่อนุญาต */
function handle(
  board: JXG.Board, c: Colors, start: XY, name: string, offset: [number, number],
  place: (p: XY) => XY, moved: (p: XY) => void,
): void {
  const p = board.create("point", start, {
    name, size: 7, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
    highlightFillColor: c.accent, highlightStrokeColor: c.ink,
    label: { offset, fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
  }) as JXG.Point;
  p.on("drag", () => {
    const at = place([p.X(), p.Y()]);
    if (at[0] !== p.X() || at[1] !== p.Y()) p.moveTo(at);
    moved(at);
  });
}

/* เครื่องหมายมุมฉากที่จุด at ระหว่างแขนที่ชี้ไป p และ q */
function rightMark(at: XY, p: XY, q: XY, size = 0.45): XY[] {
  const unit = (v: XY): XY => {
    const len = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / len, v[1] / len];
  };
  const u = unit([p[0] - at[0], p[1] - at[1]]);
  const v = unit([q[0] - at[0], q[1] - at[1]]);
  return [
    [at[0] + size * u[0], at[1] + size * u[1]],
    [at[0] + size * (u[0] + v[0]), at[1] + size * (u[1] + v[1])],
    [at[0] + size * v[0], at[1] + size * v[1]],
  ];
}

/* ป้ายพื้นที่ในสี่เหลี่ยมจัตุรัส รูปเล็กเกินจะใส่แค่ตัวเลข */
function areaLabel(v: string, area: number): string {
  return area >= 9 ? `${sq(v)} = ${area}` : String(area);
}

const SQUARES_BOX: Box = [-5.6, 10.6, 10.6, -5.6];
const CONVERSE_BOX: Box = [-4.6, 9.6, 9.6, -5.6];
const REARRANGE_BOX: Box = [-1.3, 10.9, 11.1, -1.3];

export const boards: Record<string, BoardDef> = {
  /* มุม C เป็นมุมฉากที่จุดกำเนิด ลาก B ตามแนวนอนและ A ตามแนวตั้ง ด้าน a = BC และ b = CA เป็นจำนวนเต็ม 1 ถึง 5 */
  "c10-squares": {
    bbox: SQUARES_BOX,
    axis: false,
    initial: { a: 4, b: 3 },
    draw(board, s, c, changed) {
      plain(board, SQUARES_BOX);
      grid(board, c, -16, 21, -7, 12);
      const C: XY = [0, 0];
      const B = (): XY => [s.a ?? 4, 0];
      const A = (): XY => [0, s.b ?? 3];
      const g = (): XY => centre([C, B(), A()]);
      const sides: [() => XY, () => XY, string, string][] = [
        [() => C, B, c.teal, "a"],
        [A, () => C, c.violet, "b"],
        [B, A, c.accent, "c"],
      ];
      for (const [p, q, color, v] of sides) {
        shape(board, () => outward(p(), q()), { strokeColor: color, strokeWidth: 2, fillColor: color, fillOpacity: 0.16 });
        text(board, c, () => centre(outward(p(), q())), () => areaLabel(v, d2(p(), q())));
        text(board, c, () => sideLabel(p(), q(), g()), () => v, 17, LABEL_CSS);
      }
      shape(board, () => [C, B(), A()], { strokeColor: c.ink, strokeWidth: 2.5, fillColor: c.ink, fillOpacity: 0.05 });
      shape(board, () => rightMark(C, B(), A()), { strokeColor: c.ink, strokeWidth: 1.5 }, false);
      vertex(board, c, C, "C", [-18, -16]);
      handle(board, c, B(), "B", [10, -14], (p) => [clamp(Math.round(p[0]), 1, 5), 0], (p) => {
        s.a = p[0];
        changed();
      });
      handle(board, c, A(), "A", [-16, 14], (p) => [0, clamp(Math.round(p[1]), 1, 5)], (p) => {
        s.b = p[1];
        changed();
      });
    },
    readout(s) {
      const a = s.a ?? 4;
      const b = s.b ?? 3;
      const cc = a * a + b * b;
      return `${m(`<i>a</i> = ${a}`)}  ${m(`<i>b</i> = ${b}`)}<br>`
        + `${m(`${sq("a")} + ${sq("b")} = ${a * a} + ${b * b} = ${cc} = ${sq("c")}`)}  ดังนั้น ${m(`<i>c</i> = ${rootText(cc)}`)}`;
    },
  },

  /* สี่เหลี่ยมจัตุรัสด้าน a + b วาดให้ยาว 10 หน่วยเสมอ เลื่อนแถบแล้วรูปสามเหลี่ยมเปลี่ยนรูปร่าง
     ไม่ติ๊ก วางรูปสามเหลี่ยมสี่รูปที่มุม เหลือสี่เหลี่ยมจัตุรัสด้าน c ตรงกลาง
     ติ๊ก จับรูปสามเหลี่ยมเป็นสี่เหลี่ยมผืนผ้าสองรูป เหลือสี่เหลี่ยมจัตุรัสด้าน a กับด้าน b */
  "c10-rearrange": {
    bbox: REARRANGE_BOX,
    axis: false,
    initial: { a: 3, b: 4, moved: 0 },
    sliders: [
      { key: "a", label: "<i>a</i>", min: 1, max: 6, step: 1 },
      { key: "b", label: "<i>b</i>", min: 1, max: 6, step: 1 },
      { key: "moved", label: "ย้ายรูปสามเหลี่ยม", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      plain(board, REARRANGE_BOX);
      const a = (): number => s.a ?? 3;
      const b = (): number => s.b ?? 4;
      const moved = (): boolean => (s.moved ?? 0) > 0;
      const k = (): number => 10 / (a() + b());
      const P = (x: number, y: number): XY => [k() * x, k() * y];

      const triangles = (): XY[][] => {
        const A = a();
        const B = b();
        const S = A + B;
        if (!moved()) {
          return [
            [P(0, 0), P(A, 0), P(0, B)],
            [P(S, 0), P(S, A), P(A, 0)],
            [P(S, S), P(B, S), P(S, A)],
            [P(0, S), P(0, B), P(B, S)],
          ];
        }
        return [
          [P(A, 0), P(S, 0), P(S, A)],
          [P(A, 0), P(S, A), P(A, A)],
          [P(0, A), P(A, A), P(0, S)],
          [P(A, A), P(A, S), P(0, S)],
        ];
      };

      const inner = (): XY[] => (moved() ? [] : [P(a(), 0), P(a() + b(), a()), P(b(), a() + b()), P(0, b())]);
      const smallA = (): XY[] => (moved() ? [P(0, 0), P(a(), 0), P(a(), a()), P(0, a())] : []);
      const smallB = (): XY[] => {
        const A = a();
        const S = A + b();
        return moved() ? [P(A, A), P(S, A), P(S, S), P(A, S)] : [];
      };
      for (const piece of [inner, smallA, smallB]) {
        shape(board, piece, { strokeColor: c.accent, strokeWidth: 2.5, fillColor: c.accent, fillOpacity: 0.22 });
      }
      for (let i = 0; i < 4; i++) {
        shape(board, () => triangles()[i] ?? [], { strokeColor: c.teal, strokeWidth: 2, fillColor: c.teal, fillOpacity: 0.3 });
      }
      shape(board, () => [[0, 0], [10, 0], [10, 10], [0, 10]], { strokeColor: c.ink, strokeWidth: 2.5 });

      const label = (pts: () => XY[], v: string): void => {
        text(board, c, () => (pts().length ? centre(pts()) : [0, 0]), () => (pts().length ? sq(v) : ""), 18, LABEL_CSS);
      };
      label(inner, "c");
      label(smallA, "a");
      label(smallB, "b");

      // ความยาวช่วงบนขอบล่างและขอบซ้ายของสี่เหลี่ยมจัตุรัสใหญ่
      const edge = (at: () => XY, v: () => string): void => text(board, c, at, v, 17, LABEL_CSS);
      edge(() => [P(a() / 2, 0)[0], -0.6], () => "a");
      edge(() => [P(a() + b() / 2, 0)[0], -0.6], () => "b");
      edge(() => [-0.6, P(0, (moved() ? a() : b()) / 2)[1]], () => (moved() ? "a" : "b"));
      edge(() => [-0.6, P(0, moved() ? a() + b() / 2 : b() + a() / 2)[1]], () => (moved() ? "b" : "a"));
    },
    readout(s) {
      const a = s.a ?? 3;
      const b = s.b ?? 4;
      const tri = (4 * a * b) / 2;
      const big = (a + b) ** 2;
      if ((s.moved ?? 0) > 0) {
        return `ส่วนสีส้มคือสี่เหลี่ยมจัตุรัสสองรูป ${m(`${sq("a")} + ${sq("b")} = ${a * a} + ${b * b} = ${a * a + b * b}`)}<br>`
          + `รูปสามเหลี่ยมสี่รูปเท่าเดิม ส่วนสีส้มจึงเท่ากับ ${m(sq("c"))} ก่อนย้าย`;
      }
      return `ส่วนสีส้มคือสี่เหลี่ยมจัตุรัสด้าน ${m("<i>c</i>")} มีพื้นที่ ${m(sq("c"))}<br>`
        + `${m(`${sq("c")} = (${a} + ${b})<sup>2</sup> − 4 × ½ × ${a} × ${b} = ${big} − ${tri} = ${big - tri}`)}`;
    },
  },

  /* A กับ B อยู่กับที่ AB ยาว 5 หน่วย ลาก C บนจุดตัดของเส้นตาราง ด้าน a = BC  b = CA  c = AB */
  "c10-converse": {
    bbox: CONVERSE_BOX,
    axis: false,
    initial: { x: 2, y: 3 },
    draw(board, s, c, changed) {
      plain(board, CONVERSE_BOX);
      grid(board, c, -16, 21, -7, 11);
      const A: XY = [0, 0];
      const B: XY = [5, 0];
      const C = (): XY => [s.x ?? 2, s.y ?? 3];
      const g = (): XY => centre([A, B, C()]);
      const sides: [() => XY, () => XY, string, string][] = [
        [() => B, C, c.teal, "a"],
        [C, () => A, c.violet, "b"],
        [() => A, () => B, c.accent, "c"],
      ];
      for (const [p, q, color, v] of sides) {
        shape(board, () => outward(p(), q()), { strokeColor: color, strokeWidth: 2, fillColor: color, fillOpacity: 0.16 });
        text(board, c, () => centre(outward(p(), q())), () => areaLabel(v, d2(p(), q())));
        text(board, c, () => sideLabel(p(), q(), g()), () => v, 17, LABEL_CSS);
      }
      shape(board, () => [A, B, C()], { strokeColor: c.ink, strokeWidth: 2.5, fillColor: c.ink, fillOpacity: 0.05 });
      // เครื่องหมายมุมฉากขึ้นเฉพาะเมื่อมุม C เป็นมุมฉากพอดี
      shape(board, () => (d2(B, C()) + d2(C(), A) === d2(A, B) ? rightMark(C(), A, B) : []), {
        strokeColor: c.ink, strokeWidth: 1.5,
      }, false);
      vertex(board, c, A, "A", [-18, -16]);
      vertex(board, c, B, "B", [8, -16]);
      handle(board, c, C(), "C", [-5, 18], (p) => [clamp(Math.round(p[0]), 0, 5), clamp(Math.round(p[1]), 1, 4)], (p) => {
        s.x = p[0];
        s.y = p[1];
        changed();
      });
    },
    readout(s) {
      const C: XY = [s.x ?? 2, s.y ?? 3];
      const a2 = d2([5, 0], C);
      const b2 = d2(C, [0, 0]);
      const c2 = 25;
      const sum = a2 + b2;
      const ca: XY = [-C[0], -C[1]];
      const cb: XY = [5 - C[0], -C[1]];
      const deg = Math.round((Math.acos((ca[0] * cb[0] + ca[1] * cb[1]) / Math.sqrt(a2 * b2)) * 180) / Math.PI);
      const cmp = sum === c2 ? "=" : sum > c2 ? "&gt;" : "&lt;";
      const kind = sum === c2 ? "มุม C เป็นมุมฉาก" : sum > c2 ? "มุม C เล็กกว่ามุมฉาก" : "มุม C ใหญ่กว่ามุมฉาก";
      let other = "";
      if (b2 + c2 === a2) other = `<br>ตอนนี้มุม A เป็นมุมฉากแทน เพราะ ${m(`${sq("b")} + ${sq("c")} = ${sq("a")}`)}`;
      if (a2 + c2 === b2) other = `<br>ตอนนี้มุม B เป็นมุมฉากแทน เพราะ ${m(`${sq("a")} + ${sq("c")} = ${sq("b")}`)}`;
      return `${m(`${sq("a")} + ${sq("b")} = ${a2} + ${b2} = ${sum} ${cmp} ${c2} = ${sq("c")}`)}<br>`
        + `${kind}  วัดได้ประมาณ ${m(`${deg}°`)}${other}`;
    },
  },
};
