/* กราฟของบทที่ 8 กราฟและความสัมพันธ์เชิงเส้น */

import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

/* y = ax + b เป็น HTML */
function lineEq(a: number, b: number): string {
  const x = "<i>x</i>";
  let head = "";
  if (a === 1) head = x;
  else if (a === -1) head = `−${x}`;
  else if (a !== 0) head = `${fmt(a)}${x}`;
  let tail = "";
  if (head === "") tail = fmt(b);
  else if (b !== 0) tail = ` ${b > 0 ? "+" : "−"} ${fmt(Math.abs(b))}`;
  return `<span class="m"><i>y</i> = ${head}${tail}</span>`;
}

function where(x: number, y: number): string {
  if (x === 0 && y === 0) return "อยู่ที่จุดกำเนิด ไม่อยู่ในจตุภาคใด";
  if (y === 0) return "อยู่บนแกน <i>x</i> ไม่อยู่ในจตุภาคใด";
  if (x === 0) return "อยู่บนแกน <i>y</i> ไม่อยู่ในจตุภาคใด";
  if (x > 0 && y > 0) return "อยู่ในจตุภาคที่ 1";
  if (x < 0 && y > 0) return "อยู่ในจตุภาคที่ 2";
  if (x < 0) return "อยู่ในจตุภาคที่ 3";
  return "อยู่ในจตุภาคที่ 4";
}

const MONO = "font-family: 'IBM Plex Mono', monospace";

export const boards: Record<string, BoardDef> = {
  /* ระนาบพิกัดฉาก ลากจุดแล้วอ่านคู่อันดับกับจตุภาค */
  "c8-plane": {
    bbox: [-6.5, 6.5, 6.5, -6.5],
    initial: { x: 3, y: 2 },
    draw(board, s, c, changed) {
      const quads: [number, number][] = [[2.6, 6], [-6.2, 6], [-6.2, -5.7], [2.6, -5.7]];
      quads.forEach(([x, y], i) => {
        board.create("text", [x, y, `จตุภาคที่ ${i + 1}`], {
          fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false,
        });
      });
      const p = board.create("point", [s.x ?? 3, s.y ?? 2], {
        withLabel: false, size: 7, snapToGrid: true, snapSizeX: 1, snapSizeY: 1,
        fillColor: c.accent, strokeColor: c.ink, strokeWidth: 2,
        highlightFillColor: c.accent, highlightStrokeColor: c.ink,
      });
      board.create("segment", [[() => p.X(), 0], p], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      board.create("segment", [[0, () => p.Y()], p], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      p.on("drag", () => {
        s.x = Math.round(p.X());
        s.y = Math.round(p.Y());
        changed();
      });
    },
    readout(s) {
      const x = s.x ?? 0;
      const y = s.y ?? 0;
      return `จุด <span class="m">(${fmt(x)}, ${fmt(y)})</span>  ${where(x, y)}`;
    },
  },

  /* เทียนสูง 20 ซม. ไหม้ชั่วโมงละ 4 ซม. จุดจากตาราง แล้วติ๊กเพื่อต่อเป็นเส้น */
  "c8-candle": {
    bbox: [-0.8, 23, 6.5, -3],
    steps: [1, 4],
    initial: { joined: 0 },
    sliders: [{ key: "joined", label: "ต่อจุดเป็นเส้น", min: 0, max: 1, step: 1, toggle: true }],
    draw(board, s, c) {
      const f = (x: number): number => 20 - 4 * x;
      board.create("functiongraph", [(x: number) => ((s.joined ?? 0) > 0 ? f(x) : Number.NaN), 0, 5], {
        strokeColor: c.accent, strokeWidth: 3, highlight: false,
      });
      for (let x = 0; x <= 5; x++) {
        board.create("point", [x, f(x)], {
          fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
        });
      }
      board.create("text", [5.4, 1.4, "ชั่วโมง"], { fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false });
      board.create("text", [0.15, 22, "ความสูง (ซม.)"], { fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false });
    },
    readout(s) {
      return (s.joined ?? 0) > 0
        ? "ระหว่างชั่วโมงเทียนก็ยังไหม้อยู่ ทุกจุดบนเส้นจึงมีความหมาย เช่น ครึ่งชั่วโมงสูง <span class=\"m\">18</span> ซม."
        : "จุดหกจุดจากตาราง ติ๊กช่องเพื่อต่อจุด";
    },
  },

  /* y = ax + b ปรับ a และ b ด้วยแถบเลื่อน เส้นประบอกว่า x เพิ่ม 1 แล้ว y เปลี่ยนเท่าไร */
  "c8-linear": {
    bbox: [-6, 7, 6, -7],
    initial: { a: 2, b: -1 },
    sliders: [
      { key: "a", label: "<i>a</i>", min: -3, max: 3, step: 0.5 },
      { key: "b", label: "<i>b</i>", min: -5, max: 5, step: 1 },
    ],
    draw(board, s, c) {
      const a = (): number => s.a ?? 1;
      const b = (): number => s.b ?? 0;
      board.create("functiongraph", [(x: number) => a() * x + b()], {
        strokeColor: c.accent, strokeWidth: 3.5, highlight: false,
      });
      board.create("segment", [[0, b], [1, b]], {
        strokeColor: c.teal, strokeWidth: 2, dash: 2, fixed: true, highlight: false,
      });
      board.create("segment", [[1, b], [1, () => a() + b()]], {
        strokeColor: c.teal, strokeWidth: 2, dash: 2, fixed: true, highlight: false,
      });
      board.create("point", [0, b], {
        fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
      });
      board.create("text", [-1.9, () => b() + (a() >= 0 ? 0.6 : -0.6), () => `(0, ${fmt(b())})`], {
        fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false, cssStyle: `${MONO}; font-weight: 600`,
      });
    },
    readout(s) {
      const a = s.a ?? 1;
      const b = s.b ?? 0;
      const change = a === 0 ? "<span class=\"m\"><i>y</i></span> ไม่เปลี่ยน"
        : `<span class="m"><i>y</i></span> ${a > 0 ? "เพิ่มขึ้น" : "ลดลง"} <span class="m">${fmt(Math.abs(a))}</span>`;
      return `${lineEq(a, b)}<br>ตัดแกน <span class="m"><i>y</i></span> ที่ <span class="m">(0, ${fmt(b)})</span>  <span class="m"><i>x</i></span> เพิ่มขึ้น <span class="m">1</span> แล้ว ${change}`;
    },
  },

  /* ระยะห่างจากบ้านของการปั่นจักรยาน เป็นกิโลเมตร เทียบกับเวลาเป็นนาที */
  "c8-trip": {
    bbox: [-4, 6.3, 70, -0.8],
    steps: [5, 1],
    initial: {},
    draw(board, _s, c) {
      const pts: [number, number][] = [[0, 0], [10, 2], [25, 2], [35, 5], [45, 5], [65, 0]];
      for (let i = 0; i + 1 < pts.length; i++) {
        board.create("segment", [pts[i], pts[i + 1]], {
          strokeColor: c.accent, strokeWidth: 3.5, fixed: true, highlight: false,
        });
      }
      for (const p of pts) {
        board.create("point", p, {
          fixed: true, withLabel: false, size: 4, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
        });
      }
      board.create("text", [62, 0.45, "นาที"], { fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false });
      board.create("text", [1, 6, "ระยะห่างจากบ้าน (กม.)"], { fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false });
    },
  },

  /* แบบฝึกหัด กราฟการเดินไปโรงเรียน ระยะทางเป็นเมตร เวลาเป็นนาที */
  "c8-walk": {
    bbox: [-2, 1620, 23, -150],
    steps: [5, 200],
    initial: {},
    draw(board, _s, c) {
      const pts: [number, number][] = [[0, 0], [10, 800], [15, 800], [20, 1400]];
      for (let i = 0; i + 1 < pts.length; i++) {
        board.create("segment", [pts[i], pts[i + 1]], {
          strokeColor: c.accent, strokeWidth: 3.5, fixed: true, highlight: false,
        });
      }
      for (const p of pts) {
        board.create("point", p, {
          fixed: true, withLabel: false, size: 4, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
        });
      }
      board.create("text", [20.6, 70, "นาที"], { fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false });
      board.create("text", [0.4, 1560, "ระยะทาง (ม.)"], { fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false });
    },
  },

  /* เฉลยข้อวาดกราฟ y = −2x + 4 */
  "c8-sketch-check": {
    bbox: [-2.5, 6.5, 4.5, -3.5],
    initial: {},
    draw(board, _s, c) {
      board.create("functiongraph", [(x: number) => -2 * x + 4], {
        strokeColor: c.accent, strokeWidth: 3.5, highlight: false,
      });
      const pts: [number, number][] = [[0, 4], [1, 2], [2, 0], [3, -2]];
      for (const [x, y] of pts) {
        board.create("point", [x, y], {
          fixed: true, size: 4, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
          name: `(${fmt(x)}, ${fmt(y)})`, withLabel: true,
          label: { offset: [8, 10], fontSize: 12, strokeColor: c.ink, cssStyle: MONO },
        });
      }
    },
  },
};
