/* กราฟของบทที่ 31 อัตราส่วนตรีโกณมิติ
   ทุกกราฟซ่อนแกน และตั้ง bbox ให้สัดส่วน 4 ต่อ 3 เท่ากรอบ หนึ่งหน่วยแนวนอนจึงยาวเท่าแนวตั้ง มุมไม่เบี้ยว */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

type XY = [number, number];
type Box = [number, number, number, number];

const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";
const NUM_CSS = "font-family: 'IBM Plex Mono', monospace; font-weight: 600";

/* ตัวเลขในข้อความ ปัดตามจำนวนตำแหน่งที่ขอ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number, digits = 2): string {
  const p = 10 ** digits;
  const r = Math.round(n * p) / p;
  return String(r).replace("-", "−");
}

function m(text: string): string {
  return `<span class="m">${text}</span>`;
}

const rad = (deg: number): number => (deg * Math.PI) / 180;

/* กระดานไม่มีแกน ใช้กับ axis: false */
function plain(board: JXG.Board, box: Box): void {
  board.setBoundingBox(box, true);
}

/* เส้นหลายจุดที่คำนวณจุดใหม่ทุกครั้งที่กราฟอัปเดต */
function shape(board: JXG.Board, pts: () => XY[], attrs: object, closed = false): JXG.Curve {
  const cv = board.create("curve", [[0], [0]], { fixed: true, highlight: false, ...attrs });
  cv.updateDataArray = function () {
    const ps = pts();
    const all = closed && ps.length ? [...ps, ps[0] as XY] : ps;
    this.dataX = all.map((p) => p[0]);
    this.dataY = all.map((p) => p[1]);
  };
  return cv;
}

/* ส่วนโค้งแสดงมุม จุดศูนย์กลาง at รัศมี r จากมุม 0 ถึง deg องศา */
function arc(at: XY, r: number, deg: number): XY[] {
  const pts: XY[] = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = rad((deg * i) / n);
    pts.push([at[0] + r * Math.cos(t), at[1] + r * Math.sin(t)]);
  }
  return pts;
}

const RATIO_BOX: Box = [-2.2, 10.7, 13.8, -1.3];
const ELEV_BOX: Box = [-4, 33, 44, -3];

/* หอสูง 30 เมตร คนยืนห่างจากหอ d เมตร ระดับสายตาสูง 1.5 เมตร */
const TOWER_X = 40;
const TOWER_H = 30;
const EYE = 1.5;

export const boards: Record<string, BoardDef> = {
  /* รูปสามเหลี่ยมมุมฉาก ABC มุม C เป็นมุมฉาก A อยู่ที่จุดกำเนิด ด้าน AB ยาว r
     เปลี่ยนมุม A แล้วอัตราส่วนเปลี่ยน เปลี่ยนขนาด r แล้วด้านยาวขึ้นแต่อัตราส่วนเท่าเดิม */
  "c31-ratios": {
    bbox: RATIO_BOX,
    axis: false,
    initial: { deg: 35, r: 6 },
    sliders: [
      { key: "deg", label: "มุม <i>A</i>", min: 10, max: 80, step: 1 },
      { key: "r", label: "ขนาด", min: 3, max: 10, step: 1 },
    ],
    draw(board, s, c) {
      plain(board, RATIO_BOX);
      const t = (): number => rad(s.deg ?? 35);
      const r = (): number => s.r ?? 6;
      const adj = (): number => r() * Math.cos(t());
      const opp = (): number => r() * Math.sin(t());
      const A: XY = [0, 0];
      const C = (): XY => [adj(), 0];
      const B = (): XY => [adj(), opp()];

      shape(board, () => [A, C(), B()], {
        strokeWidth: 0, fillColor: c.teal, fillOpacity: 0.12,
      }, true);
      shape(board, () => [A, C()], { strokeColor: c.teal, strokeWidth: 4 });
      shape(board, () => [C(), B()], { strokeColor: c.accent, strokeWidth: 4 });
      shape(board, () => [A, B()], { strokeColor: c.violet, strokeWidth: 4 });

      // เครื่องหมายมุมฉากที่ C ย่อตามด้านที่สั้นที่สุด
      shape(board, () => {
        const k = Math.min(0.5, 0.3 * opp(), 0.3 * adj());
        const [x, y] = C();
        return [[x - k, y], [x - k, y + k], [x, y + k]];
      }, { strokeColor: c.ink, strokeWidth: 1.5 });

      // ส่วนโค้งของมุม A
      shape(board, () => arc(A, Math.min(1.1, 0.35 * r()), s.deg ?? 35), { strokeColor: c.ink, strokeWidth: 2 });

      const label = (at: () => XY, content: () => string, ax: string, ay: string, css: string, size: number): void => {
        board.create("text", [() => at()[0], () => at()[1], content], {
          fixed: true, highlight: false, anchorX: ax, anchorY: ay, fontSize: size, strokeColor: c.ink, cssStyle: css,
        });
      };
      label(() => [-0.3, 0.15], () => "A", "right", "bottom", LABEL_CSS, 18);
      label(() => [adj() / 2, -0.2], () => fmt(adj()), "middle", "top", NUM_CSS, 13);
      label(() => [adj() + 0.25, opp() / 2], () => fmt(opp()), "left", "middle", NUM_CSS, 13);
      // ด้านตรงข้ามมุมฉากเอียงขึ้นไปทางขวาเสมอ ป้ายจึงวางมุมซ้ายบนของจุดกึ่งกลาง
      label(
        () => [adj() / 2 - 0.25 * Math.sin(t()), opp() / 2 + 0.25 * Math.cos(t())],
        () => fmt(r()), "right", "bottom", NUM_CSS, 13,
      );
    },
    readout(s) {
      const deg = s.deg ?? 35;
      const r = s.r ?? 6;
      const t = rad(deg);
      const opp = r * Math.sin(t);
      const adj = r * Math.cos(t);
      return `มุม ${m(`<i>A</i> = ${deg}°`)}  ด้านตรงข้าม ${m(fmt(opp))}  ด้านประชิด ${m(fmt(adj))}  ด้านตรงข้ามมุมฉาก ${m(fmt(r))}<br>`
        + `${m(`sin <i>A</i> ≈ ${fmt(Math.sin(t), 3)}`)}  ${m(`cos <i>A</i> ≈ ${fmt(Math.cos(t), 3)}`)}  ${m(`tan <i>A</i> ≈ ${fmt(Math.tan(t), 3)}`)}`;
    },
  },

  /* มองยอดหอสูง 30 เมตร จากระยะ d เมตร ยิ่งเข้าใกล้ มุมเงยยิ่งโต แต่ d × tan(มุมเงย) เท่ากับ 28.5 เสมอ */
  "c31-elevation": {
    bbox: ELEV_BOX,
    axis: false,
    initial: { d: 20 },
    sliders: [{ key: "d", label: "ระยะ <i>d</i>", min: 5, max: 40, step: 1 }],
    draw(board, s, c) {
      plain(board, ELEV_BOX);
      const x0 = (): number => TOWER_X - (s.d ?? 20);
      const eye = (): XY => [x0(), EYE];
      const top: XY = [TOWER_X, TOWER_H];
      const alpha = (): number => (Math.atan2(TOWER_H - EYE, s.d ?? 20) * 180) / Math.PI;

      shape(board, () => [[-4, 0], [44, 0]], { strokeColor: c.ink, strokeWidth: 2 });
      shape(board, () => [[TOWER_X, 0], [TOWER_X + 2, 0], [TOWER_X + 2, TOWER_H], top], {
        strokeColor: c.teal, strokeWidth: 2, fillColor: c.teal, fillOpacity: 0.18,
      }, true);
      // คนยืน ลำตัวจากพื้นถึงระดับสายตา
      shape(board, () => [[x0(), 0], eye()], { strokeColor: c.ink, strokeWidth: 3 });
      shape(board, () => [eye(), [TOWER_X, EYE]], { strokeColor: c.teal, strokeWidth: 1.5, dash: 2 });
      shape(board, () => [eye(), top], { strokeColor: c.accent, strokeWidth: 3 });
      shape(board, () => arc(eye(), 3, alpha()), { strokeColor: c.ink, strokeWidth: 1.5 });
      board.create("point", [() => eye()[0], () => eye()[1]], {
        fixed: true, highlight: false, withLabel: false, size: 4, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 1.5,
      });

      const text = (at: () => XY, content: () => string, ax: string, ay: string): void => {
        board.create("text", [() => at()[0], () => at()[1], content], {
          fixed: true, highlight: false, anchorX: ax, anchorY: ay, fontSize: 13, strokeColor: c.ink, cssStyle: NUM_CSS,
        });
      };
      text(() => {
        const h = rad(alpha() / 2);
        return [x0() + 4 * Math.cos(h), EYE + 4 * Math.sin(h)];
      }, () => `${fmt(alpha(), 1)}°`, "left", "middle");
      text(() => [(x0() + TOWER_X) / 2, -0.6], () => `d = ${fmt(s.d ?? 20)} ม.`, "middle", "top");
      text(() => [TOWER_X + 1, TOWER_H + 0.6], () => `${TOWER_H} ม.`, "middle", "bottom");
    },
    readout(s) {
      const d = s.d ?? 20;
      const tan = (TOWER_H - EYE) / d;
      const deg = (Math.atan(tan) * 180) / Math.PI;
      return `ระยะ ${m(`<i>d</i> = ${fmt(d)}`)} ม.  มุมเงย ≈ ${m(`${fmt(deg, 1)}°`)}  ${m(`tan ≈ ${fmt(tan, 3)}`)}<br>`
        + `ส่วนของหอที่สูงกว่าระดับตา ${m(`<i>d</i> × tan ≈ ${fmt(d)} × ${fmt(tan, 3)} ≈ ${fmt(d * tan, 1)}`)} ม. บวกระดับตา ${m(fmt(EYE))} ม. ได้ ${m(fmt(d * tan + EYE, 1))} ม.`;
    },
  },
};
