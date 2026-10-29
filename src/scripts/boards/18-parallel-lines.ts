/* กราฟของบทที่ 18 เส้นขนาน
   ทั้งสองกราฟไม่ใช่กราฟพิกัด จึงไม่วาดแกน และตั้งให้หนึ่งหน่วยแนวนอนยาวเท่าแนวตั้ง มุมจะได้ไม่เบี้ยว
   มุมทุกมุมเป็นจำนวนเต็มองศา ตัวเลขที่แสดงจะได้บวกกันลงตัวพอดี */

import type JXG from "jsxgraph";
import type { BoardDef, Colors } from "./types.ts";

type XY = [number, number];
type State = Record<string, number>;

const RAD = Math.PI / 180;
const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";
const NUM_CSS = "font-family: 'IBM Plex Mono', monospace; font-weight: 600";

function m(text: string): string {
  return `<span class="m">${text}</span>`;
}

function deg(n: number): string {
  return m(`${String(Math.round(n)).replace("-", "−")}°`);
}

/* กราฟไม่มีแกน กรอบอาจถูกจำกัดความสูง ตั้งกรอบใหม่ให้หนึ่งหน่วยสองแนวยาวเท่ากัน */
function square(board: JXG.Board, bbox: [number, number, number, number]): void {
  board.setBoundingBox(bbox, true);
}

/* ส่วนของวงกลมที่ center รัศมี r จากมุม from ไปมุม to ทวนเข็มนาฬิกา หน่วยองศา ระบายสี color
   show เป็นเท็จเมื่อไม่ต้องการให้เห็น */
function sector(
  board: JXG.Board,
  center: () => XY,
  r: number,
  from: () => number,
  to: () => number,
  color: () => string,
  show: () => boolean = () => true,
): void {
  const cv = board.create("curve", [[0], [0]], {
    strokeWidth: 1.5, fillOpacity: 0.3, highlight: false, fixed: true,
    // JSXGraph รับสีเป็นฟังก์ชันได้ แต่ชนิดข้อมูลของ fillColor ระบุไว้แค่ string
    strokeColor: color, fillColor: color as unknown as string,
  });
  cv.updateDataArray = function () {
    if (!show()) {
      this.dataX = [Number.NaN];
      this.dataY = [Number.NaN];
      return;
    }
    const [cx, cy] = center();
    const a = from();
    let b = to();
    while (b < a) b += 360;
    const xs = [cx];
    const ys = [cy];
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const t = (a + ((b - a) * i) / n) * RAD;
      xs.push(cx + r * Math.cos(t));
      ys.push(cy + r * Math.sin(t));
    }
    xs.push(cx);
    ys.push(cy);
    this.dataX = xs;
    this.dataY = ys;
  };
}

/* ตัวหนังสือกลางมุม ห่างจากจุดยอด r หน่วยตามเส้นแบ่งครึ่งมุม */
function angleText(
  board: JXG.Board,
  center: () => XY,
  r: number,
  from: () => number,
  to: () => number,
  content: () => string,
  c: Colors,
): void {
  const mid = (): number => {
    const a = from();
    let b = to();
    while (b < a) b += 360;
    return ((a + b) / 2) * RAD;
  };
  board.create("text", [
    () => center()[0] + r * Math.cos(mid()),
    () => center()[1] + r * Math.sin(mid()),
    content,
  ], {
    fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false,
    anchorX: "middle", anchorY: "middle", cssStyle: NUM_CSS,
  });
}

/* ---------- เส้นขนานกับเส้นตัด ----------
   เส้นบน y = 1.2 เส้นล่างผ่านจุด Q บน y = −1.2 เอียงได้ tilt องศา
   เส้นตัดผ่านจุดกำเนิด ทำมุม t องศากับแนวนอน ลากจุดบนเส้นตัดเพื่อหมุน */
const TR_BOX: [number, number, number, number] = [-4, 3, 4, -3];
const TOP = 1.2;
const HANDLE_R = 2.7;
const T_MIN = 30;
const T_MAX = 150;

/* ขนาดของมุมทั้งแปดตามหมายเลขในหน้า 18.1 จุดตัดบนคือ 1 2 3 4 จุดตัดล่างคือ 5 6 7 8 */
function eightAngles(t: number, tilt: number): number[] {
  const upper = [180 - t, t, t, 180 - t];
  const lower = [180 + tilt - t, t - tilt, t - tilt, 180 + tilt - t];
  return [...upper, ...lower];
}

/* สีของมุม มุมที่ขนาดเท่ากันได้สีเดียวกัน ไล่สีตามลำดับที่เจอขนาดใหม่ */
function angleColors(sizes: number[], c: Colors): string[] {
  const palette = [c.accent, c.teal, c.violet, c.ink3];
  const seen: number[] = [];
  return sizes.map((v) => {
    let i = seen.indexOf(v);
    if (i < 0) {
      seen.push(v);
      i = seen.length - 1;
    }
    return palette[Math.min(i, palette.length - 1)] ?? c.ink3;
  });
}

/* ---------- รูปสามเหลี่ยม ----------
   ฐาน BC อยู่กับที่ เก็บมุม B กับมุม C เป็นจำนวนเต็มองศาใน state แล้วคำนวณตำแหน่ง A จากสองมุมนี้ */
const TRI_BOX: [number, number, number, number] = [-4, 3, 4, -3];
const B_PT: XY = [-2.2, -1.8];
const C_PT: XY = [2.2, -1.8];

function apex(b: number, c: number): XY {
  const base = C_PT[0] - B_PT[0];
  const ab = (base * Math.sin(c * RAD)) / Math.sin((b + c) * RAD);
  return [B_PT[0] + ab * Math.cos(b * RAD), B_PT[1] + ab * Math.sin(b * RAD)];
}

function clampNum(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export const boards: Record<string, BoardDef> = {
  "c18-transversal": {
    bbox: TR_BOX,
    axis: false,
    initial: { t: 60, tilt: 0, size: 0 },
    sliders: [
      { key: "tilt", label: "เอียงเส้นล่าง", min: -20, max: 20, step: 1 },
      { key: "size", label: "แสดงขนาดมุม", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c, changed) {
      square(board, TR_BOX);
      const t = (): number => s.t ?? 60;
      const tilt = (): number => s.tilt ?? 0;
      const sizes = (): number[] => eightAngles(t(), tilt());
      const colorOf = (i: number) => (): string => angleColors(sizes(), c)[i] ?? c.ink;
      const P = (): XY => [TOP / Math.tan(t() * RAD), TOP];
      const Q = (): XY => [-TOP / Math.tan(t() * RAD), -TOP];
      const base = { fixed: true, highlight: false };

      // มุมของรังสีที่จุดตัด ทวนเข็มจากทิศขวา จุดตัดบน 1 ซ้ายบน 2 ขวาบน 3 ซ้ายล่าง 4 ขวาล่าง
      const upperRays: [() => number, () => number][] = [
        [t, () => 180], [() => 0, t], [() => 180, () => 180 + t()], [() => 180 + t(), () => 360],
      ];
      const lowerRays: [() => number, () => number][] = [
        [t, () => 180 + tilt()], [tilt, t], [() => 180 + tilt(), () => 180 + t()], [() => 180 + t(), () => 360 + tilt()],
      ];
      const rays = [...upperRays.map((r) => ({ at: P, r })), ...lowerRays.map((r) => ({ at: Q, r }))];
      rays.forEach(({ at, r }, i) => {
        sector(board, at, 0.42, r[0], r[1], colorOf(i));
      });

      board.create("line", [[-1, TOP], [1, TOP]], { ...base, strokeColor: c.ink, strokeWidth: 2.5 });
      board.create("line", [
        [() => Q()[0], () => Q()[1]],
        [() => Q()[0] + Math.cos(tilt() * RAD), () => Q()[1] + Math.sin(tilt() * RAD)],
      ], { ...base, strokeColor: c.ink, strokeWidth: 2.5 });
      board.create("line", [[0, 0], [() => Math.cos(t() * RAD), () => Math.sin(t() * RAD)]], {
        ...base, strokeColor: c.ink3, strokeWidth: 2,
      });

      rays.forEach(({ at, r }, i) => {
        angleText(board, at, (s.size ?? 0) > 0 ? 0.78 : 0.66, r[0], r[1],
          () => ((s.size ?? 0) > 0 ? `${Math.round(sizes()[i] ?? 0)}°` : String(i + 1)), c);
      });

      const h = board.create("point", [HANDLE_R * Math.cos(t() * RAD), HANDLE_R * Math.sin(t() * RAD)], {
        withLabel: false, size: 7, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
      }) as JXG.Point;
      h.on("drag", () => {
        let a = Math.round(Math.atan2(h.Y(), h.X()) / RAD);
        if (a < 0) a += 180; // ลากลงใต้จุดกำเนิด ใช้ทิศตรงข้ามบนเส้นเดียวกัน
        a = clampNum(a, T_MIN, T_MAX);
        h.moveTo([HANDLE_R * Math.cos(a * RAD), HANDLE_R * Math.sin(a * RAD)]);
        s.t = a;
        changed();
      });
    },
    readout(s) {
      const t = s.t ?? 60;
      const tilt = s.tilt ?? 0;
      const v = eightAngles(t, tilt);
      const a = (n: number): string => `มุม ${n} = ${deg(v[n - 1] ?? 0)}`;
      const head = tilt === 0
        ? "เส้นบนกับเส้นล่าง<strong>ขนานกัน</strong>"
        : `เส้นล่างเอียง ${deg(Math.abs(tilt))} เส้นทั้งสอง<strong>ไม่ขนานกัน</strong>`;
      return `${head}<br>มุมภายในบนข้างเดียวกัน มุม 3 + มุม 5 = ${deg((v[2] ?? 0) + (v[4] ?? 0))}<br>`
        + `มุมแย้ง ${a(3)} ${a(6)}<br>มุมภายนอกและมุมภายในที่อยู่ตรงข้าม ${a(2)} ${a(6)}`;
    },
  },

  "c18-triangle": {
    bbox: TRI_BOX,
    axis: false,
    initial: { b: 50, c: 60, par: 0 },
    sliders: [{ key: "par", label: "แสดงเส้นขนานผ่าน A", min: 0, max: 1, step: 1, toggle: true }],
    draw(board, s, c, changed) {
      square(board, TRI_BOX);
      const b = (): number => s.b ?? 50;
      const cc = (): number => s.c ?? 60;
      const A = (): XY => apex(b(), cc());
      const par = (): boolean => (s.par ?? 0) > 0;
      const base = { fixed: true, highlight: false };

      sector(board, () => B_PT, 0.55, () => 0, b, () => c.accent);
      sector(board, () => C_PT, 0.55, () => 180 - cc(), () => 180, () => c.teal);
      sector(board, A, 0.5, () => 180 + b(), () => 360 - cc(), () => c.violet);
      sector(board, A, 0.55, () => 180, () => 180 + b(), () => c.accent, par);
      sector(board, A, 0.55, () => 360 - cc(), () => 360, () => c.teal, par);

      board.create("line", [[() => A()[0], () => A()[1]], [() => A()[0] + 1, () => A()[1]]], {
        ...base, strokeColor: c.ink3, strokeWidth: 1.5, dash: 2, visible: par,
      });
      const side = (p: () => XY, q: () => XY): void => {
        board.create("segment", [[() => p()[0], () => p()[1]], [() => q()[0], () => q()[1]]], {
          ...base, strokeColor: c.ink, strokeWidth: 2.5,
        });
      };
      side(A, () => B_PT);
      side(A, () => C_PT);
      side(() => B_PT, () => C_PT);

      angleText(board, () => B_PT, 0.95, () => 0, b, () => `${b()}°`, c);
      angleText(board, () => C_PT, 0.95, () => 180 - cc(), () => 180, () => `${cc()}°`, c);
      angleText(board, A, 0.9, () => 180 + b(), () => 360 - cc(), () => `${180 - b() - cc()}°`, c);

      for (const [p, name, off] of [[B_PT, "B", [-18, -8]], [C_PT, "C", [8, -8]]] as [XY, string, [number, number]][]) {
        board.create("point", [...p], {
          ...base, size: 3, fillColor: c.ink, strokeColor: c.ink, name, withLabel: true,
          label: { offset: off, fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
        });
      }
      const h = board.create("point", [...A()], {
        name: "A", size: 7, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 1.5,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
        label: { offset: [10, 12], fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
      }) as JXG.Point;
      h.on("drag", () => {
        // จำกัดจุด A ให้อยู่ในกรอบเหนือฐาน แล้วปัดมุม B กับมุม C เป็นจำนวนเต็ม
        const x = clampNum(h.X(), -3.4, 3.4);
        const y = clampNum(h.Y(), B_PT[1] + 0.9, 2.6);
        let nb = Math.round(Math.atan2(y - B_PT[1], x - B_PT[0]) / RAD);
        let nc = Math.round(Math.atan2(y - C_PT[1], C_PT[0] - x) / RAD);
        nb = clampNum(nb, 5, 170);
        nc = clampNum(nc, 5, 170);
        if (nb + nc > 172) {
          const over = nb + nc - 172;
          if (nb >= nc) nb -= over;
          else nc -= over;
        }
        s.b = nb;
        s.c = nc;
        h.moveTo(apex(nb, nc));
        changed();
      });
    },
    readout(s) {
      const b = s.b ?? 50;
      const c = s.c ?? 60;
      const a = 180 - b - c;
      const sum = `มุม A = ${deg(a)}  มุม B = ${deg(b)}  มุม C = ${deg(c)}  รวมกัน ${deg(a + b + c)}`;
      return (s.par ?? 0) > 0
        ? `${sum}<br>เส้นประขนานกับ BC มุมสีส้มที่ A เป็นมุมแย้งกับมุม B มุมสีเขียวเป็นมุมแย้งกับมุม C สามมุมที่ A เรียงกันเป็นมุมตรง`
        : sum;
    },
  },
};
