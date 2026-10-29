/* กราฟของบทที่ 20 การแยกตัวประกอบของพหุนามดีกรีสอง
   แผ่นพีชคณิต แผ่นใหญ่คือ x² แผ่นยาวคือ x แผ่นเล็กคือ 1 ถ้าจัดแผ่นทั้งหมดเป็นสี่เหลี่ยมผืนผ้าได้
   ความยาวสองด้านของสี่เหลี่ยมคือตัวประกอบสองตัว ไม่มีแกน พิกัดเริ่มที่มุมบนซ้ายของสี่เหลี่ยม แกน y ชี้ขึ้น */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100).replace("-", "−");
}

type Rect = [number, number, number, number]; // ซ้าย บน ขวา ล่าง

/* เส้นโค้งที่คำนวณจุดใหม่ทุกครั้งที่กราฟอัปเดต สี่เหลี่ยมหลายรูปอยู่ในเส้นเดียว คั่นด้วย NaN ให้ยกปากกา */
function rects(board: JXG.Board, data: () => Rect[], attrs: object): JXG.Curve {
  const cv = board.create("curve", [[0], [0]], { highlight: false, fixed: true, ...attrs });
  cv.updateDataArray = function () {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const [l, t, r, b] of data()) {
      xs.push(l, r, r, l, l, Number.NaN);
      ys.push(t, t, b, b, t, Number.NaN);
    }
    this.dataX = xs;
    this.dataY = ys;
  };
  return cv;
}

/* ---------- แผ่นพีชคณิต x² + bx + c ---------- */

const X = 4.6; // ความยาวของ x ตั้งไม่ให้เป็นจำนวนเต็มเท่าของแผ่นเล็ก จะได้ไม่เข้าใจผิดว่า x มีค่าเท่านั้น
const GAP = 0.2; // ระยะห่างของแผ่นที่ยังวางกองไว้

/* หาจำนวนเต็ม p q ที่ p + q = b และ pq = c ให้ |p| ไม่น้อยกว่า |q| ด้าน p วางตามแนวนอนซึ่งกว้างกว่า */
function pair(b: number, c: number): [number, number] | null {
  let best: [number, number] | null = null;
  for (let p = -30; p <= 30; p++) {
    const q = b - p;
    if (p * q !== c || Math.abs(p) < Math.abs(q)) continue;
    if (!best || p > best[0]) best = [p, q];
  }
  return best;
}

interface Tiles {
  square: Rect[];
  pos: Rect[];
  neg: Rect[];
  fit: [number, number] | null;
}

function layout(b: number, c: number): Tiles {
  const out: Tiles = { square: [[0, 0, X, -X]], pos: [], neg: [], fit: pair(b, c) };
  const put = (sign: number, r: Rect): void => {
    (sign > 0 ? out.pos : out.neg).push(r);
  };
  if (out.fit) {
    // จัดเป็นสี่เหลี่ยมผืนผ้า ด้านบนยาว x + p ด้านซ้ายยาว x + q สีของแต่ละแผ่นเป็นเครื่องหมายของผลคูณ
    const [p, q] = out.fit;
    for (let i = 0; i < Math.abs(p); i++) put(Math.sign(p), [X + i, 0, X + i + 1, -X]);
    for (let j = 0; j < Math.abs(q); j++) put(Math.sign(q), [0, -X - j, X, -X - j - 1]);
    for (let i = 0; i < Math.abs(p); i++) {
      for (let j = 0; j < Math.abs(q); j++) put(Math.sign(p * q), [X + i, -X - j, X + i + 1, -X - j - 1]);
    }
  } else {
    // จัดไม่ได้ วางแผ่นไว้เป็นกอง แผ่น x เรียงทางขวา แผ่นเล็กเรียงข้างล่าง
    for (let i = 0; i < Math.abs(b); i++) {
      const l = X + 0.6 + i * (1 + GAP);
      put(Math.sign(b), [l, 0, l + 1, -X]);
    }
    for (let i = 0; i < Math.abs(c); i++) {
      const l = (i % 8) * (1 + GAP);
      const t = -X - 0.6 - Math.floor(i / 8) * (1 + GAP);
      put(Math.sign(c), [l, t, l + 1, t - 1]);
    }
  }
  return out;
}

const xi = "<i>x</i>";

function poly(b: number, c: number): string {
  let s = `${xi}<sup>2</sup>`;
  if (b !== 0) s += ` ${b > 0 ? "+" : "−"} ${Math.abs(b) === 1 ? "" : fmt(Math.abs(b))}${xi}`;
  if (c !== 0) s += ` ${c > 0 ? "+" : "−"} ${fmt(Math.abs(c))}`;
  return s;
}

function factor(p: number): string {
  return p === 0 ? xi : `(${xi} ${p > 0 ? "+" : "−"} ${fmt(Math.abs(p))})`;
}

function product(p: number, q: number): string {
  if (p === q) return p === 0 ? `${xi} · ${xi}` : `${factor(p)}<sup>2</sup>`;
  if (q === 0) return `${xi}${factor(p)}`;
  return `${factor(p)}${factor(q)}`;
}

/* คู่จำนวนเต็มทั้งหมดที่คูณกันได้ c ใช้บอกว่าทำไมจัดไม่ได้ */
function pairsOf(c: number): [number, number][] {
  const out: [number, number][] = [];
  for (let d = 1; d * d <= Math.abs(c); d++) {
    if (c % d !== 0) continue;
    out.push([d, c / d], [-d, -c / d]);
  }
  return out;
}

const m = (s: string): string => `<span class="m">${s}</span>`;

/* ---------- ผลต่างของกำลังสอง ---------- */

interface Pieces {
  stay: Rect; // ชิ้นบน กว้าง a สูง a − b
  move: [number, number][]; // ชิ้นล่าง กว้าง a − b สูง b หมุนไปต่อทางขวา
  hole: Rect; // มุมที่ตัดออก b × b
}

function pieces(a: number, b: number, t: number): Pieces {
  const w = a - b;
  const h = b;
  const c0: [number, number] = [w / 2, -a + b / 2];
  const c1: [number, number] = [a + b / 2, -w / 2];
  const cx = c0[0] + (c1[0] - c0[0]) * t;
  const cy = c0[1] + (c1[1] - c0[1]) * t;
  const th = (t * Math.PI) / 2;
  const co = Math.cos(th);
  const si = Math.sin(th);
  const move = ([[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]] as const).map(([sx, sy]): [number, number] => {
    const u = (sx * w) / 2;
    const v = (sy * h) / 2;
    return [cx + u * co - v * si, cy + u * si + v * co];
  });
  return { stay: [0, 0, a, -w], move, hole: [w, -w, a, -a] };
}

export const boards: Record<string, BoardDef> = {
  /* เลื่อน b กับ c ของ x² + bx + c แล้วดูว่าแผ่นทั้งหมดจัดเป็นสี่เหลี่ยมผืนผ้าได้ไหม */
  "c20-tiles": {
    // ช่วงของ b c ทำให้ด้านบนยาวไม่เกิน x + 8 ด้านข้างยาวไม่เกิน x + 3 แผ่นที่วางกองกว้างไม่เกิน 13.4
    bbox: [-1.4, 1.4, 13.8, -8.4],
    axis: false,
    aspect: 15.2 / 9.8,
    initial: { b: 5, c: 6 },
    sliders: [
      { key: "b", label: "<i>b</i>", min: -7, max: 7, step: 1 },
      { key: "c", label: "<i>c</i>", min: -12, max: 12, step: 1 },
    ],
    draw(board, s, c) {
      let key = "";
      let cache = layout(5, 6);
      const get = (): Tiles => {
        const k = `${s.b}|${s.c}`;
        if (k !== key) {
          key = k;
          cache = layout(s.b ?? 0, s.c ?? 0);
        }
        return cache;
      };
      const tile = { strokeColor: c.ink, strokeWidth: 1.5 };
      rects(board, () => get().square, { ...tile, fillColor: c.accent, fillOpacity: 0.25 });
      rects(board, () => get().pos, { ...tile, fillColor: c.teal, fillOpacity: 0.35 });
      rects(board, () => get().neg, { ...tile, fillColor: c.violet, fillOpacity: 0.4 });

      const label = { anchorX: "middle", anchorY: "middle", fontSize: 15, strokeColor: c.ink, fixed: true, highlight: false };
      board.create("text", [X / 2, -X / 2, "x²"], { ...label, fontSize: 20, cssStyle: "font-style: italic" });
      const sideText = (n: number): string => (n === 0 ? "" : `${n > 0 ? "+" : "−"} ${Math.abs(n)}`);
      const p = (): number => get().fit?.[0] ?? 0;
      const q = (): number => get().fit?.[1] ?? 0;
      // ความยาวด้านของสี่เหลี่ยม แสดงเฉพาะตอนจัดได้
      board.create("text", [X / 2, 0.6, () => (get().fit ? "x" : "")], { ...label, cssStyle: "font-style: italic" });
      board.create("text", [() => X + Math.abs(p()) / 2, 0.6, () => sideText(p())], label);
      // ป้ายด้านซ้ายชิดขวา ข้อความยาวจะได้ไม่ทับสี่เหลี่ยมและไม่ล้นกรอบ
      board.create("text", [-0.3, -X / 2, () => (get().fit ? "x" : "")], { ...label, anchorX: "right", cssStyle: "font-style: italic" });
      board.create("text", [-0.3, () => -X - Math.abs(q()) / 2, () => sideText(q())], { ...label, anchorX: "right" });
    },
    readout(s) {
      const b = s.b ?? 0;
      const c = s.c ?? 0;
      const fit = pair(b, c);
      if (!fit) {
        const ps = pairsOf(c);
        const list = ps.map(([u, v]) => `${fmt(u)} กับ ${fmt(v)}`).join(" และ ");
        const sums = ps.map(([u, v]) => fmt(u + v)).join("  ");
        return `${m(poly(b, c))} จัดเป็นสี่เหลี่ยมผืนผ้าไม่ได้<br>คู่จำนวนเต็มที่คูณกันได้ ${m(fmt(c))} คือ ${m(list)} บวกกันได้ ${m(sums)} ไม่มีคู่ไหนได้ ${m(fmt(b))} จึงแยกตัวประกอบด้วยจำนวนเต็มไม่ได้`;
      }
      const [p, q] = fit;
      let note: string;
      if (p === 0 && q === 0) note = "มีแผ่น x² แผ่นเดียว เป็นสี่เหลี่ยมจัตุรัสอยู่แล้ว";
      else if (p === q) note = `ได้รูปสี่เหลี่ยมจัตุรัส ด้านละ ${m(`${xi} ${p > 0 ? "+" : "−"} ${fmt(Math.abs(p))}`)} จึงเป็นกำลังสองสมบูรณ์`;
      else if (q === 0) note = `ไม่มีแผ่นเล็ก ด้านข้างยาวแค่ ${m(xi)} จึงดึง ${m(xi)} ออกมาเป็นตัวร่วมได้`;
      else if (p * q < 0) note = `แผ่น ${m(xi)} สีเขียวกับสีม่วงหักล้างกันได้ ${Math.min(Math.abs(p), Math.abs(q))} คู่ ${b === 0 ? `หมดพอดี จึงไม่มีพจน์ ${m(xi)}` : `เหลือ ${m(`${Math.abs(b) === 1 ? (b < 0 ? "−" : "") : fmt(b)}${xi}`)} ตรงกับพจน์กลาง`}`;
      else note = `${m(fmt(p))} กับ ${m(fmt(q))} คูณกันได้ ${m(fmt(c))} และบวกกันได้ ${m(fmt(b))}`;
      return `${m(`${poly(b, c)} = ${product(p, q)}`)}<br>${note}`;
    },
  },

  /* ตัดมุม b × b ออกจากสี่เหลี่ยมจัตุรัส a × a แล้วย้ายชิ้นหนึ่งไปต่อ ได้สี่เหลี่ยมผืนผ้า (a + b) × (a − b) */
  "c20-diff-squares": {
    bbox: [-2.2, 1.3, 14, -10.04],
    axis: false,
    aspect: 10 / 7,
    initial: { a: 7, b: 3, t: 0 },
    sliders: [
      { key: "a", label: "<i>a</i>", min: 5, max: 9, step: 1 },
      { key: "b", label: "<i>b</i>", min: 1, max: 4, step: 1 },
      { key: "t", label: "ย้ายชิ้น", min: 0, max: 1, step: 0.05 },
    ],
    draw(board, s, c) {
      const get = (): Pieces => pieces(s.a ?? 7, s.b ?? 3, s.t ?? 0);
      rects(board, () => [get().hole], { strokeColor: c.ink3, strokeWidth: 1.5, dash: 2, fillColor: "none" });
      rects(board, () => [get().stay], { strokeColor: c.ink, strokeWidth: 1.8, fillColor: c.teal, fillOpacity: 0.35 });
      const mv = board.create("curve", [[0], [0]], {
        strokeColor: c.ink, strokeWidth: 1.8, fillColor: c.accent, fillOpacity: 0.35, highlight: false, fixed: true,
      });
      mv.updateDataArray = function () {
        const ps = get().move;
        this.dataX = ps.map((p) => p[0]);
        this.dataY = ps.map((p) => p[1]);
      };

      const label = { anchorX: "middle", anchorY: "middle", fontSize: 15, strokeColor: c.ink, fixed: true, highlight: false };
      const a = (): number => s.a ?? 7;
      const b = (): number => s.b ?? 3;
      const done = (): boolean => (s.t ?? 0) >= 1;
      board.create("text", [() => (done() ? (a() + b()) / 2 : a() / 2), 0.6, () => (done() ? "a + b" : "a")], {
        ...label, cssStyle: "font-style: italic",
      });
      board.create("text", [-0.3, () => (done() ? -(a() - b()) / 2 : -a() / 2), () => (done() ? "a − b" : "a")], {
        ...label, anchorX: "right", cssStyle: "font-style: italic",
      });
      board.create("text", [() => a() - b() / 2, () => -a() + b() / 2, () => ((s.t ?? 0) > 0 ? "" : "b²")], {
        ...label, strokeColor: c.ink3, cssStyle: "font-style: italic",
      });
    },
    readout(s) {
      const a = s.a ?? 7;
      const b = s.b ?? 3;
      const t = s.t ?? 0;
      const left = m(`<i>a</i><sup>2</sup> − <i>b</i><sup>2</sup> = ${fmt(a)}<sup>2</sup> − ${fmt(b)}<sup>2</sup> = ${fmt(a * a - b * b)}`);
      if (t >= 1) {
        const right = m(`(<i>a</i> + <i>b</i>)(<i>a</i> − <i>b</i>) = ${fmt(a + b)} × ${fmt(a - b)} = ${fmt((a + b) * (a - b))}`);
        return `${right}<br>ได้สี่เหลี่ยมผืนผ้า พื้นที่เท่าเดิม ${left}`;
      }
      return `${left}<br>สี่เหลี่ยมจัตุรัสที่ถูกตัดมุมออก แบ่งเป็นชิ้นสีเขียวกับสีส้ม เลื่อนแถบย้ายชิ้นไปจนสุด`;
    },
  },
};
