/* กราฟของบทที่ 28 วงกลม
   ทั้งสองกราฟซ่อนแกน และตั้งกรอบให้หนึ่งหน่วยแนวนอนยาวเท่าแนวตั้ง วงกลมจึงกลม และมุมที่อ่านได้ตรงกับรูป */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type XY = [number, number];
type Box = [number, number, number, number];

const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";

/* ตัวเลขในข้อความ ปัดตามจำนวนตำแหน่งที่ให้ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
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
const rad = (deg: number): number => (deg * Math.PI) / 180;
const onCircle = (r: number, deg: number): XY => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];

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

/* เครื่องหมายมุมฉากที่จุด at ด้านยาว k ตามแขนที่ชี้ไป p และ q */
function squarePoints(at: XY, p: XY, q: XY, k: number): XY[] {
  const lu = dist(at, p);
  const lv = dist(at, q);
  const u: XY = [((p[0] - at[0]) / lu) * k, ((p[1] - at[1]) / lu) * k];
  const v: XY = [((q[0] - at[0]) / lv) * k, ((q[1] - at[1]) / lv) * k];
  return [[at[0] + u[0], at[1] + u[1]], [at[0] + u[0] + v[0], at[1] + u[1] + v[1]], [at[0] + v[0], at[1] + v[1]]];
}

function plain(board: JXG.Board, box: Box): void {
  board.setBoundingBox(box, true);
}

/* เส้นหลายท่อนที่คำนวณจุดใหม่ทุกครั้งที่กราฟอัปเดต */
function shape(board: JXG.Board, pts: () => XY[], attrs: object): void {
  const cv = board.create("curve", [[0], [0]], { fixed: true, highlight: false, ...attrs });
  cv.updateDataArray = function () {
    const ps = pts();
    this.dataX = ps.map((p) => p[0]);
    this.dataY = ps.map((p) => p[1]);
  };
}

function fixedPoint(board: JXG.Board, c: Colors, p: () => XY): JXG.Point {
  return board.create("point", [() => p()[0], () => p()[1]], {
    fixed: true, highlight: false, withLabel: false, size: 3.5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 1.5,
  }) as JXG.Point;
}

/* ชื่อจุด วางไว้ที่ตำแหน่ง at ที่คำนวณใหม่ทุกครั้ง */
function label(board: JXG.Board, c: Colors, at: () => XY, name: string): void {
  board.create("text", [() => at()[0], () => at()[1], name], {
    fixed: true, highlight: false, anchorX: "middle", anchorY: "middle", fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS,
  });
}

/* ชื่อจุดบนวงกลมรัศมี r วางนอกวงกลมตามแนวรัศมี */
function outside(at: XY, r: number, gap: number): XY {
  const d = Math.hypot(at[0], at[1]) || 1;
  return [(at[0] / d) * (r + gap), (at[1] / d) * (r + gap)];
}

/* มุมในส่วนโค้ง ส่วนโค้ง AB อยู่ด้านล่างของวงกลม แถบเลื่อนกำหนดขนาดของมุมที่จุดศูนย์กลาง AOB
   จุด P ลากไปตามวงกลมได้ ถ้า P อยู่บนส่วนโค้งที่ไม่ใช่ AB มุม APB เท่ากับครึ่งหนึ่งของมุม AOB เสมอ */
const IN_BOX: Box = [-4.2, 4.2, 4.2, -4.2];
const IN_R = 3;

function inscribedParts(s: Record<string, number>): { A: XY; B: XY; P: XY; aob: number; p: number } {
  const aob = s.aob ?? 100;
  const p = ((s.p ?? 110) % 360 + 360) % 360;
  return { A: onCircle(IN_R, 270 - aob / 2), B: onCircle(IN_R, 270 + aob / 2), P: onCircle(IN_R, p), aob, p };
}

/* เส้นสัมผัสสองเส้นจากจุด P นอกวงกลม จุด P ติดเส้นตารางทุกครึ่งหน่วย */
const TAN_BOX: Box = [-3, 4.5, 8, -4.5];
const TAN_R = 2;

function tangentParts(s: Record<string, number>): { P: XY; A: XY; B: XY } {
  const P: XY = [s.x ?? 5.5, s.y ?? 2];
  const d = Math.hypot(P[0], P[1]);
  const phi = Math.atan2(P[1], P[0]);
  const alpha = Math.acos(TAN_R / d);
  return {
    P,
    A: [TAN_R * Math.cos(phi + alpha), TAN_R * Math.sin(phi + alpha)],
    B: [TAN_R * Math.cos(phi - alpha), TAN_R * Math.sin(phi - alpha)],
  };
}

export const boards: Record<string, BoardDef> = {
  "c28-inscribed": {
    bbox: IN_BOX,
    axis: false,
    aspect: 1,
    initial: { aob: 100, p: 110 },
    sliders: [{ key: "aob", label: "มุม <i>AOB</i>", min: 40, max: 180, step: 10 }],
    draw(board, s, c, changed) {
      plain(board, IN_BOX);
      const O: XY = [0, 0];
      const A = (): XY => inscribedParts(s).A;
      const B = (): XY => inscribedParts(s).B;
      const P = (): XY => inscribedParts(s).P;
      const circ = board.create("circle", [O, IN_R], {
        fixed: true, highlight: false, strokeColor: c.ink, strokeWidth: 2, fillColor: "none",
      });
      // ส่วนโค้ง AB ที่รองรับมุม
      shape(board, () => {
        const { aob } = inscribedParts(s);
        const out: XY[] = [];
        for (let i = 0; i <= 48; i++) out.push(onCircle(IN_R, 270 - aob / 2 + (aob * i) / 48));
        return out;
      }, { strokeColor: c.violet, strokeWidth: 5 });
      shape(board, () => [A(), O, B()], { strokeColor: c.teal, strokeWidth: 2.5 });
      shape(board, () => [A(), P(), B()], { strokeColor: c.accent, strokeWidth: 3 });
      shape(board, () => arcPoints(O, A(), B(), 0.55), { strokeColor: c.teal, strokeWidth: 2.5 });
      shape(board, () => arcPoints(P(), A(), B(), 0.75), { strokeColor: c.accent, strokeWidth: 2.5 });
      fixedPoint(board, c, () => O);
      fixedPoint(board, c, A);
      fixedPoint(board, c, B);
      label(board, c, () => [-0.3, 0.32], "O");
      label(board, c, () => outside(A(), IN_R, 0.4), "A");
      label(board, c, () => outside(B(), IN_R, 0.4), "B");
      label(board, c, () => outside(P(), IN_R, 0.45), "P");
      const start = P();
      const g = board.create("glider", [start[0], start[1], circ], {
        withLabel: false, size: 7, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
      }) as JXG.Point;
      g.on("drag", () => {
        const deg = (Math.atan2(g.Y(), g.X()) * 180) / Math.PI;
        s.p = Math.round((((deg % 360) + 360) % 360) * 100) / 100;
        changed();
      });
    },
    readout(s) {
      const { A, B, P, aob, p } = inscribedParts(s);
      // ระยะเชิงมุมจากจุดล่างสุดของวงกลม ไปถึง P
      const fromBottom = Math.min(Math.abs(p - 270), 360 - Math.abs(p - 270));
      if (Math.abs(fromBottom - aob / 2) < 3) return `ลากจุด ${m("<i>P</i>")} ออกจากจุด ${m("<i>A</i>")} และ ${m("<i>B</i>")} ก่อน`;
      const apb = degrees(P, A, B);
      const head = `${m(`<i>AOB</i> = ${fmt(aob, 1)}°`)}  ${m(`<i>APB</i> ≈ ${fmt(apb, 1)}°`)}`;
      if (fromBottom < aob / 2) {
        return `${head}<br>${m("<i>P</i>")} อยู่บนส่วนโค้ง ${m("<i>AB</i>")} เอง มุมจึงไม่ได้รองรับด้วยส่วนโค้งนี้ ได้ ${m(`180° − ${fmt(aob / 2, 1)}° = ${fmt(180 - aob / 2, 1)}°`)}`;
      }
      if (aob === 180) return `${head}<br>${m("<i>AB</i>")} เป็นเส้นผ่านศูนย์กลาง มุมในครึ่งวงกลมเป็นมุมฉากทุกตำแหน่งของ ${m("<i>P</i>")}`;
      return `${head}<br>ลาก ${m("<i>P</i>")} ไปตรงไหนก็ได้ ${m("<i>APB</i>")} เป็นครึ่งหนึ่งของ ${m("<i>AOB</i>")} เสมอ`;
    },
  },

  "c28-tangents": {
    bbox: TAN_BOX,
    axis: false,
    aspect: 11 / 9,
    initial: { x: 5.5, y: 2 },
    draw(board, s, c, changed) {
      plain(board, TAN_BOX);
      const O: XY = [0, 0];
      const parts = (): { P: XY; A: XY; B: XY } => tangentParts(s);
      board.create("circle", [O, TAN_R], {
        fixed: true, highlight: false, strokeColor: c.ink, strokeWidth: 2, fillColor: "none",
      });
      shape(board, () => [O, parts().P], { strokeColor: c.ink3, strokeWidth: 1.5, dash: 2 });
      shape(board, () => [parts().A, O, parts().B], { strokeColor: c.teal, strokeWidth: 2.5 });
      shape(board, () => [parts().A, parts().P, parts().B], { strokeColor: c.accent, strokeWidth: 3 });
      shape(board, () => squarePoints(parts().A, O, parts().P, 0.3), { strokeColor: c.ink, strokeWidth: 1.5 });
      shape(board, () => squarePoints(parts().B, O, parts().P, 0.3), { strokeColor: c.ink, strokeWidth: 1.5 });
      fixedPoint(board, c, () => O);
      fixedPoint(board, c, () => parts().A);
      fixedPoint(board, c, () => parts().B);
      label(board, c, () => [-0.35, -0.35], "O");
      label(board, c, () => outside(parts().A, TAN_R, 0.4), "A");
      label(board, c, () => outside(parts().B, TAN_R, 0.4), "B");
      const p = board.create("point", parts().P, {
        name: "P", size: 7, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
        label: { offset: [10, 12], fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
      }) as JXG.Point;
      p.on("drag", () => {
        let at: XY = [clamp(half(p.X()), -2.5, 7.5), clamp(half(p.Y()), -4, 4)];
        const d = Math.hypot(at[0], at[1]);
        // อยู่นอกวงกลมห่างจากจุดศูนย์กลางอย่างน้อย 3 หน่วย เส้นสัมผัสจะได้ไม่สั้นจนมองไม่เห็น
        if (d < 3) at = d === 0 ? [3, 0] : [(at[0] / d) * 3, (at[1] / d) * 3];
        if (at[0] !== p.X() || at[1] !== p.Y()) p.moveTo(at);
        s.x = at[0];
        s.y = at[1];
        changed();
      });
    },
    readout(s) {
      const { P, A, B } = tangentParts(s);
      const O: XY = [0, 0];
      return `${m(`<i>PA</i> ≈ ${fmt(dist(P, A))}`)}  ${m(`<i>PB</i> ≈ ${fmt(dist(P, B))}`)}  ${m(`<i>OP</i> ≈ ${fmt(dist(O, P))}`)}<br>`
        + `${m(`<i>OAP</i> = ${fmt(degrees(A, O, P), 1)}°`)}  ${m(`<i>OBP</i> = ${fmt(degrees(B, O, P), 1)}°`)}  `
        + `${m(`<i>APO</i> ≈ ${fmt(degrees(P, A, O), 1)}°`)}  ${m(`<i>BPO</i> ≈ ${fmt(degrees(P, B, O), 1)}°`)}`;
    },
  },
};
