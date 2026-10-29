/* กราฟของบทที่ 4 ทศนิยมและเศษส่วน */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

const MINUS = "−";
const DOT = "̇"; // จุดบนตัวเลข ใช้เขียนทศนิยมซ้ำแบบหนังสือ สสวท.
const EDGE = 3.4; // เส้นจำนวนที่เห็นอยู่ระหว่าง −EDGE ถึง EDGE

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x;
}

function fracHtml(n: number, d: number): string {
  return `${n < 0 ? MINUS : ""}<sup>${Math.abs(n)}</sup>⁄<sub>${d}</sub>`;
}

/* n/d เป็นทศนิยม ถ้าเป็นทศนิยมซ้ำ ใส่จุดบนตัวแรกและตัวสุดท้ายของชุดที่ซ้ำ */
function decimal(n: number, d: number): string {
  const sign = n < 0 ? MINUS : "";
  const whole = Math.floor(Math.abs(n) / d);
  let r = Math.abs(n) % d;
  if (r === 0) return `${whole === 0 ? "" : sign}${whole}`;
  const digits: number[] = [];
  const seen = new Map<number, number>();
  while (r !== 0 && !seen.has(r)) {
    seen.set(r, digits.length);
    r *= 10;
    digits.push(Math.floor(r / d));
    r %= d;
  }
  if (r === 0) return `${sign}${whole}.${digits.join("")}`;
  const start = seen.get(r) ?? 0;
  const rep = digits.slice(start).map((x, i, all) => (i === 0 || i === all.length - 1 ? `${x}${DOT}` : String(x)));
  return `${sign}${whole}.${digits.slice(0, start).join("")}${rep.join("")}`;
}

export const boards: Record<string, BoardDef> = {
  /* เศษส่วน n/d บนเส้นจำนวน แถบด้านบนแบ่งแต่ละหน่วยเป็น d ช่อง แล้วระบายจาก 0 ไปถึง n/d */
  "c4-fraction-line": {
    bbox: [-3.6, 2.1, 3.6, -1.4],
    steps: [1, 10],
    initial: { n: -3, d: 4 },
    sliders: [
      { key: "n", label: "ตัวเศษ", min: -12, max: 12, step: 1 },
      { key: "d", label: "ตัวส่วน", min: 1, max: 12, step: 1 },
    ],
    draw(board, s, c) {
      // เส้นจำนวนใช้แกนนอนอย่างเดียว ชนิดข้อมูลของ defaultAxes ใน jsxgraph ไม่ตรงกับของจริง จึงต้องแปลงชนิด
      (board.defaultAxes.y as unknown as JXG.Axis | undefined)?.setAttribute({ visible: false });
      const n = (): number => s.n ?? 0;
      const d = (): number => Math.max(1, s.d ?? 1);
      const v = (): number => n() / d();
      const inView = (): boolean => Math.abs(v()) <= EDGE;
      const top = 1.5;
      const bottom = 0.7;

      // ช่องที่ระบาย จาก 0 ไปถึง n/d
      const filled = board.create("curve", [[0], [0]], {
        strokeColor: c.accent, strokeWidth: 2, fillColor: c.accent, fillOpacity: 0.3, highlight: false,
      });
      filled.updateDataArray = function () {
        const x = Math.max(-EDGE - 0.2, Math.min(EDGE + 0.2, v()));
        this.dataX = [0, x, x, 0, 0];
        this.dataY = [bottom, bottom, top, top, bottom];
      };

      // ขอบแถบ และเส้นแบ่งช่องทุก 1/d บนแถบกับขีดบนเส้นจำนวน คั่นแต่ละเส้นด้วย NaN
      const cells = board.create("curve", [[0], [0]], { strokeColor: c.ink3, strokeWidth: 1, highlight: false });
      cells.updateDataArray = function () {
        const xs: number[] = [-EDGE - 0.2, EDGE + 0.2, Number.NaN, -EDGE - 0.2, EDGE + 0.2, Number.NaN];
        const ys: number[] = [bottom, bottom, Number.NaN, top, top, Number.NaN];
        const k = Math.floor(EDGE * d());
        for (let i = -k; i <= k; i++) {
          const x = i / d();
          xs.push(x, x, Number.NaN, x, x, Number.NaN);
          ys.push(bottom, top, Number.NaN, -0.12, 0.12, Number.NaN);
        }
        this.dataX = xs;
        this.dataY = ys;
      };

      board.create("point", [() => (inView() ? v() : Number.NaN), 0], {
        fixed: true, withLabel: false, size: 6, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 2, highlight: false,
      });
      board.create("text", [() => (inView() ? v() : Number.NaN), -0.8, () => fracHtml(n(), d())], {
        fixed: true, highlight: false, anchorX: "middle", anchorY: "middle", fontSize: 16, strokeColor: c.ink,
        cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 600",
      });
    },
    readout(s) {
      const n = s.n ?? 0;
      const d = Math.max(1, s.d ?? 1);
      const g = gcd(n, d) || 1;
      const lowest = g > 1 && d / g > 1 ? ` = <span class="m">${fracHtml(n / g, d / g)}</span>` : "";
      const head = `<span class="m">${fracHtml(n, d)}</span>${lowest} = <span class="m">${decimal(n, d)}</span>`;
      const how = n === 0
        ? "ตัวเศษเป็นศูนย์ ไม่ได้นับช่องไหนเลย จึงอยู่ที่ 0 พอดี"
        : `แบ่งแต่ละหน่วยเป็น ${d} ช่องเท่ากัน แล้วนับจาก 0 ไปทาง${n < 0 ? "ซ้าย" : "ขวา"} ${Math.abs(n)} ช่อง`;
      const out = Math.abs(n / d) > EDGE ? "<br>จุดนี้อยู่นอกเส้นที่เห็น ลองลดตัวเศษหรือเพิ่มตัวส่วน" : "";
      return `${head}<br>${how}${out}`;
    },
  },
};
