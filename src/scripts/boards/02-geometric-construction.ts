/* กราฟของบทที่ 2 การสร้างทางเรขาคณิต
   ทุกกราฟเป็นภาพการสร้างที่เลื่อนแถบ "ขั้นที่" เพื่อเปิดส่วนโค้งและเส้นทีละขั้น ซ่อนแกนและเส้นตาราง
   เพราะการสร้างไม่ใช้การวัด และตั้งอัตราส่วนแกนเป็น 1 ต่อ 1 วงกลมจะได้กลมจริง */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type XY = [number, number];
type Get<T> = () => T;
type State = Record<string, number>;

/* ตัวเลขในข้อความ ปัดสองตำแหน่ง ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

function m(text: string): string {
  return `<span class="m">${text}</span>`;
}

const dist = (p: XY, q: XY): number => Math.hypot(q[0] - p[0], q[1] - p[1]);
const ang = (from: XY, to: XY): number => Math.atan2(to[1] - from[1], to[0] - from[0]);
const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";

/* ซ่อนแกนกับเส้นตารางที่ board.ts สร้างให้ แล้วตั้งให้หนึ่งหน่วยแนวนอนยาวเท่าแนวตั้ง */
function blank(board: JXG.Board, bbox: [number, number, number, number]): void {
  const axes = board.defaultAxes as unknown as Record<string, JXG.Axis | undefined>;
  for (const ax of [axes.x, axes.y]) {
    ax?.defaultTicks?.setAttribute({ visible: false });
    ax?.setAttribute({ visible: false });
  }
  board.setBoundingBox(bbox, true);
}

/* เครื่องมือวาดที่ใช้ร่วมกัน show คือฟังก์ชันบอกว่าตอนนี้ถึงขั้นที่ของชิ้นนั้นแล้วหรือยัง */
function kit(board: JXG.Board, c: Colors) {
  const base = { fixed: true, highlight: false };
  return {
    /* ส่วนโค้งของวงกลมจุดศูนย์กลาง center รัศมี r จากมุม from ไปมุม to (เรเดียน ทวนเข็มนาฬิกา) */
    arc(center: Get<XY>, r: Get<number>, from: Get<number>, to: Get<number>, show: Get<boolean>): void {
      const at = (t: number): number => from() + t * (to() - from());
      board.create("curve", [
        (t: number) => center()[0] + r() * Math.cos(at(t)),
        (t: number) => center()[1] + r() * Math.sin(at(t)),
        0, 1,
      ], { ...base, strokeColor: c.teal, strokeWidth: 2, visible: show });
    },
    seg(p: Get<XY>, q: Get<XY>, show: Get<boolean>, color: string, width = 2.5, dash = 0): void {
      board.create("segment", [[() => p()[0], () => p()[1]], [() => q()[0], () => q()[1]]], {
        ...base, strokeColor: color, strokeWidth: width, dash, visible: show,
      });
    },
    /* เส้นตรงยาวตลอดกราฟ หรือรังสีเมื่อ ray เป็น true */
    line(p: Get<XY>, q: Get<XY>, show: Get<boolean>, color: string, ray = false): void {
      board.create("line", [[() => p()[0], () => p()[1]], [() => q()[0], () => q()[1]]], {
        ...base, strokeColor: color, strokeWidth: 2.5, straightFirst: !ray, visible: show,
      });
    },
    dot(p: Get<XY>, name: string, show: Get<boolean>, offset: [number, number] = [8, 10]): void {
      board.create("point", [() => p()[0], () => p()[1]], {
        ...base, size: 3.5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 1.5, visible: show,
        name, withLabel: name !== "",
        label: { offset, fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
      });
    },
    /* จุดที่นักเรียนลากได้ ค่าพิกัดเก็บใน state ด้วยชื่อ kx ky */
    handle(s: State, kx: string, ky: string, name: string, changed: () => void, clamp?: (p: XY) => XY): JXG.Point {
      const p = board.create("point", [s[kx] ?? 0, s[ky] ?? 0], {
        name, size: 6, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
        label: { offset: [10, 12], fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
      }) as JXG.Point;
      p.on("drag", () => {
        let xy: XY = [p.X(), p.Y()];
        if (clamp) {
          const fixedXY = clamp(xy);
          if (fixedXY[0] !== xy[0] || fixedXY[1] !== xy[1]) p.moveTo(fixedXY);
          xy = fixedXY;
        }
        s[kx] = Math.round(xy[0] * 100) / 100;
        s[ky] = Math.round(xy[1] * 100) / 100;
        changed();
      });
      return p;
    },
    /* เครื่องหมายมุมฉากที่จุด at แขนไปทางเวกเตอร์หนึ่งหน่วย u และ v */
    right(at: Get<XY>, u: Get<XY>, v: Get<XY>, show: Get<boolean>, size = 0.35): void {
      const corner = (): XY => [at()[0] + size * (u()[0] + v()[0]), at()[1] + size * (u()[1] + v()[1])];
      const pu = (): XY => [at()[0] + size * u()[0], at()[1] + size * u()[1]];
      const pv = (): XY => [at()[0] + size * v()[0], at()[1] + size * v()[1]];
      for (const [p, q] of [[pu, corner], [pv, corner]] as const) {
        board.create("segment", [[() => p()[0], () => p()[1]], [() => q()[0], () => q()[1]]], {
          ...base, strokeColor: c.ink, strokeWidth: 1.5, visible: show,
        });
      }
    },
  };
}

function stepSlider(max: number) {
  return { key: "step", label: "ขั้นที่", min: 0, max, step: 1 };
}

const at = (s: State) => (n: number) => (): boolean => (s.step ?? 0) >= n;

/* ---------- แบ่งครึ่งส่วนของเส้นตรง ---------- */

const BISECT_BOX: [number, number, number, number] = [-6, 4.5, 6, -4.5];

/* จุด P Q ที่ส่วนโค้งรัศมี 0.7 AB จาก A และ B ตัดกัน กับจุดกึ่งกลาง M */
function bisectSegment(A: XY, B: XY) {
  const len = dist(A, B);
  const r = 0.7 * len;
  const u: XY = [(B[0] - A[0]) / len, (B[1] - A[1]) / len];
  const n: XY = [-u[1], u[0]];
  const M: XY = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
  const h = Math.sqrt(r * r - (len / 2) ** 2);
  const P: XY = [M[0] + h * n[0], M[1] + h * n[1]];
  const Q: XY = [M[0] - h * n[0], M[1] - h * n[1]];
  return { len, r, u, n, M, P, Q, spread: Math.acos(len / 2 / r) + 0.3 };
}

const BISECT_TEXT = [
  "ส่วนของเส้นตรง AB ที่ต้องการแบ่งครึ่ง ลากจุด A หรือ B ให้เอียงหรือยาวสั้นแบบไหนก็ได้ แล้วเลื่อนแถบไปขั้นที่ 1",
  "กางวงเวียนให้ยาว<strong>เกินครึ่งหนึ่ง</strong>ของ AB ใช้ A เป็นจุดศูนย์กลาง เขียนส่วนโค้งทั้งด้านบนและด้านล่างของ AB",
  "<strong>ไม่เปลี่ยนรัศมี</strong> ใช้ B เป็นจุดศูนย์กลาง เขียนส่วนโค้งตัดส่วนโค้งแรกที่ P และ Q",
  "ลากเส้นตรงผ่าน P และ Q ตัด AB ที่ M",
];

/* ---------- แบ่งครึ่งมุม ---------- */

const ANGLE_B: XY = [0, -2.2];
const ANGLE_R1 = 2;
const ANGLE_R2 = 2.2;

function bisectAngle(deg: number) {
  const t = (deg * Math.PI) / 180;
  const B = ANGLE_B;
  const A: XY = [B[0] + 5 * Math.cos(t), B[1] + 5 * Math.sin(t)];
  const C: XY = [B[0] + 5.5, B[1]];
  const P: XY = [B[0] + ANGLE_R1 * Math.cos(t), B[1] + ANGLE_R1 * Math.sin(t)];
  const Q: XY = [B[0] + ANGLE_R1, B[1]];
  // R อยู่บนเส้นแบ่งครึ่งมุม ห่างจาก P และ Q เท่ากับ ANGLE_R2
  const half = t / 2;
  const along = ANGLE_R1 * Math.cos(half) + Math.sqrt(ANGLE_R2 ** 2 - (ANGLE_R1 * Math.sin(half)) ** 2);
  const R: XY = [B[0] + along * Math.cos(half), B[1] + along * Math.sin(half)];
  const far: XY = [B[0] + 6 * Math.cos(half), B[1] + 6 * Math.sin(half)];
  return { t, A, C, P, Q, R, far };
}

const ANGLE_TEXT = [
  "มุม ABC ที่ต้องการแบ่งครึ่ง เลื่อนแถบขนาดมุมเพื่อเปลี่ยนมุมได้",
  "ใช้ B เป็นจุดศูนย์กลาง รัศมีเท่าไรก็ได้ เขียนส่วนโค้งตัดแขนของมุมที่ P และ Q",
  "ใช้ Q เป็นจุดศูนย์กลาง กางวงเวียนให้ยาวเกินครึ่งหนึ่งของ PQ เขียนส่วนโค้งในมุม",
  "<strong>ไม่เปลี่ยนรัศมี</strong> ใช้ P เป็นจุดศูนย์กลาง เขียนส่วนโค้งตัดส่วนโค้งเมื่อกี้ที่ R",
  "ลากรังสี BR ได้เส้นแบ่งครึ่งมุม",
];

/* ---------- เส้นตั้งฉากจากจุดภายนอก ---------- */

const LINE_Y = -1;

function perpendicular(px: number, py: number) {
  const d = Math.abs(py - LINE_Y);
  const side = py >= LINE_Y ? 1 : -1;
  const r1 = d + 0.8;
  const h = Math.sqrt(r1 * r1 - d * d);
  const A: XY = [px - h, LINE_Y];
  const B: XY = [px + h, LINE_Y];
  const r2 = 1.25 * h;
  const Q: XY = [px, LINE_Y - side * Math.sqrt(r2 * r2 - h * h)];
  const M: XY = [px, LINE_Y];
  return { d, side, r1, r2, A, B, Q, M };
}

const PERP_TEXT = [
  "เส้นตรง ℓ กับจุด P ที่อยู่นอกเส้น ลากจุด P ไปไว้ตรงไหนก็ได้",
  "ใช้ P เป็นจุดศูนย์กลาง เขียนส่วนโค้งตัด ℓ สองจุดที่ A และ B",
  "ใช้ A และ B เป็นจุดศูนย์กลาง <strong>รัศมีเท่ากัน</strong> เขียนส่วนโค้งตัดกันที่ Q อีกฝั่งหนึ่งของ ℓ",
];

/* ---------- รูปสามเหลี่ยมเมื่อรู้ความยาวด้านทั้งสาม ---------- */

function sss(s: State) {
  const c = s.ab ?? 6;
  const b = s.ac ?? 5;
  const a = s.bc ?? 4;
  const A: XY = [-c / 2, -2.5];
  const B: XY = [c / 2, -2.5];
  const x = (c * c + b * b - a * a) / (2 * c);
  const y2 = b * b - x * x;
  const ok = y2 > 1e-9;
  const C: XY = [A[0] + x, A[1] + Math.sqrt(Math.max(y2, 0))];
  return { a, b, c, A, B, C, ok, flat: Math.abs(y2) <= 1e-9 };
}

const SSS_TEXT = [
  "ลากรังสีจาก A แล้วถ่ายความยาว AB ลงบนรังสี ได้จุด B",
  "กางวงเวียนยาวเท่า AC ใช้ A เป็นจุดศูนย์กลาง เขียนส่วนโค้งเหนือ AB",
  "กางวงเวียนยาวเท่า BC ใช้ B เป็นจุดศูนย์กลาง เขียนส่วนโค้งตัดส่วนโค้งแรกที่ C",
  "ลาก AC และ BC ได้รูปสามเหลี่ยม ABC",
];

export const boards: Record<string, BoardDef> = {
  "c2-bisect-segment": {
    bbox: BISECT_BOX,
    initial: { step: 0, ax: -3, ay: -0.5, bx: 3, by: 0.5 },
    sliders: [stepSlider(4)],
    draw(board, s, c, changed) {
      blank(board, BISECT_BOX);
      const k = kit(board, c);
      const show = at(s);
      // จุด A B ห่างกันอย่างน้อย 2 หน่วย และอยู่ในกรอบ ส่วนโค้งจะได้ไม่ล้นกราฟ
      const inside = (p: XY): XY => [Math.max(-4.5, Math.min(4.5, p[0])), Math.max(-2, Math.min(2, p[1]))];
      const pa = k.handle(s, "ax", "ay", "A", changed, inside);
      const pb = k.handle(s, "bx", "by", "B", changed, inside);
      const A = (): XY => [pa.X(), pa.Y()];
      const B = (): XY => [pb.X(), pb.Y()];
      const g = () => bisectSegment(A(), B());
      board.create("segment", [pa, pb], { strokeColor: c.ink, strokeWidth: 3, fixed: true, highlight: false });
      k.arc(A, () => g().r, () => ang(A(), B()) - g().spread, () => ang(A(), B()) + g().spread, show(1));
      k.arc(B, () => g().r, () => ang(B(), A()) - g().spread, () => ang(B(), A()) + g().spread, show(2));
      k.dot(() => g().P, "P", show(2));
      k.dot(() => g().Q, "Q", show(2), [8, -12]);
      k.line(() => g().P, () => g().Q, show(3), c.accent);
      k.dot(() => g().M, "M", show(3), [10, -14]);
      k.right(() => g().M, () => g().u, () => g().n, show(4), 0.3);
    },
    readout(s) {
      const step = s.step ?? 0;
      const g = bisectSegment([s.ax ?? -3, s.ay ?? 0], [s.bx ?? 3, s.by ?? 0]);
      if (g.len < 0.5) return "จุด A กับ B อยู่ชิดกันเกินไป ลากให้ห่างกันอีกหน่อย";
      if (step < 4) return `ขั้นที่ ${step} ${BISECT_TEXT[step] ?? ""}`;
      return `ได้ M เป็นจุดกึ่งกลาง ${m(`AM = ${fmt(g.len / 2)}`)} หน่วย ${m(`MB = ${fmt(g.len / 2)}`)} หน่วย และ PQ ตั้งฉากกับ AB ลองลาก A หรือ B ดู ผลยังเป็นแบบนี้เสมอ`;
    },
  },

  "c2-bisect-angle": {
    bbox: [-6, 6, 6, -3],
    initial: { step: 0, deg: 70 },
    sliders: [stepSlider(4), { key: "deg", label: "ขนาดมุม", min: 30, max: 150, step: 10 }],
    draw(board, s, c) {
      blank(board, [-6, 6, 6, -3]);
      const k = kit(board, c);
      const show = at(s);
      const g = () => bisectAngle(s.deg ?? 70);
      const B = (): XY => ANGLE_B;
      k.seg(B, () => g().A, () => true, c.ink, 3);
      k.seg(B, () => g().C, () => true, c.ink, 3);
      k.dot(B, "B", () => true, [-6, -16]);
      k.dot(() => g().A, "A", () => true, [-16, 10]);
      k.dot(() => g().C, "C", () => true, [4, -14]);
      k.arc(B, () => ANGLE_R1, () => -0.25, () => g().t + 0.25, show(1));
      k.dot(() => g().P, "P", show(1), [-18, 6]);
      k.dot(() => g().Q, "Q", show(1), [4, -14]);
      k.arc(() => g().Q, () => ANGLE_R2, () => ang(g().Q, g().R) - 0.35, () => ang(g().Q, g().R) + 0.35, show(2));
      k.arc(() => g().P, () => ANGLE_R2, () => ang(g().P, g().R) - 0.35, () => ang(g().P, g().R) + 0.35, show(3));
      k.dot(() => g().R, "R", show(3), [8, 8]);
      k.line(B, () => g().far, show(4), c.accent, true);
      // เครื่องหมายมุมครึ่งละสีที่ปลายรังสี ให้เห็นว่ามุมสองข้างเท่ากัน
      board.create("curve", [
        (t: number) => ANGLE_B[0] + 0.8 * Math.cos((t * g().t) / 2),
        (t: number) => ANGLE_B[1] + 0.8 * Math.sin((t * g().t) / 2), 0, 1,
      ], { strokeColor: c.violet, strokeWidth: 3, fixed: true, highlight: false, visible: show(4) });
      board.create("curve", [
        (t: number) => ANGLE_B[0] + 0.95 * Math.cos(((1 + t) * g().t) / 2),
        (t: number) => ANGLE_B[1] + 0.95 * Math.sin(((1 + t) * g().t) / 2), 0, 1,
      ], { strokeColor: c.violet, strokeWidth: 3, fixed: true, highlight: false, visible: show(4) });
    },
    readout(s) {
      const step = s.step ?? 0;
      const deg = s.deg ?? 70;
      if (step < 4) return `ขั้นที่ ${step} ${ANGLE_TEXT[step] ?? ""}  ${m(`∠ABC = ${fmt(deg)}°`)}`;
      return `${ANGLE_TEXT[4]} ${m(`∠ABR = ∠RBC = ${fmt(deg / 2)}°`)} ครึ่งหนึ่งของ ${m(`${fmt(deg)}°`)} พอดี`;
    },
  },

  "c2-perpendicular": {
    bbox: [-6, 4.5, 6, -4.5],
    initial: { step: 0, px: 0.5, py: 2.2 },
    sliders: [stepSlider(3)],
    draw(board, s, c, changed) {
      blank(board, [-6, 4.5, 6, -4.5]);
      const k = kit(board, c);
      const show = at(s);
      board.create("line", [[0, LINE_Y], [1, LINE_Y]], { strokeColor: c.ink, strokeWidth: 3, fixed: true, highlight: false });
      board.create("text", [-5.6, LINE_Y + 0.45, "ℓ"], {
        fontSize: 18, strokeColor: c.ink, fixed: true, highlight: false, cssStyle: LABEL_CSS,
      });
      // ให้ P อยู่เหนือเส้น ℓ ห่าง 0.6 ถึง 4.5 หน่วย ส่วนโค้งจะได้อยู่ในกราฟ
      const keep = (p: XY): XY => [Math.max(-3.5, Math.min(3.5, p[0])), Math.max(LINE_Y + 0.6, Math.min(3.8, p[1]))];
      const pp = k.handle(s, "px", "py", "P", changed, keep);
      const g = () => perpendicular(pp.X(), pp.Y());
      const P = (): XY => [pp.X(), pp.Y()];
      k.arc(P, () => g().r1, () => ang(P(), g().A) - 0.25, () => ang(P(), g().B) + 0.25, show(1));
      k.dot(() => g().A, "A", show(1), [-16, 14]);
      k.dot(() => g().B, "B", show(1), [6, 14]);
      k.arc(() => g().A, () => g().r2, () => ang(g().A, g().Q) - 0.35, () => ang(g().A, g().Q) + 0.35, show(2));
      k.arc(() => g().B, () => g().r2, () => ang(g().B, g().Q) - 0.35, () => ang(g().B, g().Q) + 0.35, show(2));
      k.dot(() => g().Q, "Q", show(2), [8, -12]);
      k.line(P, () => g().Q, show(3), c.accent);
      k.dot(() => g().M, "M", show(3), [8, 14]);
      k.right(() => g().M, () => [1, 0], () => [0, 1], show(3), 0.3);
    },
    readout(s) {
      const step = s.step ?? 0;
      if (step < 3) return `ขั้นที่ ${step} ${PERP_TEXT[step] ?? ""}`;
      const g = perpendicular(s.px ?? 0.5, s.py ?? 2.2);
      return `ลากเส้นตรง PQ ตัด ℓ ที่ M ได้ PQ ตั้งฉากกับ ℓ  ${m(`PM = ${fmt(g.d)}`)} หน่วย สั้นกว่า ${m(`PA = ${fmt(g.r1)}`)} หน่วย`;
    },
  },

  "c2-triangle-sss": {
    bbox: [-8, 6.5, 8, -5.5],
    initial: { step: 0, ab: 6, ac: 5, bc: 4 },
    sliders: [
      stepSlider(3),
      { key: "ab", label: "AB", min: 2, max: 8, step: 0.5 },
      { key: "ac", label: "AC", min: 2, max: 8, step: 0.5 },
      { key: "bc", label: "BC", min: 2, max: 8, step: 0.5 },
    ],
    draw(board, s, c) {
      blank(board, [-8, 6.5, 8, -5.5]);
      const k = kit(board, c);
      const show = at(s);
      const g = () => sss(s);
      const A = (): XY => g().A;
      const B = (): XY => g().B;
      k.seg(A, () => [7.6, -2.5], () => true, c.ink3, 1.5, 2);
      k.seg(A, B, () => true, c.ink, 3);
      k.dot(A, "A", () => true, [-10, -16]);
      k.dot(B, "B", () => true, [0, -16]);
      // ถ้าส่วนโค้งตัดกัน วาดแค่รอบจุด C ถ้าไม่ตัด วาดครึ่งวงกลมด้านบนให้เห็นว่าไม่ถึงกัน
      const around = (from: Get<XY>, wide: [number, number]) => (end: 0 | 1) => (): number => {
        const t = g().ok ? ang(from(), g().C) + (end ? 0.35 : -0.35) : wide[end];
        return t;
      };
      const fromA = around(A, [0, Math.PI]);
      const fromB = around(B, [0, Math.PI]);
      k.arc(A, () => g().b, fromA(0), fromA(1), show(1));
      k.arc(B, () => g().a, fromB(0), fromB(1), show(2));
      k.dot(() => g().C, "C", () => (s.step ?? 0) >= 2 && g().ok, [6, 10]);
      k.seg(A, () => g().C, () => (s.step ?? 0) >= 3 && g().ok, c.accent, 3);
      k.seg(B, () => g().C, () => (s.step ?? 0) >= 3 && g().ok, c.accent, 3);
    },
    readout(s) {
      const step = s.step ?? 0;
      const g = sss(s);
      const sides = `${m(`AB = ${fmt(g.c)}`)} ${m(`AC = ${fmt(g.b)}`)} ${m(`BC = ${fmt(g.a)}`)}`;
      if (step >= 2 && !g.ok) {
        const [p, q, r] = [g.a, g.b, g.c].sort((x, y) => x - y) as [number, number, number];
        const why = g.flat
          ? `${m(`${fmt(p)} + ${fmt(q)} = ${fmt(r)}`)} พอดี ส่วนโค้งแตะกันบนเส้น AB ได้แค่เส้นตรงเส้นเดียว`
          : `${m(`${fmt(p)} + ${fmt(q)}`)} ไม่มากกว่า ${m(fmt(r))} ส่วนโค้งจึงไม่ตัดกัน`;
        return `${sides}<br>${why} สร้างรูปสามเหลี่ยมไม่ได้`;
      }
      return `${sides}<br>ขั้นที่ ${step} ${SSS_TEXT[step] ?? ""}`;
    },
  },
};
