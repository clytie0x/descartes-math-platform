/* กราฟของบทที่ 19 การให้เหตุผลทางเรขาคณิต
   ทั้งสองกราฟซ่อนแกน และตั้งให้หนึ่งหน่วยแนวนอนยาวเท่าแนวตั้ง มุมกับความยาวที่อ่านได้จะตรงกับรูป
   จุดที่ลากได้ติดเส้นตารางทุกครึ่งหน่วย ค่าจึงเท่ากันพอดีเมื่อควรเท่ากัน */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type XY = [number, number];
type Box = [number, number, number, number];

const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";

/* ตัวเลขในข้อความ ปัดสองตำแหน่ง ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number, places = 2): string {
  const f = 10 ** places;
  const r = Math.round(n * f) / f;
  return String(r).replace("-", "−");
}

function m(text: string): string {
  return `<span class="m">${text}</span>`;
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));
const half = (v: number): number => Math.round(v * 2) / 2;
const dist = (p: XY, q: XY): number => Math.hypot(q[0] - p[0], q[1] - p[1]);

/* ขนาดของมุมที่จุด at ระหว่างแขนที่ชี้ไป p และ q เป็นองศา */
function degrees(at: XY, p: XY, q: XY): number {
  const u: XY = [p[0] - at[0], p[1] - at[1]];
  const v: XY = [q[0] - at[0], q[1] - at[1]];
  const cos = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]));
  return (Math.acos(clamp(cos, -1, 1)) * 180) / Math.PI;
}

/* ส่วนโค้งแสดงมุมที่จุด at จากแขน p ไปแขน q ทางที่สั้นกว่า */
function arcPoints(at: XY, p: XY, q: XY, r: number): XY[] {
  const a1 = Math.atan2(p[1] - at[1], p[0] - at[0]);
  const a2 = Math.atan2(q[1] - at[1], q[0] - at[0]);
  const d = ((a2 - a1 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;
  const out: XY[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = a1 + (d * i) / 24;
    out.push([at[0] + r * Math.cos(t), at[1] + r * Math.sin(t)]);
  }
  return out;
}

function plain(board: JXG.Board, box: Box): void {
  board.setBoundingBox(box, true);
}

/* เส้นหลายท่อนที่คำนวณจุดใหม่ทุกครั้งที่กราฟอัปเดต */
function shape(board: JXG.Board, pts: () => XY[], attrs: object, closed = false): void {
  const cv = board.create("curve", [[0], [0]], { fixed: true, highlight: false, ...attrs });
  cv.updateDataArray = function () {
    const ps = pts();
    const all = closed && ps.length ? [...ps, ps[0] as XY] : ps;
    this.dataX = all.map((p) => p[0]);
    this.dataY = all.map((p) => p[1]);
  };
}

/* จุดตารางจางๆ ทุกหนึ่งหน่วย บอกว่าจุดที่ลากติดตำแหน่งไหนได้ */
function dots(board: JXG.Board, c: Colors, x0: number, x1: number, y0: number, y1: number): void {
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      board.create("point", [x, y], {
        fixed: true, highlight: false, withLabel: false, size: 1, fillColor: c.rule, strokeColor: c.rule,
      });
    }
  }
}

function vertex(board: JXG.Board, c: Colors, p: () => XY, name: string, offset: [number, number]): void {
  board.create("point", [() => p()[0], () => p()[1]], {
    fixed: true, highlight: false, size: 3.5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 1.5,
    name, withLabel: name !== "", label: { offset, fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
  });
}

/* จุดที่นักเรียนลากได้ place รับตำแหน่งที่ลากไป คืนตำแหน่งที่ติดตารางและอยู่ในช่วงที่อนุญาต */
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

const ISO_BOX: Box = [-5, 6.2, 5, -1.3];
const ISO_B: XY = [-3, 0];
const ISO_C: XY = [3, 0];

const PARA_BOX: Box = [-1, 7, 9.67, -1];
const PARA_A: XY = [0, 0];

export const boards: Record<string, BoardDef> = {
  /* ฐาน BC อยู่กับที่ ลากจุดยอด A แล้วดูว่ามุมที่ฐานเท่ากันเมื่อไร
     เส้นประคือเส้นแบ่งครึ่งตั้งฉากของ BC จุด A อยู่บนเส้นนี้เมื่อ AB = AC เท่านั้น */
  "c19-isosceles": {
    bbox: ISO_BOX,
    axis: false,
    initial: { x: 0, y: 4 },
    draw(board, s, c, changed) {
      plain(board, ISO_BOX);
      dots(board, c, -4, 4, 1, 5);
      const A = (): XY => [s.x ?? 0, s.y ?? 4];
      board.create("segment", [[0, -1], [0, 5.9]], {
        fixed: true, highlight: false, strokeColor: c.teal, strokeWidth: 1.5, dash: 2,
      });
      shape(board, () => [ISO_B, ISO_C], { strokeColor: c.ink, strokeWidth: 2.5 });
      shape(board, () => [ISO_B, A(), ISO_C], { strokeColor: c.accent, strokeWidth: 3 });
      shape(board, () => arcPoints(ISO_B, ISO_C, A(), 0.8), { strokeColor: c.violet, strokeWidth: 2.5 });
      shape(board, () => arcPoints(ISO_C, A(), ISO_B, 0.8), { strokeColor: c.violet, strokeWidth: 2.5 });
      vertex(board, c, () => ISO_B, "B", [-18, -14]);
      vertex(board, c, () => ISO_C, "C", [8, -14]);
      handle(board, c, A(), "A", [-6, 18], (p) => [clamp(half(p[0]), -4, 4), clamp(half(p[1]), 1, 5.5)], (p) => {
        s.x = p[0];
        s.y = p[1];
        changed();
      });
    },
    readout(s) {
      const A: XY = [s.x ?? 0, s.y ?? 4];
      const ab = dist(A, ISO_B);
      const ac = dist(A, ISO_C);
      const b = degrees(ISO_B, ISO_C, A);
      const cc = degrees(ISO_C, A, ISO_B);
      const same = Math.abs(ab - ac) < 1e-9;
      const lens = `${m(`<i>AB</i> ≈ ${fmt(ab)}`)}  ${m(`<i>AC</i> ≈ ${fmt(ac)}`)}`;
      const angs = `${m(`<i>B</i> ≈ ${fmt(b, 1)}°`)}  ${m(`<i>C</i> ≈ ${fmt(cc, 1)}°`)}`;
      const note = same
        ? `${m("<i>AB</i> = <i>AC</i>")} รูปนี้เป็นรูปสามเหลี่ยมหน้าจั่ว และมุมที่ฐานเท่ากัน`
        : `${m("<i>AB</i> ≠ <i>AC</i>")} มุมที่ฐานไม่เท่ากัน มุมที่ใหญ่กว่าอยู่ตรงข้ามด้านที่ยาวกว่า`;
      return `${lens}<br>มุมที่ฐาน ${angs}<br>${note}`;
    },
  },

  /* A อยู่กับที่ ลาก B กับ D แล้ว C = B + D − A รูปจึงเป็นรูปสี่เหลี่ยมด้านขนานเสมอ */
  "c19-parallelogram": {
    bbox: PARA_BOX,
    axis: false,
    initial: { bx: 5, by: 0, dx: 1.5, dy: 4 },
    draw(board, s, c, changed) {
      plain(board, PARA_BOX);
      const B = (): XY => [s.bx ?? 5, s.by ?? 0];
      const D = (): XY => [s.dx ?? 1.5, s.dy ?? 4];
      const C = (): XY => [B()[0] + D()[0] - PARA_A[0], B()[1] + D()[1] - PARA_A[1]];
      const O = (): XY => [(PARA_A[0] + C()[0]) / 2, (PARA_A[1] + C()[1]) / 2];
      shape(board, () => [PARA_A, C()], { strokeColor: c.teal, strokeWidth: 2, dash: 2 });
      shape(board, () => [B(), D()], { strokeColor: c.teal, strokeWidth: 2, dash: 2 });
      shape(board, () => [PARA_A, B(), C(), D()], { strokeColor: c.accent, strokeWidth: 3 }, true);
      vertex(board, c, () => PARA_A, "A", [-16, -14]);
      vertex(board, c, C, "C", [8, 14]);
      vertex(board, c, O, "O", [6, -14]);
      handle(board, c, B(), "B", [8, -14], (p) => [clamp(half(p[0]), 3, 6), clamp(half(p[1]), -0.5, 1.5)], (p) => {
        s.bx = p[0];
        s.by = p[1];
        changed();
      });
      handle(board, c, D(), "D", [-16, 14], (p) => [clamp(half(p[0]), -0.5, 3), clamp(half(p[1]), 2.5, 5)], (p) => {
        s.dx = p[0];
        s.dy = p[1];
        changed();
      });
    },
    readout(s) {
      const B: XY = [s.bx ?? 5, s.by ?? 0];
      const D: XY = [s.dx ?? 1.5, s.dy ?? 4];
      const C: XY = [B[0] + D[0], B[1] + D[1]];
      const O: XY = [C[0] / 2, C[1] / 2];
      const pair = (l1: string, v1: number, l2: string, v2: number): string =>
        m(`<i>${l1}</i> ≈ ${fmt(v1)}  <i>${l2}</i> ≈ ${fmt(v2)}`);
      return `ด้านตรงข้าม ${pair("AB", dist(PARA_A, B), "DC", dist(D, C))}  ${pair("BC", dist(B, C), "AD", dist(PARA_A, D))}<br>`
        + `มุมตรงข้าม ${m(`<i>A</i> ≈ ${fmt(degrees(PARA_A, B, D), 1)}°  <i>C</i> ≈ ${fmt(degrees(C, D, B), 1)}°`)}<br>`
        + `เส้นทแยงมุม ${pair("OA", dist(O, PARA_A), "OC", dist(O, C))}  ${pair("OB", dist(O, B), "OD", dist(O, D))}`;
    },
  },
};
