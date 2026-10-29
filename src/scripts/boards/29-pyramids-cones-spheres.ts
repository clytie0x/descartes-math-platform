/* กราฟของบทที่ 29 พีระมิด กรวย และทรงกลม
   รูปคลี่ของกรวย ผิวข้างคลี่ออกเป็นเซกเตอร์รัศมี ℓ (สูงเอียง) ส่วนโค้งยาวเท่าเส้นรอบวงของฐาน 2πr
   มุมของเซกเตอร์จึงเป็น 360 × r / ℓ องศา ฐานวงกลมวาดแตะส่วนโค้งที่จุดล่างสุด
   จุดยอดของเซกเตอร์อยู่บนแกนตั้ง ทั้งรูปเลื่อนขึ้นลงให้อยู่กลางกรอบเสมอ
   ช่วงของแถบเลื่อน r 1 ถึง 3 และ ℓ 2 ถึง 6 รูปสูงไม่เกิน 12.9 หน่วย กว้างไม่เกิน 12 หน่วย จึงใช้กรอบจัตุรัส 14 หน่วย */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ปัดสองตำแหน่ง ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100).replace("-", "−");
}

interface Net {
  ok: boolean; // false เมื่อ r ไม่น้อยกว่า ℓ พับเป็นกรวยไม่ได้
  r: number;
  l: number;
  half: number; // ครึ่งหนึ่งของมุมเซกเตอร์ เป็นเรเดียน
  apex: number; // พิกัด y ของจุดยอดเซกเตอร์
  cy: number; // พิกัด y ของจุดศูนย์กลางฐาน
}

function net(s: Record<string, number>): Net {
  const r = s.r ?? 2;
  const l = s.l ?? 5;
  const half = (Math.PI * r) / l;
  const above = Math.max(0, -l * Math.cos(half)); // เซกเตอร์ที่มุมเกิน 180 องศา ยื่นขึ้นไปเหนือจุดยอด
  const apex = (l + 2 * r - above) / 2; // ให้ขอบบนกับขอบล่างของรูปห่างจาก y = 0 เท่ากัน
  return { ok: r < l, r, l, half, apex, cy: apex - l - r };
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

/* จุดบนส่วนโค้งของเซกเตอร์ เรียงจากขอบซ้ายไปขอบขวา มุมวัดจากทิศขวา ทิศลงคือ −90 องศา */
function arc(n: Net): [number[], number[]] {
  const xs: number[] = [];
  const ys: number[] = [];
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const t = -Math.PI / 2 - n.half + (2 * n.half * i) / steps;
    xs.push(n.l * Math.cos(t));
    ys.push(n.apex + n.l * Math.sin(t));
  }
  return [xs, ys];
}

function circle(n: Net): [number[], number[]] {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= 96; i++) {
    const t = (2 * Math.PI * i) / 96;
    xs.push(n.r * Math.cos(t));
    ys.push(n.cy + n.r * Math.sin(t));
  }
  return [xs, ys];
}

const EMPTY: [number[], number[]] = [[], []];

export const boards: Record<string, BoardDef> = {
  /* รูปคลี่ของกรวย ปรับรัศมีฐานกับสูงเอียง ดูมุมของเซกเตอร์เปลี่ยน */
  "c29-cone-net": {
    bbox: [-7, 7, 7, -7],
    aspect: 1,
    axis: false,
    initial: { r: 2, l: 5 },
    sliders: [
      { key: "r", label: "รัศมีฐาน <i>r</i>", min: 1, max: 3, step: 0.5 },
      { key: "l", label: "สูงเอียง ℓ", min: 2, max: 6, step: 0.5 },
    ],
    draw(board, s, c) {
      const n = (): Net => net(s);
      // เซกเตอร์ ระบายสีอ่อน ขอบสองข้างคือสูงเอียง
      path(board, () => {
        const g = n();
        if (!g.ok) return EMPTY;
        const [xs, ys] = arc(g);
        return [[0, ...xs, 0], [g.apex, ...ys, g.apex]];
      }, { strokeColor: c.ink, strokeWidth: 1.8, fillColor: c.accent, fillOpacity: 0.16 });
      // ส่วนโค้ง ยาวเท่าเส้นรอบวงของฐาน จึงใช้สีเดียวกับขอบวงกลม
      path(board, () => (n().ok ? arc(n()) : EMPTY), { strokeColor: c.accent, strokeWidth: 3.5 });
      // ฐานวงกลม
      path(board, () => (n().ok ? circle(n()) : EMPTY), {
        strokeColor: c.accent, strokeWidth: 3.5, fillColor: c.teal, fillOpacity: 0.16,
      });
      // รัศมีของฐาน เส้นประ
      path(board, () => {
        const g = n();
        return g.ok ? [[0, g.r], [g.cy, g.cy]] : EMPTY;
      }, { strokeColor: c.teal, strokeWidth: 1.5, dash: 2 });
      board.create("point", [() => 0, () => (n().ok ? n().apex : Number.NaN)], {
        fixed: true, withLabel: false, size: 3, fillColor: c.ink, strokeColor: c.ink, highlight: false,
      });
      board.create("point", [() => 0, () => (n().ok ? n().cy : Number.NaN)], {
        fixed: true, withLabel: false, size: 2.5, fillColor: c.ink, strokeColor: c.ink, highlight: false,
      });
      const label = { anchorX: "middle", anchorY: "middle", strokeColor: c.ink, fixed: true, highlight: false } as const;
      // ป้าย ℓ ข้างขอบขวาของเซกเตอร์ เลื่อนออกนอกเซกเตอร์ตามแนวตั้งฉากกับขอบ
      const edge = (): number => -Math.PI / 2 + n().half;
      board.create("text", [
        () => (n().l / 2) * Math.cos(edge()) - 0.45 * Math.sin(edge()),
        () => n().apex + (n().l / 2) * Math.sin(edge()) + 0.45 * Math.cos(edge()),
        () => (n().ok ? "ℓ" : ""),
      ], { ...label, fontSize: 18, cssStyle: "font-style: italic; font-family: 'KaTeX_Math', serif" });
      // มุมของเซกเตอร์ เขียนไว้ใต้จุดยอด
      board.create("text", [0, () => n().apex - 1.3, () => (n().ok ? `${fmt((360 * n().r) / n().l)}°` : "")], {
        ...label, fontSize: 14, cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 600",
      });
      board.create("text", [() => n().r / 2, () => n().cy + 0.4, () => (n().ok ? "r" : "")], {
        ...label, fontSize: 18, cssStyle: "font-style: italic; font-family: 'KaTeX_Math', serif",
      });
      board.create("text", [0, 0, () => (n().ok ? "" : "สูงเอียงต้องยาวกว่ารัศมีของฐาน")], { ...label, fontSize: 15 });
    },
    readout(s) {
      const { r, l, ok } = net(s);
      if (!ok) {
        return `<span class="m">ℓ = ${fmt(l)}</span> ไม่ยาวกว่า <span class="m"><i>r</i> = ${fmt(r)}</span> ม้วนเซกเตอร์เป็นกรวยไม่ได้ ลองเพิ่มสูงเอียง`;
      }
      const deg = (360 * r) / l;
      const h = Math.sqrt(l * l - r * r);
      return `มุมของเซกเตอร์ <span class="m">360° × ${fmt(r)} ÷ ${fmt(l)} = ${fmt(deg)}°</span>  ความสูงของกรวย <span class="m"><i>h</i> ≈ ${fmt(h)}</span><br>`
        + `พื้นที่ผิวข้าง <span class="m">π<i>r</i>ℓ = ${fmt(r * l)}π</span>  พื้นที่ฐาน <span class="m">π<i>r</i><sup>2</sup> = ${fmt(r * r)}π</span>`;
    },
  },
};
