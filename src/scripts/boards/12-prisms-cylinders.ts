/* กราฟของบทที่ 12 ปริซึมและทรงกระบอก
   รูปคลี่ของปริซึมที่พับขึ้นเป็นรูปทรงได้ วาดเองด้วยการฉายแบบขนานลงบนกระดานสองมิติ ไม่มีแกน
   พิกัดสามมิติ แกน x ชี้ไปทางขวา แกน y ชี้ลึกเข้าไปข้างหลัง แกน z ชี้ขึ้น
   ฐานล่างวางอยู่บนพื้น z = 0 ตลอด หน้าข้างแต่ละหน้าหมุนรอบขอบของฐานล่าง
   ฐานบนติดอยู่กับขอบบนของหน้าข้างด้านหน้า และหมุนรอบขอบนั้นอีกทีหนึ่ง */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type V3 = [number, number, number];
type P2 = [number, number];

const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const mean = (ps: V3[]): V3 => mul(ps.reduce(add, [0, 0, 0]), 1 / ps.length);

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100).replace("-", "−");
}

/* ผสมสีสองสีแบบ #rrggbb ได้สีทึบ ถ้าอ่านสีไม่ออกคืนสีแรก */
function mix(a: string, b: string, t: number): string {
  const rgb = (s: string): number[] | null => {
    const m = /^#([0-9a-f]{6})$/i.exec(s.trim());
    if (!m) return null;
    const n = parseInt(m[1] ?? "0", 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const x = rgb(a), y = rgb(b);
  if (!x || !y) return a;
  return `rgb(${x.map((v, i) => Math.round(v * t + (y[i] ?? 0) * (1 - t))).join(",")})`;
}

/* ฐานเรียงทวนเข็มนาฬิกาเมื่อมองจากข้างบน ขอบแรกคือขอบด้านหน้า
   ความยาวทุกค่าเป็นหน่วย ใช้คิดพื้นที่ในข้อความใต้รูป */
interface Prism {
  name: string;
  base: [number, number][];
  height: number;
  baseArea: number;
  perimeter: number;
}

const PRISMS: Prism[] = [
  {
    name: "ปริซึมสี่เหลี่ยมมุมฉาก",
    base: [[-1.5, -1], [1.5, -1], [1.5, 1], [-1.5, 1]],
    height: 2,
    baseArea: 6, // 3 × 2
    perimeter: 10, // 3 + 2 + 3 + 2
  },
  {
    name: "ปริซึมสามเหลี่ยม",
    // สามเหลี่ยมหน้าจั่ว ฐาน 3 สูง 2 ด้านเอียงยาว 2.5 จุดศูนย์กลางอยู่ที่จุดกำเนิด
    base: [[-1.5, -2 / 3], [1.5, -2 / 3], [0, 4 / 3]],
    height: 2,
    baseArea: 3, // ½ × 3 × 2
    perimeter: 8, // 3 + 2.5 + 2.5
  },
];

/* มุมกล้อง หันไปทางขวา 20 องศา ก้มลง 35 องศา */
const TURN = (20 * Math.PI) / 180;
const TILT = (35 * Math.PI) / 180;
const R: V3 = [Math.cos(TURN), Math.sin(TURN), 0]; // ทิศขวาของจอ
const U: V3 = [-Math.sin(TURN) * Math.sin(TILT), Math.cos(TURN) * Math.sin(TILT), Math.cos(TILT)]; // ทิศขึ้นของจอ
const D: V3 = [-Math.sin(TURN) * Math.cos(TILT), Math.cos(TURN) * Math.cos(TILT), -Math.sin(TILT)]; // ทิศที่สายตามองเข้าไป
const P = (v: V3): P2 => [dot(v, R), dot(v, U)];

/* ทุกมุมพับ รูปอยู่ในช่วง x จาก −3.7 ถึง 3.7 และ y จาก −3 ถึง 2.9 เผื่อขอบแล้วใช้กรอบ 4 ต่อ 3
   กระดานจอกว้างจะขยายด้านข้างออก ไม่ตัดรูป */
const BOX: [number, number, number, number] = [-4.4, 3.2, 4.4, -3.4];

interface Face {
  pts: V3[];
  kind: "base" | "side" | "top";
}

/* ทุกหน้าของรูปคลี่ เมื่อพับไป deg องศา 0 คือคลี่แบนบนพื้น 90 คือพับเป็นรูปทรงสมบูรณ์ */
function faces(prism: Prism, deg: number): Face[] {
  const th = (deg * Math.PI) / 180;
  const H = prism.height;
  const B: V3[] = prism.base.map(([x, y]): V3 => [x, y, 0]);
  const n = B.length;
  const out: Face[] = [{ pts: B, kind: "base" }];
  let hinge: V3[] = [];
  let outward0: V3 = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const a = B[i] as V3, b = B[(i + 1) % n] as V3;
    const e = sub(b, a);
    const len = Math.hypot(e[0], e[1]);
    const out2: V3 = [e[1] / len, -e[0] / len, 0]; // ตั้งฉากกับขอบ ชี้ออกนอกฐาน
    const w: V3 = [out2[0] * Math.cos(th), out2[1] * Math.cos(th), Math.sin(th)];
    const face = [a, b, add(b, mul(w, H)), add(a, mul(w, H))];
    out.push({ pts: face, kind: "side" });
    if (i === 0) {
      hinge = [face[3] as V3, face[2] as V3];
      outward0 = out2;
    }
  }
  // ฐานบน แต่ละจุดของฐานล่างวัดระยะตามแนวขอบหน้า s และระยะเข้าไปในฐาน d แล้ววางใหม่จากขอบบนของหน้าข้างด้านหน้า
  // ฐานบนหมุนเพิ่มจากหน้าข้างอีก th จึงทำมุม 2th กับพื้น พอ th = 90 องศา ฐานบนจะวางราบทับฐานล่างพอดี
  const a0 = B[0] as V3;
  const e0 = sub(B[1] as V3, a0);
  const len0 = Math.hypot(e0[0], e0[1]);
  const along: V3 = [e0[0] / len0, e0[1] / len0, 0];
  const u: V3 = [outward0[0] * Math.cos(2 * th), outward0[1] * Math.cos(2 * th), Math.sin(2 * th)];
  const start = hinge[0] as V3;
  const top = B.map((v) => {
    const s = dot(sub(v, a0), along);
    const d = -dot(sub(v, a0), outward0);
    return add(start, add(mul(along, s), mul(u, d)));
  });
  out.push({ pts: top, kind: "top" });
  // วาดหน้าที่อยู่ไกลก่อน หน้าที่ใกล้จะทับ
  const depth = (f: Face): number => dot(mean(f.pts), D);
  return out.sort((x, y) => depth(y) - depth(x));
}

/* เส้นโค้งที่คำนวณจุดใหม่ทุกครั้งที่กราฟอัปเดต */
function path(board: JXG.Board, data: () => [number[], number[]], attrs: object): JXG.Curve {
  const cv = board.create("curve", [[0], [0]], { highlight: false, fixed: true, ...attrs });
  cv.updateDataArray = function () {
    const [xs, ys] = data();
    this.dataX = xs;
    this.dataY = ys;
  };
  return cv;
}

function closed(ps: V3[]): [number[], number[]] {
  if (!ps.length) return [[], []];
  const all = [...ps, ps[0] as V3].map(P);
  return [all.map((p) => p[0]), all.map((p) => p[1])];
}

function tint(c: Colors, kind: Face["kind"]): string {
  if (kind === "base") return mix(c.teal, c.paper, 0.35);
  if (kind === "top") return mix(c.violet, c.paper, 0.35);
  return mix(c.accent, c.paper, 0.3);
}

const pick = (s: Record<string, number>): Prism => PRISMS[(s.tri ?? 0) > 0 ? 1 : 0] as Prism;

export const boards: Record<string, BoardDef> = {
  /* รูปคลี่ที่พับเป็นปริซึม เลือกฐานสี่เหลี่ยมหรือสามเหลี่ยมได้ */
  "c12-net": {
    bbox: BOX,
    axis: false,
    initial: { fold: 20, tri: 0 },
    sliders: [
      { key: "fold", label: "มุมที่พับ (องศา)", min: 0, max: 90, step: 5 },
      { key: "tri", label: "ฐานสามเหลี่ยม", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      board.setBoundingBox(BOX, true);
      // คำนวณใหม่เฉพาะเมื่อค่าเปลี่ยน ทุกเส้นใช้ผลเดียวกัน
      let key = "";
      let cache: Face[] = [];
      const get = (): Face[] => {
        const k = `${s.fold}|${s.tri}`;
        if (k !== key) {
          key = k;
          cache = faces(pick(s), s.fold ?? 0);
        }
        return cache;
      };
      // ปริซึมสี่เหลี่ยมมี 6 หน้า สามเหลี่ยมมี 5 หน้า เตรียมเส้นไว้ 6 เส้น เส้นที่ i วาดหน้าที่ i ตามลำดับไกลไปใกล้
      for (let i = 0; i < 6; i++) {
        path(board, () => {
          const f = get()[i];
          return f ? closed(f.pts) : [[], []];
        }, {
          strokeColor: c.ink, strokeWidth: 1.8, fillOpacity: 0.92,
          fillColor: () => tint(c, get()[i]?.kind ?? "side"),
        });
      }
      // ป้ายชื่อฐาน แสดงเฉพาะตอนที่ยังคลี่อยู่เกือบแบน พับมากแล้วป้ายจะลอยทับหน้าอื่น
      for (const kind of ["base", "top"] as const) {
        const at = (): P2 => {
          const f = get().find((x) => x.kind === kind);
          return f ? P(mean(f.pts)) : [0, 0];
        };
        board.create("text", [() => at()[0], () => at()[1], () => ((s.fold ?? 0) <= 30 ? "ฐาน" : "")], {
          anchorX: "middle", anchorY: "middle", fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false,
        });
      }
    },
    readout(s) {
      const p = pick(s);
      const deg = s.fold ?? 0;
      const sides = p.base.length;
      const lateral = p.perimeter * p.height;
      const total = 2 * p.baseArea + lateral;
      const state = deg >= 90
        ? `พับครบแล้ว ได้${p.name}`
        : deg <= 0
          ? `รูปคลี่ของ${p.name} มีฐาน 2 หน้า กับหน้าข้าง ${sides} หน้า`
          : `กำลังพับ หน้าข้าง ${sides} หน้ายกขึ้นรอบฐาน`;
      return `${state}<br>พื้นที่ผิว <span class="m">= 2 × ${fmt(p.baseArea)} + ${fmt(p.perimeter)} × ${fmt(p.height)} = ${fmt(total)}</span> ตารางหน่วย เท่าเดิมทุกมุมที่พับ`;
    },
  },
};
