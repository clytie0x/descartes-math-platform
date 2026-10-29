/* กราฟของบทที่ 30 ความน่าจะเป็น */

import type { BoardDef } from "./types.ts";

const MAX = 5000; // จำนวนครั้งมากที่สุดที่แถบเลื่อนไปถึง

/* ตัวเลขในข้อความ ปัดทศนิยมสามตำแหน่ง */
function fmt(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}

/* ตัวสุ่มแบบกำหนด seed ได้ (mulberry32) ผลชุดเดิมออกมาเหมือนเดิมทุกครั้งที่เปิดหน้า */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ผลการทดลอง MAX ครั้งของหนึ่งชุด ช่อง roll เปลี่ยนค่าเมื่อไรก็สุ่มชุดใหม่ด้วย seed ถัดไป
   เก็บไว้นอก draw เพราะ readout ต้องเห็นผลชุดเดียวกับกราฟ และวาดใหม่ตอนเปลี่ยนธีมต้องไม่ได้ชุดใหม่ */
function series(base: number, sides: number): (s: Record<string, number>) => Uint8Array {
  let last = 0;
  let round = 0;
  let data: Uint8Array | null = null;
  return (s) => {
    const roll = s.roll ?? 0;
    if (roll !== last) {
      last = roll;
      round++;
      data = null;
    }
    if (!data) {
      const r = rng(base + round * 7919);
      data = new Uint8Array(MAX);
      for (let i = 0; i < MAX; i++) data[i] = Math.floor(r() * sides);
    }
    return data;
  };
}

const coins = series(20261028, 2); // 0 คือหัว 1 คือก้อย
const dice = series(30300, 6); // 0 ถึง 5 คือแต้ม 1 ถึง 6

function count(n: number): number {
  return Math.min(MAX, Math.max(1, Math.round(n)));
}

const MONO = "font-family: 'IBM Plex Mono', monospace";

export const boards: Record<string, BoardDef> = {
  /* โยนเหรียญ n ครั้ง เส้นโค้งคือความถี่สัมพัทธ์ของหัวหลังโยนครบแต่ละครั้ง แกนนอนยืดให้ n ครั้งเต็มความกว้างเสมอ
     พิกัดของกราฟ แกนนอน 0 ถึง 10 แทนครั้งที่ 0 ถึง n แกนตั้ง 0 ถึง 6 แทนความถี่สัมพัทธ์ 0 ถึง 1 */
  "c30-coin": {
    bbox: [-1.6, 6.6, 10.8, -1.15],
    aspect: 1.6,
    axis: false,
    initial: { n: 20, roll: 0 },
    sliders: [
      { key: "n", label: "โยน", min: 10, max: MAX, step: 10 },
      { key: "roll", label: "โยนชุดใหม่", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      const n = (): number => count(s.n ?? 20);
      for (let i = 0; i <= 4; i++) {
        board.create("segment", [[0, i * 1.5], [10, i * 1.5]], {
          strokeColor: i === 0 ? c.ink : c.rule, strokeWidth: i === 0 ? 1.5 : 1, fixed: true, highlight: false,
        });
        board.create("text", [-0.2, i * 1.5, fmt(i / 4)], {
          anchorX: "right", anchorY: "middle", fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false, cssStyle: MONO,
        });
      }
      board.create("segment", [[0, 0], [0, 6]], { strokeColor: c.ink, strokeWidth: 1.5, fixed: true, highlight: false });
      // ความน่าจะเป็นที่ได้หัว 1/2
      board.create("segment", [[0, 3], [10, 3]], {
        strokeColor: c.teal, strokeWidth: 2, dash: 2, fixed: true, highlight: false,
      });
      const ticks: [number, () => string][] = [
        [0, () => "0"],
        [5, () => String(Math.round(n() / 2))],
        [10, () => String(n())],
      ];
      for (const [x, label] of ticks) {
        board.create("text", [x, -0.5, label], {
          anchorX: "middle", anchorY: "middle", fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false, cssStyle: MONO,
        });
      }
      const path = board.create("curve", [[0], [0]], { strokeColor: c.accent, strokeWidth: 2.5, highlight: false });
      path.updateDataArray = function () {
        const data = coins(s);
        const total = n();
        const every = Math.max(1, Math.floor(total / 1000)); // จุดบนเส้นไม่เกินราวพันจุด
        const xs: number[] = [];
        const ys: number[] = [];
        let heads = 0;
        for (let i = 1; i <= total; i++) {
          if (data[i - 1] === 0) heads++;
          if (i % every === 0 || i === total) {
            xs.push((i / total) * 10);
            ys.push((heads / i) * 6);
          }
        }
        this.dataX = xs;
        this.dataY = ys;
      };
    },
    readout(s) {
      const data = coins(s);
      const n = count(s.n ?? 20);
      let heads = 0;
      for (let i = 0; i < n; i++) if (data[i] === 0) heads++;
      const f = heads / n;
      return `โยน <span class="m">${n}</span> ครั้ง ออกหัว <span class="m">${heads}</span> ครั้ง ความถี่สัมพัทธ์ของหัว <span class="m">${heads}/${n} ≈ ${fmt(f)}</span><br>ห่างจากความน่าจะเป็น <span class="m">0.5</span> อยู่ <span class="m">${fmt(Math.abs(f - 0.5))}</span>`;
    },
  },

  /* ทอยลูกเต๋า n ครั้ง แท่งคือความถี่สัมพัทธ์ของแต้ม 1 ถึง 6 เส้นประคือ 1/6
     พิกัดของกราฟ แกนตั้ง 0 ถึง 4 แทนความถี่สัมพัทธ์ 0 ถึง 0.5 แท่งที่เกิน 0.5 ตัดไว้ที่ขอบบน */
  "c30-die": {
    bbox: [-0.6, 4.3, 7, -0.45],
    aspect: 1.6,
    axis: false,
    initial: { n: 30, roll: 0 },
    sliders: [
      { key: "n", label: "ทอย", min: 10, max: MAX, step: 10 },
      { key: "roll", label: "ทอยชุดใหม่", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      const n = (): number => count(s.n ?? 30);
      let seenData: Uint8Array | null = null;
      let seenN = 0;
      let freq: number[] = [0, 0, 0, 0, 0, 0];
      const rel = (face: number): number => {
        const data = dice(s);
        if (data !== seenData || n() !== seenN) {
          seenData = data;
          seenN = n();
          const counts = [0, 0, 0, 0, 0, 0];
          for (let i = 0; i < n(); i++) {
            const d = data[i] ?? 0;
            counts[d] = (counts[d] ?? 0) + 1;
          }
          freq = counts.map((k) => k / n());
        }
        return freq[face] ?? 0;
      };
      const y = (f: number): number => Math.min(f, 0.5) * 8;
      for (let i = 0; i <= 5; i++) {
        board.create("segment", [[0.4, i * 0.8], [6.7, i * 0.8]], {
          strokeColor: i === 0 ? c.ink : c.rule, strokeWidth: i === 0 ? 1.5 : 1, fixed: true, highlight: false,
        });
        board.create("text", [0.3, i * 0.8, fmt(i / 10)], {
          anchorX: "right", anchorY: "middle", fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false, cssStyle: MONO,
        });
      }
      for (let face = 0; face < 6; face++) {
        const x = face + 1;
        board.create("polygon", [[x - 0.3, 0], [x + 0.3, 0], [x + 0.3, () => y(rel(face))], [x - 0.3, () => y(rel(face))]], {
          fillColor: c.accent, fillOpacity: 0.25, highlight: false, fixed: true, vertices: { visible: false },
          borders: { strokeColor: c.accent, strokeWidth: 2, highlight: false },
        });
        board.create("text", [x, () => y(rel(face)) + 0.2, () => String(Math.round(rel(face) * 100) / 100)], {
          anchorX: "middle", anchorY: "middle", fontSize: 11, strokeColor: c.ink, fixed: true, highlight: false, cssStyle: MONO,
        });
        board.create("text", [x, -0.22, String(x)], {
          anchorX: "middle", anchorY: "middle", fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false,
        });
      }
      // ความน่าจะเป็นของแต่ละแต้ม 1/6
      board.create("segment", [[0.4, 8 / 6], [6.7, 8 / 6]], {
        strokeColor: c.teal, strokeWidth: 2, dash: 2, fixed: true, highlight: false,
      });
    },
    readout(s) {
      const data = dice(s);
      const n = count(s.n ?? 30);
      const counts = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < n; i++) {
        const d = data[i] ?? 0;
        counts[d] = (counts[d] ?? 0) + 1;
      }
      const far = Math.max(...counts.map((k) => Math.abs(k / n - 1 / 6)));
      return `ทอย <span class="m">${n}</span> ครั้ง ได้แต้ม 1 ถึง 6 จำนวน <span class="m">${counts.join("  ")}</span> ครั้ง<br>ความถี่สัมพัทธ์ที่ห่างจาก <span class="m">1/6 ≈ 0.167</span> มากที่สุดห่างอยู่ <span class="m">${fmt(far)}</span>`;
    },
  },
};
