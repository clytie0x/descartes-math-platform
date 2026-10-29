/* กราฟของบทที่ 25 กราฟของฟังก์ชันกำลังสอง */

import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
export function num(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

function coef(a: number): string {
  if (a === 1) return "";
  if (a === -1) return "−";
  return num(a);
}

/* y = a(x − h)² + k เป็น HTML ใช้กับ class m ที่ตั้งฟอนต์ของ KaTeX ไว้ */
export function vertexForm(a: number, h: number, k: number): string {
  const x = "<i>x</i>";
  const sq = h === 0 ? `${x}<sup>2</sup>` : `(${x} ${h > 0 ? "−" : "+"} ${num(Math.abs(h))})<sup>2</sup>`;
  const tail = k === 0 ? "" : ` ${k > 0 ? "+" : "−"} ${num(Math.abs(k))}`;
  return `<span class="m"><i>y</i> = ${coef(a)}${sq}${tail}</span>`;
}

export const boards: Record<string, BoardDef> = {
  /* จุดจากตารางค่าของ y = x² − 4x + 3 แล้วลากเส้นต่อ ดูว่าได้รูปพาราโบลา */
  "table-points": {
    bbox: [-2.5, 9.5, 6.5, -2.5],
    initial: { joined: 0 },
    sliders: [{ key: "joined", label: "ลากเส้นต่อจุด", min: 0, max: 1, step: 1, toggle: true }],
    draw(board, s, c) {
      const f = (x: number): number => x * x - 4 * x + 3;
      // ค่า NaN ทำให้ไม่วาดเส้น ใช้ซ่อนเส้นจนกว่าจะเลื่อนแถบ
      board.create("functiongraph", [(x: number) => ((s.joined ?? 0) > 0 ? f(x) : Number.NaN), -2.5, 6.5], {
        strokeColor: c.accent, strokeWidth: 3, highlight: false,
      });
      for (let x = -1; x <= 5; x++) {
        board.create("point", [x, f(x)], {
          fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
        });
      }
    },
    readout(s) {
      return (s.joined ?? 0) > 0
        ? "ต่อจุดด้วยเส้นโค้งเรียบ ได้รูปคล้ายตัว U เรียกว่า<strong>พาราโบลา</strong>"
        : "ติ๊กช่องลากเส้นต่อจุด แล้วดูว่าได้รูปอะไร";
    },
  },

  "ax2": {
    bbox: [-5, 9, 5, -9],
    steps: [1, 2],
    initial: { a: 2 },
    sliders: [{ key: "a", label: "<i>a</i>", min: -3, max: 3, step: 0.5 }],
    draw(board, s, c) {
      board.create("functiongraph", [(x: number) => x * x], {
        strokeColor: c.ink3, strokeWidth: 1.5, dash: 2, highlight: false,
      });
      board.create("functiongraph", [(x: number) => (s.a ?? 1) * x * x], {
        strokeColor: c.accent, strokeWidth: 3.5, highlight: false,
      });
      board.create("point", [0, 0], {
        fixed: true, withLabel: false, size: 4, fillColor: c.ink, strokeColor: c.ink, highlight: false,
      });
    },
    readout(s) {
      const a = s.a ?? 1;
      if (a === 0) return "<span class=\"m\"><i>a</i> = 0</span> ได้ <span class=\"m\"><i>y</i> = 0</span> ซึ่งเป็นเส้นตรง ไม่ใช่ฟังก์ชันกำลังสอง";
      const dir = a > 0 ? "เปิดขึ้น จุดยอดเป็นจุดต่ำสุด" : "คว่ำลง จุดยอดเป็นจุดสูงสุด";
      const wide = Math.abs(a) > 1 ? "แคบกว่า" : Math.abs(a) < 1 ? "กว้างกว่า" : "เท่ากับ";
      return `${vertexForm(a, 0, 0)}  ${dir}  ${wide}เส้นประ <span class="m"><i>y</i> = <i>x</i><sup>2</sup></span>`;
    },
  },

  "vertex-form": {
    bbox: [-6, 8, 6, -7],
    initial: { a: 1, h: 2, k: -1 },
    sliders: [
      { key: "a", label: "<i>a</i>", min: -3, max: 3, step: 0.5 },
      { key: "h", label: "<i>h</i>", min: -4, max: 4, step: 1 },
      { key: "k", label: "<i>k</i>", min: -5, max: 5, step: 1 },
    ],
    draw(board, s, c) {
      const a = (): number => s.a ?? 1;
      const h = (): number => s.h ?? 0;
      const k = (): number => s.k ?? 0;
      board.create("line", [[h, 0], [h, 1]], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      board.create("functiongraph", [(x: number) => a() * (x - h()) ** 2 + k()], {
        strokeColor: c.accent, strokeWidth: 3.5, highlight: false,
      });
      board.create("point", [h, k], {
        fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
      });
      board.create("text", [() => h() + 0.3, () => k() + (a() >= 0 ? -0.5 : 0.6), () => `(${num(h())}, ${num(k())})`], {
        fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false,
        cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 600",
      });
    },
    readout(s) {
      const a = s.a ?? 1;
      const h = s.h ?? 0;
      const k = s.k ?? 0;
      if (a === 0) return "<span class=\"m\"><i>a</i> = 0</span> กราฟเป็นเส้นตรง ลองเลื่อน <span class=\"m\"><i>a</i></span> ออกจากศูนย์";
      return `${vertexForm(a, h, k)}<br>จุดยอด <span class="m">(${num(h)}, ${num(k)})</span>  แกนสมมาตร <span class="m"><i>x</i> = ${num(h)}</span>  ${a > 0 ? "ค่าต่ำสุด" : "ค่าสูงสุด"} <span class="m">${num(k)}</span>`;
    },
  },

  /* รั้วยาว 40 เมตร ล้อมที่ดินสี่เหลี่ยมผืนผ้าติดกำแพง ด้านกว้าง x สองด้าน ด้านยาว 40 − 2x หนึ่งด้าน */
  "fence": {
    bbox: [-2.5, 235, 21.5, -35],
    steps: [2, 50],
    initial: { x: 6 },
    draw(board, s, c, changed) {
      const area = (x: number): number => x * (40 - 2 * x);
      const graph = board.create("functiongraph", [area, 0, 20], {
        strokeColor: c.accent, strokeWidth: 3.5, highlight: false,
      });
      const g = board.create("glider", [s.x ?? 6, area(s.x ?? 6), graph], {
        withLabel: false, size: 7, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2,
        highlightFillColor: c.ink, highlightStrokeColor: c.accent,
      });
      board.create("segment", [[() => g.X(), 0], g], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      g.on("drag", () => {
        s.x = Math.round(g.X() * 10) / 10;
        changed();
      });
    },
    readout(s) {
      const x = s.x ?? 6;
      return `กว้าง <span class="m">${num(x)}</span> ม.  ยาว <span class="m">${num(40 - 2 * x)}</span> ม.  พื้นที่ <span class="m">${num(x * (40 - 2 * x))}</span> ตร.ม.`;
    },
  },

  /* เฉลยข้อวาดกราฟ y = −(x − 1)² + 4 */
  "sketch-check": {
    bbox: [-3.5, 5.5, 5.5, -2.5],
    initial: {},
    draw(board, _s, c) {
      board.create("line", [[1, 0], [1, 1]], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      board.create("functiongraph", [(x: number) => -((x - 1) ** 2) + 4], {
        strokeColor: c.accent, strokeWidth: 3.5, highlight: false,
      });
      const pts: [number, number][] = [[1, 4], [0, 3], [2, 3], [-1, 0], [3, 0]];
      for (const [x, y] of pts) {
        board.create("point", [x, y], {
          fixed: true, size: 4, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
          name: `(${num(x)}, ${num(y)})`, withLabel: true,
          label: { offset: [8, 10], fontSize: 12, strokeColor: c.ink, cssStyle: "font-family: 'IBM Plex Mono', monospace" },
        });
      }
    },
  },

  /* แบบฝึกหัด ลากจุดไปที่จุดยอด ไม่วาดกราฟให้เห็น */
  "ex-drag-point": {
    bbox: [-5.5, 5.5, 5.5, -5.5],
    initial: { x: 0, y: 0 },
    draw(board, s, c, changed) {
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
      return `จุดที่ลากอยู่ที่ <span class="m">(${num(s.x ?? 0)}, ${num(s.y ?? 0)})</span>`;
    },
    value(s) {
      return `${s.x ?? 0}, ${s.y ?? 0}`;
    },
  },
};
