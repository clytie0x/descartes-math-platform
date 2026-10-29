/* กราฟของบทที่ 13 การแปลงทางเรขาคณิต
   รูปต้นแบบเป็นสีดำ ลากจุดยอดได้ ภาพเป็นสีส้ม เส้นสะท้อนเป็นสีม่วง เส้นช่วยเป็นเส้นประสีเขียว */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type XY = [number, number];
type State = Record<string, number>;

const BOX: [number, number, number, number] = [-8, 6, 8, -6];
const EX_BOX: [number, number, number, number] = [-7, 5.25, 7, -5.25];
const MONO = "font-family: 'IBM Plex Mono', monospace; font-weight: 600";
const KEYS = ["a", "b", "c"] as const;
const NAMES = ["A", "B", "C"] as const;

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ และไม่ให้ขึ้น −0 */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r === 0 ? 0 : r).replace("-", "−");
}

function m(html: string): string {
  return `<span class="m">${html}</span>`;
}

function pt(name: string, x: number, y: number): string {
  return m(`${name}(${fmt(x)}, ${fmt(y)})`);
}

/* + 3 หรือ − 3 ต่อท้ายตัวแปร ถ้าเป็นศูนย์ไม่ต้องเขียน */
function plus(v: number): string {
  if (v === 0) return "";
  return ` ${v > 0 ? "+" : "−"} ${fmt(Math.abs(v))}`;
}

/* 2m − x เขียนให้อ่านง่าย */
function mirrorTerm(mm: number, v: string): string {
  return mm === 0 ? `−${v}` : `${fmt(2 * mm)} − ${v}`;
}

function name(i: number): string {
  return NAMES[i] ?? "";
}

function vertices(s: State): XY[] {
  return KEYS.map((k) => [s[`${k}x`] ?? 0, s[`${k}y`] ?? 0] as XY);
}

/* ให้หนึ่งหน่วยของแกน x กับแกน y ยาวเท่ากันบนจอ มุมฉากจะได้ไม่เบี้ยว */
function sameScale(board: JXG.Board, bbox: [number, number, number, number]): void {
  board.setBoundingBox(bbox, true);
}

function label(color: string, offset: [number, number] = [8, 12]): JXG.LabelOptions {
  return { offset, fontSize: 15, strokeColor: color, cssStyle: MONO } as JXG.LabelOptions;
}

/* จุดยอดของรูปต้นแบบ ลากได้ ติดเส้นตาราง */
function handle(board: JXG.Board, s: State, key: string, name: string, c: Colors, changed: () => void): JXG.Point {
  const p = board.create("point", [s[`${key}x`] ?? 0, s[`${key}y`] ?? 0], {
    name, withLabel: true, size: 6, snapToGrid: true, snapSizeX: 1, snapSizeY: 1,
    fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2,
    highlightFillColor: c.ink, highlightStrokeColor: c.accent,
    label: label(c.ink),
  });
  p.on("drag", () => {
    s[`${key}x`] = Math.round(p.X());
    s[`${key}y`] = Math.round(p.Y());
    changed();
  });
  return p;
}

/* จุดยอดของรูปต้นแบบทั้งสามจุด */
function handles(board: JXG.Board, s: State, c: Colors, changed: () => void): JXG.Point[] {
  return KEYS.map((k, i) => handle(board, s, k, name(i), c, changed));
}

/* ภาพของจุด p ตามกฎ f คำนวณจากตำแหน่งจุดบนกราฟทุกครั้ง จะได้ขยับตามตอนลาก */
function imagePoint(board: JXG.Board, p: JXG.Point, f: (x: number, y: number) => XY, name: string, color: string): JXG.Point {
  return board.create("point", [() => f(p.X(), p.Y())[0], () => f(p.X(), p.Y())[1]], {
    name, withLabel: true, fixed: true, size: 4, fillColor: color, strokeColor: color, highlight: false,
    label: label(color),
  });
}

function triangle(board: JXG.Board, pts: JXG.Point[], color: string, opacity: number, dash = 0): void {
  board.create("polygon", pts, {
    fixed: true, highlight: false, fillColor: color, fillOpacity: opacity,
    borders: { strokeColor: color, strokeWidth: dash ? 2 : 2.5, dash, fixed: true, highlight: false },
  });
}

function helper(board: JXG.Board, p: JXG.Point, q: JXG.Point, c: Colors, arrow = false): void {
  board.create(arrow ? "arrow" : "segment", [p, q], {
    strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
  });
}

/* เส้นตั้ง x = v() หรือเส้นนอน y = v() */
function mirrorLine(board: JXG.Board, v: () => number, horizontal: () => boolean, c: Colors, dash = 0): void {
  board.create("line", [
    [() => (horizontal() ? 0 : v()), () => (horizontal() ? v() : 0)],
    [() => (horizontal() ? 1 : v()), () => (horizontal() ? v() : 1)],
  ], { strokeColor: c.violet, strokeWidth: 2.5, dash, fixed: true, highlight: false });
}

/* ภาพจากการหมุนจุด (x, y) รอบ (ox, oy) ทวนเข็มนาฬิกา deg องศา */
function rotate(x: number, y: number, ox: number, oy: number, deg: number): XY {
  const t = (deg * Math.PI) / 180;
  const dx = x - ox;
  const dy = y - oy;
  return [ox + dx * Math.cos(t) - dy * Math.sin(t), oy + dx * Math.sin(t) + dy * Math.cos(t)];
}

/* มุมที่หมุนจริงแบบทวนเข็มนาฬิกา จากแถบมุมกับช่องติ๊กตามเข็มนาฬิกา */
function ccwAngle(s: State): number {
  const deg = s.deg ?? 90;
  return (s.cw ?? 0) > 0 ? -deg : deg;
}

/* กฎของการหมุนรอบจุดกำเนิด ใช้เมื่อมุมเป็นพหุคูณของ 90 องศา */
const ROTATION_RULE: Record<number, string> = {
  0: "(<i>x</i>, <i>y</i>)",
  90: "(−<i>y</i>, <i>x</i>)",
  180: "(−<i>x</i>, −<i>y</i>)",
  270: "(<i>y</i>, −<i>x</i>)",
};

/* แบบฝึกหัด ลากจุดสีส้มไปที่ภาพ บนกราฟมีรูปต้นแบบ เส้นสะท้อน หรือจุดหมุนให้ดู */
interface DragSpec {
  points: { name: string; at: XY; offset?: [number, number] }[];
  polygon?: boolean; // ต่อจุดทั้งหมดเป็นรูปหลายเหลี่ยม
  mirror?: { x?: number; y?: number };
  start: XY;
}

function dragImage(spec: DragSpec): BoardDef {
  return {
    bbox: EX_BOX,
    initial: { x: spec.start[0], y: spec.start[1] },
    draw(board, s, c, changed) {
      sameScale(board, EX_BOX);
      if (spec.mirror?.x !== undefined) mirrorLine(board, () => spec.mirror?.x ?? 0, () => false, c);
      if (spec.mirror?.y !== undefined) mirrorLine(board, () => spec.mirror?.y ?? 0, () => true, c);
      const fixed = spec.points.map((q) => board.create("point", q.at, {
        name: q.name, withLabel: true, fixed: true, size: 4, fillColor: c.ink, strokeColor: c.ink, highlight: false,
        label: label(c.ink, q.offset),
      }));
      if (spec.polygon) triangle(board, fixed, c.ink, 0.08);
      const p = board.create("point", [s.x ?? 0, s.y ?? 0], {
        withLabel: false, size: 7, snapToGrid: true, snapSizeX: 1, snapSizeY: 1,
        fillColor: c.accent, strokeColor: c.ink, strokeWidth: 2,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
      });
      p.on("drag", () => {
        s.x = Math.round(p.X());
        s.y = Math.round(p.Y());
        changed();
      });
    },
    readout(s) {
      return `จุดที่ลากอยู่ที่ ${m(`(${fmt(s.x ?? 0)}, ${fmt(s.y ?? 0)})`)}`;
    },
    value(s) {
      return `${s.x ?? 0}, ${s.y ?? 0}`;
    },
  };
}

export const boards: Record<string, BoardDef> = {
  /* เลื่อนขนานสามเหลี่ยม ABC ไปทางขวา a หน่วย ขึ้น b หน่วย ลูกศรเชื่อมจุดกับภาพ */
  "c13-translate": {
    bbox: BOX,
    initial: { ax: -6, ay: 1, bx: -3, by: 1, cx: -5, cy: 4, a: 6, b: -3 },
    sliders: [
      { key: "a", label: "ขวา <i>a</i>", min: -6, max: 6, step: 1 },
      { key: "b", label: "ขึ้น <i>b</i>", min: -5, max: 5, step: 1 },
    ],
    draw(board, s, c, changed) {
      sameScale(board, BOX);
      const f = (x: number, y: number): XY => [x + (s.a ?? 0), y + (s.b ?? 0)];
      const pre = handles(board, s, c, changed);
      const img = pre.map((p, i) => imagePoint(board, p, f, `${name(i)}′`, c.accent));
      triangle(board, pre, c.ink, 0.08);
      triangle(board, img, c.accent, 0.18);
      pre.forEach((p, i) => helper(board, p, img[i] as JXG.Point, c, true));
    },
    readout(s) {
      const a = s.a ?? 0;
      const b = s.b ?? 0;
      const pairs = vertices(s).map(([x, y], i) => `${pt(name(i), x, y)} → ${pt(`${name(i)}′`, x + a, y + b)}`);
      const rule = m(`(<i>x</i>, <i>y</i>) → (<i>x</i>${plus(a)}, <i>y</i>${plus(b)})`);
      return `${pairs.join("  ")}<br>กฎ ${rule}  ลูกศรทุกเส้นยาวเท่ากันและขนานกัน`;
    },
  },

  /* สะท้อนสามเหลี่ยมข้ามเส้นตั้ง x = m หรือเส้นนอน y = m */
  "c13-reflect": {
    bbox: BOX,
    initial: { ax: -6, ay: 1, bx: -2, by: 2, cx: -5, cy: 4, m: 0, horiz: 0 },
    sliders: [
      { key: "m", label: "เส้น <i>m</i>", min: -4, max: 4, step: 1 },
      { key: "horiz", label: "เส้นแนวนอน", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c, changed) {
      sameScale(board, BOX);
      const horiz = (): boolean => (s.horiz ?? 0) > 0;
      const mm = (): number => s.m ?? 0;
      const f = (x: number, y: number): XY => (horiz() ? [x, 2 * mm() - y] : [2 * mm() - x, y]);
      mirrorLine(board, mm, horiz, c);
      const pre = handles(board, s, c, changed);
      const img = pre.map((p, i) => imagePoint(board, p, f, `${name(i)}′`, c.accent));
      triangle(board, pre, c.ink, 0.08);
      triangle(board, img, c.accent, 0.18);
      pre.forEach((p, i) => helper(board, p, img[i] as JXG.Point, c));
    },
    readout(s) {
      const mm = s.m ?? 0;
      const horiz = (s.horiz ?? 0) > 0;
      const f = (x: number, y: number): XY => (horiz ? [x, 2 * mm - y] : [2 * mm - x, y]);
      const line = horiz
        ? (mm === 0 ? `แกน ${m("<i>x</i>")}` : m(`<i>y</i> = ${fmt(mm)}`))
        : (mm === 0 ? `แกน ${m("<i>y</i>")}` : m(`<i>x</i> = ${fmt(mm)}`));
      const rule = horiz
        ? m(`(<i>x</i>, <i>y</i>) → (<i>x</i>, ${mirrorTerm(mm, "<i>y</i>")})`)
        : m(`(<i>x</i>, <i>y</i>) → (${mirrorTerm(mm, "<i>x</i>")}, <i>y</i>)`);
      const pairs = vertices(s).map(([x, y], i) => {
        const [x2, y2] = f(x, y);
        return `${pt(name(i), x, y)} → ${pt(`${name(i)}′`, x2, y2)}`;
      });
      return `เส้นสะท้อน ${line}  กฎ ${rule}<br>${pairs.join("  ")}`;
    },
  },

  /* หมุนสามเหลี่ยมรอบจุด O ที่ลากได้ เส้นโค้งประคือทางที่จุด A เคลื่อนไป */
  "c13-rotate": {
    bbox: BOX,
    initial: { ax: 2, ay: 1, bx: 5, by: 1, cx: 2, cy: 3, ox: 0, oy: 0, deg: 90, cw: 0 },
    sliders: [
      { key: "deg", label: "มุม", min: 0, max: 360, step: 15 },
      { key: "cw", label: "ตามเข็มนาฬิกา", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c, changed) {
      sameScale(board, BOX);
      const o: JXG.Point = board.create("point", [s.ox ?? 0, s.oy ?? 0], {
        name: "O", withLabel: true, size: 5, snapToGrid: true, snapSizeX: 1, snapSizeY: 1,
        fillColor: c.violet, strokeColor: c.paper, strokeWidth: 2,
        highlightFillColor: c.violet, highlightStrokeColor: c.ink,
        label: label(c.violet, [-18, -12]),
      });
      o.on("drag", () => {
        s.ox = Math.round(o.X());
        s.oy = Math.round(o.Y());
        changed();
      });
      const f = (x: number, y: number): XY => rotate(x, y, o.X(), o.Y(), ccwAngle(s));
      const pre = handles(board, s, c, changed);
      const img = pre.map((p, i) => imagePoint(board, p, f, `${name(i)}′`, c.accent));
      triangle(board, pre, c.ink, 0.08);
      triangle(board, img, c.accent, 0.18);
      const a = pre[0] as JXG.Point;
      helper(board, o, a, c);
      helper(board, o, img[0] as JXG.Point, c);
      // ทางเดินของจุด A ตามวงกลมรัศมี OA จากมุมเดิมไปจนถึงภาพ
      const r = (): number => Math.hypot(a.X() - o.X(), a.Y() - o.Y());
      const from = (): number => Math.atan2(a.Y() - o.Y(), a.X() - o.X());
      const at = (t: number): number => from() + (t * ccwAngle(s) * Math.PI) / 180;
      board.create("curve", [
        (t: number) => o.X() + r() * Math.cos(at(t)),
        (t: number) => o.Y() + r() * Math.sin(at(t)),
        0, 1,
      ], { strokeColor: c.teal, strokeWidth: 2, dash: 1, fixed: true, highlight: false });
    },
    readout(s) {
      const deg = s.deg ?? 90;
      const ox = s.ox ?? 0;
      const oy = s.oy ?? 0;
      const ccw = ccwAngle(s);
      const dir = (s.cw ?? 0) > 0 ? "ตามเข็มนาฬิกา" : "ทวนเข็มนาฬิกา";
      const head = `หมุน ${m(`${fmt(deg)}°`)} ${dir} รอบจุด ${pt("O", ox, oy)}`;
      const pairs = vertices(s).map(([x, y], i) => {
        const [x2, y2] = rotate(x, y, ox, oy, ccw);
        return `${pt(name(i), x, y)} → ${pt(`${name(i)}′`, x2, y2)}`;
      });
      const turn = ((ccw % 360) + 360) % 360;
      const rule = ROTATION_RULE[turn];
      const tail = ox === 0 && oy === 0 && rule !== undefined
        ? `<br>กฎ ${m(`(<i>x</i>, <i>y</i>) → ${rule}`)}`
        : "";
      return `${head}<br>${pairs.join("  ")}${tail}`;
    },
  },

  /* สะท้อนสองครั้ง เส้นแรก x = p เส้นที่สอง x = q หรือ y = q ภาพแรกเป็นเส้นประ ภาพสุดท้ายเป็นสีส้ม */
  "c13-compose": {
    bbox: BOX,
    initial: { ax: -7, ay: 1, bx: -4, by: 1, cx: -6, cy: 4, p: -2, q: 1, perp: 0 },
    sliders: [
      { key: "p", label: "เส้นแรก <i>p</i>", min: -4, max: 4, step: 1 },
      { key: "q", label: "เส้นที่สอง <i>q</i>", min: -4, max: 4, step: 1 },
      { key: "perp", label: "เส้นที่สองแนวนอน", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c, changed) {
      sameScale(board, BOX);
      const perp = (): boolean => (s.perp ?? 0) > 0;
      const p = (): number => s.p ?? 0;
      const q = (): number => s.q ?? 0;
      const first = (x: number, y: number): XY => [2 * p() - x, y];
      const second = (x: number, y: number): XY => (perp() ? [x, 2 * q() - y] : [2 * q() - x, y]);
      mirrorLine(board, p, () => false, c);
      mirrorLine(board, q, perp, c, 2);
      board.create("text", [() => p() + 0.15, 5.3, "1"], {
        fontSize: 14, strokeColor: c.violet, fixed: true, highlight: false, cssStyle: MONO,
      });
      board.create("text", [() => (perp() ? 7.4 : q() + 0.15), () => (perp() ? q() + 0.35 : 5.3), "2"], {
        fontSize: 14, strokeColor: c.violet, fixed: true, highlight: false, cssStyle: MONO,
      });
      const pre = handles(board, s, c, changed);
      const mid = pre.map((pp, i) => imagePoint(board, pp, first, `${name(i)}′`, c.ink3));
      const img = mid.map((pp, i) => imagePoint(board, pp, second, `${name(i)}″`, c.accent));
      triangle(board, pre, c.ink, 0.08);
      triangle(board, mid, c.ink3, 0, 2);
      triangle(board, img, c.accent, 0.18);
    },
    readout(s) {
      const p = s.p ?? 0;
      const q = s.q ?? 0;
      const perp = (s.perp ?? 0) > 0;
      const line2 = perp ? m(`<i>y</i> = ${fmt(q)}`) : m(`<i>x</i> = ${fmt(q)}`);
      const head = `สะท้อนข้าม ${m(`<i>x</i> = ${fmt(p)}`)} แล้วสะท้อนข้าม ${line2}`;
      if (perp) {
        return `${head}<br>ผลเท่ากับ<strong>หมุน ${m("180°")}</strong> รอบจุดตัดของสองเส้น ${m(`(${fmt(p)}, ${fmt(q)})`)}`;
      }
      const d = 2 * (q - p);
      if (d === 0) return `${head}<br>สองเส้นทับกัน สะท้อนกลับมาที่เดิมพอดี`;
      return `${head}<br>ผลเท่ากับ<strong>เลื่อนขนาน</strong>ไปทาง${d > 0 ? "ขวา" : "ซ้าย"} ${m(fmt(Math.abs(d)))} หน่วย คือสองเท่าของระยะห่างระหว่างเส้น ${m(fmt(Math.abs(q - p)))}`;
    },
  },

  /* เฉลยข้อวาดภาพ หมุนสามเหลี่ยม A(1, 1) B(4, 1) C(4, 3) ตามเข็มนาฬิกา 90° รอบ A */
  "c13-sketch-check": {
    bbox: [-3, 4.5, 7, -3],
    initial: {},
    draw(board, _s, c) {
      sameScale(board, [-3, 4.5, 7, -3]);
      const make = (xy: XY, name: string, color: string, offset: [number, number]): JXG.Point =>
        board.create("point", xy, {
          name, withLabel: true, fixed: true, size: 4, fillColor: color, strokeColor: color, highlight: false,
          label: label(color, offset),
        });
      const pre = [make([1, 1], "A = A′", c.ink, [-62, 14]), make([4, 1], "B(4, 1)", c.ink, [8, 12]), make([4, 3], "C(4, 3)", c.ink, [8, 10])];
      const img = [pre[0] as JXG.Point, make([1, -2], "B′(1, −2)", c.accent, [-92, -6]), make([3, -2], "C′(3, −2)", c.accent, [8, -10])];
      triangle(board, pre, c.ink, 0.08);
      triangle(board, img, c.accent, 0.18);
      board.create("curve", [
        (t: number) => 1 + 3 * Math.cos(-t * Math.PI / 2),
        (t: number) => 1 + 3 * Math.sin(-t * Math.PI / 2),
        0, 1,
      ], { strokeColor: c.teal, strokeWidth: 2, dash: 1, fixed: true, highlight: false });
    },
  },

  "c13-ex-translate": dragImage({ points: [{ name: "A", at: [-3, 2] }], start: [0, 0] }),

  "c13-ex-reflect": dragImage({
    points: [{ name: "A", at: [-3, 1], offset: [-18, -10] }, { name: "B", at: [-1, 4] }, { name: "C", at: [0, 1], offset: [-4, -14] }],
    polygon: true,
    mirror: { x: 1 },
    start: [5, -3],
  }),

  "c13-ex-rotate": dragImage({
    points: [{ name: "O", at: [0, 0], offset: [-18, -12] }, { name: "P", at: [3, 1] }],
    start: [4, -3],
  }),

  "c13-ex-compose": dragImage({
    points: [{ name: "O", at: [0, 0], offset: [-18, -12] }, { name: "P", at: [1, 3] }],
    start: [4, -3],
  }),
};
