/* กราฟของบทที่ 5 รูปเรขาคณิตสองมิติและสามมิติ
   รูปสามมิติวาดเองด้วยการฉายแบบขนานลงบนกระดานสองมิติ แล้วเอาแกนออก ไม่ใช้ view3d ของ JSXGraph
   พิกัดสามมิติ แกน x ชี้ไปทางขวา แกน y ชี้ลึกเข้าไปข้างหลัง แกน z ชี้ขึ้น
   turn คือมุมที่เดินวนรอบรูป 0 คือยืนอยู่ด้านหน้า 90 คือยืนอยู่ทางขวา
   tilt คือมุมก้ม 0 คือมองระดับสายตา 90 คือมองลงมาตรงๆ */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type V3 = [number, number, number];
type Box = [number, number, number, number];

const EPS = 1e-9;

const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const size = (a: V3): number => Math.sqrt(dot(a, a));
const unit = (a: V3): V3 => mul(a, 1 / size(a));
const mean = (ps: V3[]): V3 => mul(ps.reduce(add, [0, 0, 0]), 1 / ps.length);
const at = <T>(xs: T[], i: number): T => xs[((i % xs.length) + xs.length) % xs.length] as T;

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100).replace("-", "−");
}

interface Camera {
  r: V3; // ทิศขวาของจอ
  u: V3; // ทิศขึ้นของจอ
  d: V3; // ทิศที่สายตามองเข้าไป
}

function camera(turnDeg: number, tiltDeg: number): Camera {
  const t = (turnDeg * Math.PI) / 180;
  const p = (tiltDeg * Math.PI) / 180;
  const st = Math.sin(t), ct = Math.cos(t), sp = Math.sin(p), cp = Math.cos(p);
  return { r: [ct, st, 0], u: [-st * sp, ct * sp, cp], d: [-st * cp, ct * cp, -sp] };
}

/* หน้าที่หันเข้าหาคนดู ใช้ค่าเผื่อเล็กน้อย หน้าที่หันข้างพอดีจะได้ไม่ถูกวาด */
const facing = (n: V3, cam: Camera): boolean => dot(n, cam.d) < -EPS;

/* ผสมสีสองสีแบบ #rrggbb ได้สีทึบ ใช้ระบายหน้าลูกบาศก์ที่ต้องบังกัน */
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

/* กระดานที่ไม่มีแกน และหนึ่งหน่วยในแนวนอนยาวเท่าแนวตั้ง รูปจะไม่เบี้ยว */
function plain(board: JXG.Board, box: Box): void {
  // ชนิดข้อมูลของ JSXGraph บอกว่า defaultAxes เป็นค่าตั้งของแกน แต่ของจริงคือตัวแกน
  const axes = board.defaultAxes as unknown as Record<string, JXG.GeometryElement | undefined>;
  for (const ax of [axes.x, axes.y]) if (ax) board.removeObject(ax);
  board.setBoundingBox(box, true);
}

/* เส้นโค้งที่คำนวณจุดใหม่ทุกครั้งที่กราฟอัปเดต ค่า NaN คั่นระหว่างเส้นย่อย */
function path(board: JXG.Board, data: () => [number[], number[]], attrs: object): JXG.Curve {
  const cv = board.create("curve", [[0], [0]], { highlight: false, fixed: true, ...attrs });
  cv.updateDataArray = function () {
    const [xs, ys] = data();
    this.dataX = xs;
    this.dataY = ys;
  };
  return cv;
}

type P2 = [number, number];

function joinSegments(segs: [P2, P2][]): [number[], number[]] {
  const xs: number[] = [], ys: number[] = [];
  for (const [a, b] of segs) xs.push(a[0], b[0], Number.NaN), ys.push(a[1], b[1], Number.NaN);
  return [xs, ys];
}

function closed(ps: P2[]): [number[], number[]] {
  if (!ps.length) return [[], []];
  const all = [...ps, ps[0] as P2];
  return [all.map((p) => p[0]), all.map((p) => p[1])];
}

/* ---------- รูปทรงสำหรับกราฟหน้าตัด ---------- */

interface Face {
  idx: number[];
  flat: boolean; // false คือชิ้นย่อยของผิวโค้ง ขอบระหว่างชิ้นย่อยไม่ต้องวาด
}

interface Solid {
  name: string;
  verts: V3[];
  faces: Face[];
  curved: boolean;
}

function prismOf(name: string, base: [number, number][], curved: boolean): Solid {
  const n = base.length;
  const verts: V3[] = [...base.map(([x, y]): V3 => [x, y, -1]), ...base.map(([x, y]): V3 => [x, y, 1])];
  const faces: Face[] = [
    { idx: base.map((_, i) => i), flat: true },
    { idx: base.map((_, i) => n + i), flat: true },
  ];
  for (let i = 0; i < n; i++) faces.push({ idx: [i, (i + 1) % n, n + ((i + 1) % n), n + i], flat: !curved });
  return { name, verts, faces, curved };
}

function pyramidOf(name: string, base: [number, number][], curved: boolean): Solid {
  const n = base.length;
  const verts: V3[] = [...base.map(([x, y]): V3 => [x, y, -1]), [0, 0, 1]];
  const faces: Face[] = [{ idx: base.map((_, i) => i), flat: true }];
  for (let i = 0; i < n; i++) faces.push({ idx: [i, (i + 1) % n, n], flat: !curved });
  return { name, verts, faces, curved };
}

const ring = (n: number): [number, number][] =>
  Array.from({ length: n }, (_, k): [number, number] => [Math.cos((2 * Math.PI * k) / n), Math.sin((2 * Math.PI * k) / n)]);
const SQUARE: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
const TRIANGLE: [number, number][] = [[-1.1, -1.1 / Math.sqrt(3)], [1.1, -1.1 / Math.sqrt(3)], [0, 2.2 / Math.sqrt(3)]];

const SOLIDS: Solid[] = [
  prismOf("ลูกบาศก์", SQUARE, false),
  pyramidOf("พีระมิดฐานสี่เหลี่ยมจัตุรัส", SQUARE, false),
  prismOf("ปริซึมสามเหลี่ยม", TRIANGLE, false),
  prismOf("ทรงกระบอก", ring(48), true),
  pyramidOf("กรวย", ring(48), true),
];

interface Edge {
  a: number;
  b: number;
  f: [number, number];
  smooth: boolean;
}

interface Model {
  solid: Solid;
  normals: V3[]; // เวกเตอร์ตั้งฉากของแต่ละหน้า ชี้ออกนอกรูป
  offsets: number[];
  edges: Edge[];
}

function model(solid: Solid): Model {
  const center = mean(solid.verts);
  const v = (i: number): V3 => solid.verts[i] as V3;
  const normals = solid.faces.map((f) => {
    let n: V3 = [0, 0, 0];
    f.idx.forEach((i, k) => {
      n = add(n, cross(v(i), v(at(f.idx, k + 1))));
    });
    n = unit(n);
    return dot(n, sub(mean(f.idx.map(v)), center)) < 0 ? mul(n, -1) : n;
  });
  const offsets = solid.faces.map((f, i) => dot(normals[i] as V3, v(f.idx[0] ?? 0)));
  const byKey = new Map<string, number[]>();
  solid.faces.forEach((f, fi) => {
    f.idx.forEach((i, k) => {
      const j = at(f.idx, k + 1);
      const key = `${Math.min(i, j)}-${Math.max(i, j)}`;
      byKey.set(key, [...(byKey.get(key) ?? []), fi]);
    });
  });
  const edges: Edge[] = [];
  for (const [key, fs] of byKey) {
    const [a = 0, b = 0] = key.split("-").map(Number);
    const f: [number, number] = [fs[0] ?? 0, fs[1] ?? fs[0] ?? 0];
    const smooth = !(solid.faces[f[0]]?.flat ?? true) && !(solid.faces[f[1]]?.flat ?? true);
    edges.push({ a, b, f, smooth });
  }
  return { solid, normals, offsets, edges };
}

const MODELS = SOLIDS.map(model);

/* แนวของระนาบตัด เก็บเป็นเวกเตอร์ตั้งฉากกับระนาบ */
const PLANES: { n: V3; name: string }[] = [
  { n: [0, 0, 1], name: "ที่ขนานกับฐาน" },
  { n: [0, 1, 0], name: "ที่ตั้งฉากกับฐาน" },
  { n: [0, 0.5, Math.sqrt(3) / 2], name: "ที่เอียงเล็กน้อย" },
  { n: unit([-1, 1, 2]), name: "ที่เอียงเฉียงเข้าหามุม แบบชันน้อย" },
  { n: unit([-1, 1, 1]), name: "ที่เอียงเฉียงเข้าหามุม แบบชันมาก" },
];

/* จุดที่ระนาบ n·p = dist ตัดขอบของรูป เรียงวนรอบเป็นรูปหลายเหลี่ยม */
function section(m: Model, n: V3, dist: number): V3[] {
  const raw: V3[] = [];
  for (const e of m.edges) {
    const A = m.solid.verts[e.a] as V3, B = m.solid.verts[e.b] as V3;
    const sa = dot(n, A) - dist, sb = dot(n, B) - dist;
    if (Math.abs(sa) < EPS) raw.push(A);
    if (Math.abs(sb) < EPS) raw.push(B);
    if ((sa < -EPS && sb > EPS) || (sa > EPS && sb < -EPS)) raw.push(add(A, mul(sub(B, A), sa / (sa - sb))));
  }
  const pts: V3[] = [];
  for (const p of raw) if (!pts.some((q) => size(sub(p, q)) < 1e-7)) pts.push(p);
  if (pts.length < 3) return [];
  const c = mean(pts);
  const e1 = unit(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
  const e2 = cross(n, e1);
  pts.sort((p, q) => {
    const ap = Math.atan2(dot(sub(p, c), e2), dot(sub(p, c), e1));
    const aq = Math.atan2(dot(sub(q, c), e2), dot(sub(q, c), e1));
    return ap - aq;
  });
  // ตัดจุดที่อยู่กลางด้านตรงออก จะได้นับจำนวนด้านถูก
  return pts.filter((p, i) => size(cross(sub(p, at(pts, i - 1)), sub(at(pts, i + 1), p))) > 1e-9);
}

/* ชื่อของรูปหลายเหลี่ยมจากความยาวด้านและมุม */
function polygonName(p: V3[]): string {
  const n = p.length;
  const side = (i: number): V3 => sub(at(p, i + 1), at(p, i));
  const L = p.map((_, i) => size(side(i)));
  const L0 = L[0] ?? 1;
  const same = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6 * Math.max(1, a, b);
  const allEqual = L.every((l) => same(l, L0));
  const cosAt = (i: number): number => dot(unit(side(i)), unit(side(i + 1)));
  const right = (i: number): boolean => Math.abs(cosAt(i)) < 1e-6;
  const parallel = (i: number, j: number): boolean => size(cross(unit(side(i)), unit(side(j)))) < 1e-6;
  if (n === 3) {
    if (allEqual) return "รูปสามเหลี่ยมด้านเท่า";
    if (same(L[0] ?? 0, L[1] ?? 0) || same(L[1] ?? 0, L[2] ?? 0) || same(L[0] ?? 0, L[2] ?? 0)) return "รูปสามเหลี่ยมหน้าจั่ว";
    if ([0, 1, 2].some(right)) return "รูปสามเหลี่ยมมุมฉาก";
    return "รูปสามเหลี่ยม";
  }
  if (n === 4) {
    if ([0, 1, 2, 3].every(right)) return allEqual ? "รูปสี่เหลี่ยมจัตุรัส" : "รูปสี่เหลี่ยมผืนผ้า";
    if (parallel(0, 2) && parallel(1, 3)) return allEqual ? "รูปสี่เหลี่ยมขนมเปียกปูน" : "รูปสี่เหลี่ยมด้านขนาน";
    if (parallel(0, 2) || parallel(1, 3)) return "รูปสี่เหลี่ยมคางหมู";
    return "รูปสี่เหลี่ยม";
  }
  if (n === 5) return "รูปห้าเหลี่ยม";
  if (n === 6) {
    const c0 = cosAt(0);
    return allEqual && p.every((_, i) => same(cosAt(i), c0)) ? "รูปหกเหลี่ยมด้านเท่ามุมเท่า" : "รูปหกเหลี่ยม";
  }
  return `รูป ${n} เหลี่ยม`;
}

/* หน้าตัดของทรงกระบอกกับกรวยมีด้านตรงเมื่อระนาบตัดผ่านฐานเป็นเส้นยาว ไม่ใช่แค่แตะที่จุดเดียว */
function hasStraightSide(m: Model, pts: V3[]): boolean {
  return m.solid.faces.some((f, fi) => {
    if (!f.flat) return false;
    const on = pts.filter((p) => Math.abs(dot(m.normals[fi] as V3, p) - (m.offsets[fi] ?? 0)) < 1e-7);
    return on.some((p) => on.some((q) => size(sub(p, q)) > 1e-6));
  });
}

function sectionName(shape: number, plane: number, dist: number, m: Model, pts: V3[]): string {
  if (!m.solid.curved) return polygonName(pts);
  const cylinder = shape === 3;
  if (plane === 0) return cylinder ? "รูปวงกลมที่เท่ากับฐาน" : "รูปวงกลมที่เล็กกว่าฐาน";
  if (plane === 1) {
    if (cylinder) return "รูปสี่เหลี่ยมผืนผ้า";
    return Math.abs(dist) < EPS ? "รูปสามเหลี่ยมหน้าจั่ว" : "รูปที่มีด้านล่างเป็นเส้นตรง แต่ด้านบนเป็นเส้นโค้ง";
  }
  return hasStraightSide(m, pts) ? "รูปที่มีทั้งด้านตรงและด้านโค้ง" : "รูปวงรี";
}

interface Cut {
  hidden: [P2, P2][];
  shown: [P2, P2][];
  sheet: P2[];
  slice: P2[];
  name: string;
}

function cut(s: Record<string, number>): Cut {
  const shape = Math.round(s.shape ?? 0), plane = Math.round(s.dir ?? 0);
  const m = MODELS[shape] ?? (MODELS[0] as Model);
  const n = (PLANES[plane] ?? (PLANES[0] as { n: V3 })).n;
  const cam = camera(s.turn ?? 25, 22);
  const P = (v: V3): P2 => [dot(v, cam.r), dot(v, cam.u)];
  const vals = m.solid.verts.map((v) => dot(n, v));
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const dist = lo + (s.pos ?? 0.5) * (hi - lo);

  const seen = m.normals.map((nv) => facing(nv, cam));
  const hidden: [P2, P2][] = [], shown: [P2, P2][] = [];
  for (const e of m.edges) {
    const a = seen[e.f[0]] ?? false, b = seen[e.f[1]] ?? false;
    const seg: [P2, P2] = [P(m.solid.verts[e.a] as V3), P(m.solid.verts[e.b] as V3)];
    if (e.smooth) {
      if (a !== b) shown.push(seg); // เส้นขอบของผิวโค้งที่เห็นจากมุมนี้
    } else if (a || b) shown.push(seg);
    else hidden.push(seg);
  }

  const pts = section(m, n, dist);
  const c = pts.length ? mean(pts) : mul(n, dist);
  const e1 = unit(cross(n, Math.abs(n[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]));
  const e2 = cross(n, e1);
  const r = 1.6;
  const sheet = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([i = 0, j = 0]) => P(add(c, add(mul(e1, i * r), mul(e2, j * r)))));
  return { hidden, shown, sheet, slice: pts.map(P), name: pts.length ? sectionName(shape, plane, dist, m, pts) : "" };
}

/* ---------- รูปที่ประกอบจากลูกบาศก์ ---------- */

/* หกหน้าของลูกบาศก์หนึ่งหน่วย แต่ละหน้ามีทิศที่หันออก และมุมทั้งสี่ */
const CUBE_FACES: { n: V3; q: V3[] }[] = [
  { n: [0, -1, 0], q: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]] },
  { n: [0, 1, 0], q: [[1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]] },
  { n: [-1, 0, 0], q: [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]] },
  { n: [1, 0, 0], q: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]] },
  { n: [0, 0, -1], q: [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]] },
  { n: [0, 0, 1], q: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] },
];

interface Tile {
  pts: P2[];
  kind: "front" | "side" | "top";
}

/* heights[แถว][หลัก] แถวแรกคือแถวหลังสุด แถวสุดท้ายคือแถวหน้าสุด หลักแรกอยู่ซ้ายสุด
   คืนหน้าของลูกบาศก์ที่มองเห็น เรียงลูกบาศก์จากไกลไปใกล้ตามระยะของจุดศูนย์กลาง วาดตามลำดับนี้ลูกที่ใกล้กว่าจะบังลูกที่ไกลกว่า
   ลูกบาศก์ขนาดเท่ากันที่วางบนตารางจุดเต็ม ถ้าลูกหนึ่งบังอีกลูก จุดศูนย์กลางของลูกที่บังต้องใกล้กว่าเสมอ
   (ถ้าเรียงทีละหน้าตามจุดกึ่งกลางหน้า จะผิดในบางมุม) */
function tiles(heights: number[][], cam: Camera, shift: P2, tall = Math.max(1, ...heights.flat())): Tile[] {
  const rows = heights.length, cols = heights[0]?.length ?? 0;
  const filled = new Set<string>();
  const cubes: V3[] = [];
  heights.forEach((row, r) => {
    row.forEach((h, col) => {
      for (let z = 0; z < h; z++) {
        const y = rows - 1 - r;
        cubes.push([col, y, z]);
        filled.add(`${col},${y},${z}`);
      }
    });
  });
  const center: V3 = [cols / 2, rows / 2, tall / 2];
  const depth = (cube: V3): number => dot(add(cube, [0.5, 0.5, 0.5]), cam.d);
  const out: Tile[] = [];
  for (const cube of [...cubes].sort((a, b) => depth(b) - depth(a))) {
    for (const f of CUBE_FACES) {
      if (filled.has(add(cube, f.n).join(","))) continue;
      if (!facing(f.n, cam)) continue;
      const corners = f.q.map((q) => sub(add(cube, q), center));
      const kind = f.n[2] !== 0 ? "top" : f.n[1] !== 0 ? "front" : "side";
      out.push({ pts: corners.map((p): P2 => [dot(p, cam.r) + shift[0], dot(p, cam.u) + shift[1]]), kind });
    }
  }
  return out;
}

function tint(c: Colors, kind: Tile["kind"]): string {
  if (kind === "top") return mix(c.teal, c.paper, 0.35);
  if (kind === "front") return mix(c.accent, c.paper, 0.3);
  return mix(c.violet, c.paper, 0.3);
}

/* วาดหน้าลูกบาศก์ด้วยเส้นโค้งปิดจำนวน pool เส้น เส้นที่ i แสดงหน้าที่ i ในลำดับไกลไปใกล้ */
function drawTiles(board: JXG.Board, c: Colors, pool: number, get: () => Tile[]): void {
  for (let i = 0; i < pool; i++) {
    path(board, () => {
      const t = get()[i];
      return t ? closed(t.pts) : [[], []];
    }, {
      strokeColor: c.ink, strokeWidth: 1.6, fillOpacity: 1,
      fillColor: () => tint(c, get()[i]?.kind ?? "top"),
    });
  }
}

/* เก็บผลคำนวณไว้ คำนวณใหม่เฉพาะเมื่อค่าใน state เปลี่ยน */
function cached<T>(s: Record<string, number>, keys: string[], make: () => T): () => T {
  let last = "";
  let value: T | null = null;
  return () => {
    const key = keys.map((k) => s[k]).join("|");
    if (value === null || key !== last) {
      last = key;
      value = make();
    }
    return value;
  };
}

/* รูปตัวอย่างในหน้า 5.3 แถวหลังสูง 2 2 1 แถวหน้าสูง 1 0 1 */
const VIEW_SHAPE = [
  [2, 2, 1],
  [1, 0, 1],
];

const STACK_KEYS = ["bl", "br", "fl", "fr"];

function stackHeights(s: Record<string, number>): number[][] {
  return [
    [s.bl ?? 0, s.br ?? 0],
    [s.fl ?? 0, s.fr ?? 0],
  ];
}

export const boards: Record<string, BoardDef> = {
  /* ตัดรูปสามมิติด้วยระนาบ เลือกรูป เลือกแนว เลื่อนตำแหน่ง แล้วหมุนดู */
  "c5-cross-section": {
    bbox: [-2.6, 2.3, 2.6, -2.3],
    initial: { shape: 0, dir: 0, pos: 0.5, turn: 25 },
    sliders: [
      { key: "shape", label: "รูปทรง", min: 0, max: 4, step: 1 },
      { key: "dir", label: "แนวระนาบ", min: 0, max: 4, step: 1 },
      { key: "pos", label: "เลื่อนระนาบ", min: 0.05, max: 0.95, step: 0.05 },
      { key: "turn", label: "หมุนดู", min: -180, max: 180, step: 5 },
    ],
    draw(board, s, c) {
      plain(board, [-2.6, 2.3, 2.6, -2.3]);
      const g = cached(s, ["shape", "dir", "pos", "turn"], () => cut(s));
      path(board, () => joinSegments(g().hidden), { strokeColor: c.ink3, strokeWidth: 1.5, dash: 2 });
      path(board, () => closed(g().sheet), {
        strokeColor: c.teal, strokeWidth: 1.2, fillColor: c.teal, fillOpacity: 0.1,
      });
      path(board, () => closed(g().slice), {
        strokeColor: c.accent, strokeWidth: 2.5, fillColor: c.accent, fillOpacity: 0.45,
      });
      path(board, () => joinSegments(g().shown), { strokeColor: c.ink, strokeWidth: 2.2 });
      board.update();
    },
    readout(s) {
      const g = cut(s);
      const solid = SOLIDS[Math.round(s.shape ?? 0)]?.name ?? "";
      const plane = PLANES[Math.round(s.dir ?? 0)]?.name ?? "";
      return `${solid} ตัดด้วยระนาบ${plane}<br>หน้าตัดเป็น<strong>${g.name}</strong>`;
    },
  },

  /* หมุนรูปที่ประกอบจากลูกบาศก์ ตั้งมุมให้ได้ภาพด้านหน้า ด้านข้าง และด้านบน */
  "c5-views": {
    bbox: [-2.7, 2.4, 2.7, -2.4],
    initial: { turn: 35, tilt: 25 },
    sliders: [
      { key: "turn", label: "เดินวนรอบ", min: -90, max: 90, step: 5 },
      { key: "tilt", label: "มองจากที่สูง", min: 0, max: 90, step: 5 },
    ],
    draw(board, s, c) {
      plain(board, [-2.7, 2.4, 2.7, -2.4]);
      const g = cached(s, ["turn", "tilt"], () => tiles(VIEW_SHAPE, camera(s.turn ?? 35, s.tilt ?? 25), [0, 0]));
      drawTiles(board, c, 30, g);
      // ป้ายบอกด้านหน้ากับด้านขวา วางบนพื้นห่างจากรูปออกมา แล้วเลื่อนลงอีกนิดไม่ให้ทับรูปตอนมองระดับสายตา
      const cam = (): Camera => camera(s.turn ?? 35, s.tilt ?? 25);
      const label = (p: V3, text: string): void => {
        board.create("text", [() => dot(p, cam().r), () => dot(p, cam().u) - 0.35, text], {
          fixed: true, highlight: false, fontSize: 13, strokeColor: c.ink3, anchorX: "middle", anchorY: "middle",
        });
      };
      label([0, -1.75, -1], "ด้านหน้า");
      label([2.3, 0, -1], "ด้านขวา");
      board.update();
    },
    readout(s) {
      const turn = s.turn ?? 35, tilt = s.tilt ?? 25;
      if (tilt === 90) {
        return turn === 0
          ? "มองลงมาตรงๆ เห็นเป็น<strong>ภาพด้านบน</strong> ด้านหน้าของรูปอยู่ขอบล่างของภาพ"
          : `มองลงมาตรงๆ แต่รูปยังหมุนอยู่ <span class="m">${fmt(turn)}</span> องศา เลื่อนเดินวนรอบกลับไปที่ <span class="m">0</span> จะได้ภาพด้านบนที่ด้านหน้าอยู่ข้างล่าง`;
      }
      if (tilt === 0 && turn === 0) return "มองตรงจากด้านหน้าระดับสายตา เห็นเป็น<strong>ภาพด้านหน้า</strong> ด้านบนกับด้านข้างหายไปหมด";
      if (tilt === 0 && turn === 90) return "มองตรงจากทางขวาระดับสายตา เห็นเป็น<strong>ภาพด้านข้าง</strong> แถวหน้าอยู่ทางซ้ายของภาพ";
      if (tilt === 0 && turn === -90) return "มองจากทางซ้าย ได้ภาพที่กลับซ้ายขวากับภาพด้านข้างที่มองจากทางขวา";
      return "ตอนนี้เห็นหลายด้านพร้อมกัน ลองตั้งค่าให้ได้ภาพด้านหน้า ภาพด้านข้าง และภาพด้านบน";
    },
  },

  /* ปรับความสูงของกองลูกบาศก์บนฐาน 2 × 2 แล้วดูภาพสามด้านเปลี่ยนตาม */
  "c5-stack": {
    bbox: [-4.4, 3.2, 4.2, -3.3],
    initial: { bl: 3, br: 1, fl: 1, fr: 2, turn: 30 },
    sliders: [
      { key: "bl", label: "หลังซ้าย", min: 0, max: 3, step: 1 },
      { key: "br", label: "หลังขวา", min: 0, max: 3, step: 1 },
      { key: "fl", label: "หน้าซ้าย", min: 0, max: 3, step: 1 },
      { key: "fr", label: "หน้าขวา", min: 0, max: 3, step: 1 },
      { key: "turn", label: "หมุนดู", min: -90, max: 90, step: 5 },
    ],
    draw(board, s, c) {
      plain(board, [-4.4, 3.2, 4.2, -3.3]);
      const g = cached(s, [...STACK_KEYS, "turn"], () => tiles(stackHeights(s), camera(s.turn ?? 30, 30), [-2.1, -0.2], 3));
      drawTiles(board, c, 36, g);

      // ภาพสามด้านวาดแบบแบน ช่องละ k หน่วย
      const k = 0.5;
      const squares = (cells: P2[], x0: number, y0: number): [number[], number[]] => {
        const xs: number[] = [], ys: number[] = [];
        for (const [i, j] of cells) {
          const [px, py] = closed([[x0 + i * k, y0 + j * k], [x0 + (i + 1) * k, y0 + j * k], [x0 + (i + 1) * k, y0 + (j + 1) * k], [x0 + i * k, y0 + (j + 1) * k]]);
          xs.push(...px, Number.NaN);
          ys.push(...py, Number.NaN);
        }
        return [xs, ys];
      };
      const column = (heights: number[]): P2[] => heights.flatMap((h, i) => Array.from({ length: h }, (_, j): P2 => [i, j]));
      const front = (): number[] => [Math.max(s.bl ?? 0, s.fl ?? 0), Math.max(s.br ?? 0, s.fr ?? 0)];
      const side = (): number[] => [Math.max(s.fl ?? 0, s.fr ?? 0), Math.max(s.bl ?? 0, s.br ?? 0)];
      const top = (): P2[] => {
        const h = stackHeights(s);
        return ([[0, 1], [1, 1], [0, 0], [1, 0]] as P2[]).filter(([i, j]) => (h[1 - j]?.[i] ?? 0) > 0);
      };
      const box = { strokeColor: c.ink, strokeWidth: 1.4, fillOpacity: 1 };
      path(board, () => squares(column(front()), 0.7, 0.3), { ...box, fillColor: tint(c, "front") });
      path(board, () => squares(column(side()), 2.6, 0.3), { ...box, fillColor: tint(c, "side") });
      path(board, () => squares(top(), 0.7, -2.6), { ...box, fillColor: tint(c, "top") });

      const text = { fixed: true, highlight: false, fontSize: 13, strokeColor: c.ink, anchorX: "middle", anchorY: "middle" };
      board.create("text", [1.2, 2.4, "ด้านหน้า"], text);
      board.create("text", [3.1, 2.4, "ด้านข้าง"], text);
      board.create("text", [1.2, -0.95, "ด้านบน"], text);
      // ตัวเลขในภาพด้านบน บอกว่าช่องนั้นซ้อนกันกี่ลูก
      const cells: [number, number, string][] = [[0, 1, "bl"], [1, 1, "br"], [0, 0, "fl"], [1, 0, "fr"]];
      for (const [i, j, key] of cells) {
        board.create("text", [0.7 + (i + 0.5) * k, -2.6 + (j + 0.5) * k, () => ((s[key] ?? 0) > 0 ? String(s[key]) : "")], {
          ...text, fontSize: 14, cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 600",
        });
      }
      board.update();
    },
    readout(s) {
      const total = STACK_KEYS.reduce((sum, key) => sum + (s[key] ?? 0), 0);
      if (total === 0) return "ยังไม่มีลูกบาศก์ เลื่อนแถบความสูงของแต่ละช่อง";
      const f = [Math.max(s.bl ?? 0, s.fl ?? 0), Math.max(s.br ?? 0, s.fr ?? 0)];
      const d = [Math.max(s.fl ?? 0, s.fr ?? 0), Math.max(s.bl ?? 0, s.br ?? 0)];
      return `ใช้ลูกบาศก์ <span class="m">${total}</span> ลูก  ภาพด้านหน้าสูง <span class="m">${f.join(", ")}</span>  ภาพด้านข้างสูง <span class="m">${d.join(", ")}</span>`;
    },
  },
};
