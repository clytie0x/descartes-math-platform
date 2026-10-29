/* กราฟของบทที่ 16 สถิติ (2) */

import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ปัดทศนิยมสองตำแหน่ง */
function fmt(n: number): string {
  return String(Math.round(n * 100) / 100);
}

const MONO = "font-family: 'IBM Plex Mono', monospace";

/* ส่วนสูงของนักเรียน ม.2 จำนวน 40 คน (เซนติเมตร) ชุดเดียวกับหน้า 16.3 */
const HEIGHTS = [
  151, 148, 145, 143, 152, 147, 155, 153, 154, 164, 158, 165, 152, 144, 154, 167, 157, 172, 160, 146,
  151, 163, 150, 162, 161, 156, 148, 149, 157, 156, 159, 164, 141, 159, 153, 158, 155, 169, 161, 157,
];
const START = 140; // ขีดจำกัดล่างของชั้นแรก ทุกความกว้าง
const BAR_H = 10; // ความสูงของพื้นที่วาดแท่งในพิกัดของกราฟ
const MAX_CLASSES = 33; // ความกว้าง 1 ได้ 140 ถึง 172 คือ 33 ชั้น

interface Table {
  w: number;
  freq: number[];
  top: number; // ค่าบนสุดของแกนตั้ง ปัดขึ้นเป็นพหุคูณของ 5
}

const tables = new Map<number, Table>();

function table(width: number): Table {
  const w = Math.max(1, Math.round(width));
  const hit = tables.get(w);
  if (hit) return hit;
  const max = Math.max(...HEIGHTS);
  const k = Math.ceil((max - START + 1) / w);
  const freq = Array.from({ length: k }, (_, i) =>
    HEIGHTS.filter((v) => v >= START + i * w && v <= START + (i + 1) * w - 1).length);
  const top = Math.ceil(Math.max(...freq) / 5) * 5;
  const t = { w, freq, top };
  tables.set(w, t);
  return t;
}

/* ขอบล่างของชั้นที่ i ตามแบบ สสวท. คือขีดจำกัดล่างลบครึ่ง */
function edge(t: Table, i: number): number {
  return START - 0.5 + i * t.w;
}

function barY(t: Table, f: number): number {
  return (f / t.top) * BAR_H;
}

function className(t: Table, i: number): string {
  const lo = START + i * t.w;
  const hi = lo + t.w - 1;
  return t.w === 1 ? `${lo}` : `${lo} ถึง ${hi}`;
}

/* เวลาเดินทางมาโรงเรียนของนักเรียน 10 คน (นาที) อีกคนหนึ่งเลื่อนค่าได้ */
const TRAVEL = [10, 10, 15, 15, 15, 20, 20, 20, 25, 30];

function median(xs: number[]): number {
  const s = [...xs].sort((p, q) => p - q);
  const n = s.length;
  const mid = Math.floor(n / 2);
  return n % 2 === 1 ? (s[mid] ?? 0) : ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

function mean(xs: number[]): number {
  return xs.reduce((p, q) => p + q, 0) / xs.length;
}

export const boards: Record<string, BoardDef> = {
  /* ฮิสโทแกรมของส่วนสูง 40 คน เปลี่ยนความกว้างของอันตรภาคชั้นได้ ติ๊กเพื่อดูรูปหลายเหลี่ยมของความถี่ */
  "c16-histogram-width": {
    bbox: [129, 12.6, 186, -3.2],
    axis: false,
    initial: { w: 5, poly: 0 },
    sliders: [
      { key: "w", label: "ความกว้าง", min: 1, max: 10, step: 1 },
      { key: "poly", label: "รูปหลายเหลี่ยมของความถี่", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      const t = (): Table => table(s.w ?? 5);

      // เส้นตารางแนวนอนกับตัวเลขบนแกนตั้ง ตัวเลขเปลี่ยนตามความถี่สูงสุด
      for (let i = 1; i <= 5; i++) {
        board.create("segment", [[134, (i * BAR_H) / 5], [185, (i * BAR_H) / 5]], {
          strokeColor: c.rule, strokeWidth: 1, fixed: true, highlight: false,
        });
        board.create("text", [133.2, (i * BAR_H) / 5, () => String((t().top * i) / 5)], {
          anchorX: "right", anchorY: "middle", fontSize: 11, strokeColor: c.ink3, fixed: true, highlight: false,
          cssStyle: MONO,
        });
      }
      board.create("text", [134, 11.9, "จำนวนคน"], {
        anchorX: "left", anchorY: "middle", fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false,
      });

      // แท่งทั้งหมดเป็นเส้นขอบรูปขั้นบันไดเส้นเดียว ระบายสีข้างใน
      const bars = board.create("curve", [[0], [0]], {
        strokeColor: c.accent, strokeWidth: 2, fillColor: c.accent, fillOpacity: 0.25, highlight: false,
      });
      bars.updateDataArray = function () {
        const tb = t();
        const xs: number[] = [edge(tb, 0)];
        const ys: number[] = [0];
        tb.freq.forEach((f, i) => {
          xs.push(edge(tb, i), edge(tb, i + 1));
          ys.push(barY(tb, f), barY(tb, f));
        });
        xs.push(edge(tb, tb.freq.length), edge(tb, 0));
        ys.push(0, 0);
        this.dataX = xs;
        this.dataY = ys;
      };

      // เส้นแบ่งระหว่างแท่งที่ติดกัน คั่นแต่ละเส้นด้วย NaN
      const dividers = board.create("curve", [[0], [0]], {
        strokeColor: c.accent, strokeWidth: 1.5, highlight: false,
      });
      dividers.updateDataArray = function () {
        const tb = t();
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 1; i < tb.freq.length; i++) {
          const h = Math.max(barY(tb, tb.freq[i - 1] ?? 0), barY(tb, tb.freq[i] ?? 0));
          xs.push(edge(tb, i), edge(tb, i), Number.NaN);
          ys.push(0, h, Number.NaN);
        }
        this.dataX = xs;
        this.dataY = ys;
      };

      // รูปหลายเหลี่ยมของความถี่ ต่อจุดกึ่งกลางยอดแท่ง แล้วลงมาที่แกนนอนตรงจุดกึ่งกลางของชั้นว่างทั้งสองข้าง
      const poly = board.create("curve", [[0], [0]], {
        strokeColor: c.teal, strokeWidth: 2.5, highlight: false,
      });
      poly.updateDataArray = function () {
        if ((s.poly ?? 0) <= 0) {
          this.dataX = [];
          this.dataY = [];
          return;
        }
        const tb = t();
        const half = tb.w / 2;
        const xs: number[] = [edge(tb, 0) - half];
        const ys: number[] = [0];
        tb.freq.forEach((f, i) => {
          xs.push(edge(tb, i) + half);
          ys.push(barY(tb, f));
        });
        xs.push(edge(tb, tb.freq.length) + half);
        ys.push(0);
        this.dataX = xs;
        this.dataY = ys;
      };

      // ความถี่บนยอดแท่ง แสดงเมื่อแท่งกว้างพอ ชั้นที่ไม่มีอยู่ใช้ NaN ซ่อนไว้
      for (let i = 0; i < MAX_CLASSES; i++) {
        board.create("text", [
          () => (i < t().freq.length ? edge(t(), i) + t().w / 2 : Number.NaN),
          () => barY(t(), t().freq[i] ?? 0) + 0.6,
          () => {
            const f = t().freq[i] ?? 0;
            return t().w >= 3 && f > 0 ? String(f) : "";
          },
        ], {
          anchorX: "middle", anchorY: "middle", fontSize: 12, strokeColor: c.ink, fixed: true, highlight: false,
          cssStyle: `${MONO}; font-weight: 600`,
        });
      }

      // แกนนอน แกนตั้ง ขีดทุก 5 เซนติเมตร และตัวเลขทุก 10 เซนติเมตร
      board.create("segment", [[134, 0], [185, 0]], { strokeColor: c.ink, strokeWidth: 1.5, fixed: true, highlight: false });
      board.create("segment", [[134, 0], [134, 11]], { strokeColor: c.ink, strokeWidth: 1.5, fixed: true, highlight: false });
      for (let x = 140; x <= 185; x += 5) {
        board.create("segment", [[x, 0], [x, -0.3]], { strokeColor: c.ink, strokeWidth: 1, fixed: true, highlight: false });
        if (x % 10 === 0) {
          board.create("text", [x, -0.95, String(x)], {
            anchorX: "middle", anchorY: "middle", fontSize: 11, strokeColor: c.ink3, fixed: true, highlight: false,
            cssStyle: MONO,
          });
        }
      }
      board.create("text", [160, -2.3, "ส่วนสูง (เซนติเมตร)"], {
        anchorX: "middle", anchorY: "middle", fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false,
      });
    },
    readout(s) {
      const t = table(s.w ?? 5);
      const k = t.freq.length;
      const most = Math.max(...t.freq);
      const tops = t.freq.flatMap((f, i) => (f === most ? [className(t, i)] : []));
      const where = tops.length === 1
        ? `ชั้นที่มีความถี่มากที่สุดคือ ${tops[0]} มี <span class="m">${most}</span> คน`
        : `มี ${tops.length} ชั้นที่มีความถี่มากที่สุดเท่ากัน คือ ${tops.join(" และ ")} ชั้นละ <span class="m">${most}</span> คน`;
      const look = t.w <= 2
        ? "แท่งเตี้ยและขึ้นลงสลับกันไปมา มองรูปร่างรวมของข้อมูลได้ยาก"
        : t.w >= 9
          ? "เหลือไม่กี่แท่ง ข้อมูลถูกรวมกองจนรายละเอียดหายไปมาก"
          : "เห็นรูปร่างชัด ข้อมูลกองสูงตรงกลางแล้วลดลงทั้งสองข้าง";
      return `ความกว้างของชั้น <span class="m">${t.w}</span> เซนติเมตร ได้ <span class="m">${k}</span> ชั้น ${where}<br>${look}`;
    },
  },

  /* แผนภาพจุดของเวลาเดินทาง 11 คน เลื่อนค่าของคนหนึ่งคนแล้วดูว่าค่าเฉลี่ยกับมัธยฐานขยับต่างกันแค่ไหน */
  "c16-dot-move": {
    bbox: [-6, 7.6, 96, -2.6],
    axis: false,
    aspect: 2,
    initial: { v: 25 },
    sliders: [{ key: "v", label: "จุดสีส้ม", min: 5, max: 90, step: 5 }],
    draw(board, s, c) {
      const v = (): number => s.v ?? 25;
      const all = (): number[] => [...TRAVEL, v()];

      board.create("segment", [[-3, 0], [93, 0]], { strokeColor: c.ink, strokeWidth: 1.5, fixed: true, highlight: false });
      for (let x = 0; x <= 90; x += 5) {
        board.create("segment", [[x, 0], [x, -0.3]], { strokeColor: c.ink, strokeWidth: 1, fixed: true, highlight: false });
        if (x % 10 === 0) {
          board.create("text", [x, -0.95, String(x)], {
            anchorX: "middle", anchorY: "middle", fontSize: 11, strokeColor: c.ink3, fixed: true, highlight: false,
            cssStyle: MONO,
          });
        }
      }
      board.create("text", [45, -2, "เวลาเดินทางมาโรงเรียน (นาที)"], {
        anchorX: "middle", anchorY: "middle", fontSize: 12, strokeColor: c.ink3, fixed: true, highlight: false,
      });

      // ค่าเฉลี่ยกับมัธยฐาน เส้นประคนละสี ป้ายอยู่คนละระดับจะได้ไม่ทับกัน
      const m = (): number => mean(all());
      const md = (): number => median(all());
      board.create("segment", [[m, 0], [m, 5]], { strokeColor: c.teal, strokeWidth: 2, dash: 2, fixed: true, highlight: false });
      board.create("text", [m, 5.55, "ค่าเฉลี่ย"], {
        anchorX: "middle", anchorY: "middle", fontSize: 12, strokeColor: c.teal, fixed: true, highlight: false,
        cssStyle: "font-weight: 600",
      });
      board.create("segment", [[md, 0], [md, 6.3]], { strokeColor: c.violet, strokeWidth: 2, dash: 2, fixed: true, highlight: false });
      board.create("text", [md, 6.85, "มัธยฐาน"], {
        anchorX: "middle", anchorY: "middle", fontSize: 12, strokeColor: c.violet, fixed: true, highlight: false,
        cssStyle: "font-weight: 600",
      });

      // จุดของข้อมูล ค่าเท่ากันวางซ้อนขึ้นไปทีละชั้น
      TRAVEL.forEach((x, i) => {
        const row = TRAVEL.slice(0, i).filter((u) => u === x).length;
        board.create("point", [x, 1 + row], {
          fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 1.5, highlight: false,
        });
      });
      board.create("point", [v, () => 1 + TRAVEL.filter((u) => u === v()).length], {
        fixed: true, withLabel: false, size: 6, fillColor: c.accent, strokeColor: c.ink, strokeWidth: 2, highlight: false,
      });
    },
    readout(s) {
      const v = s.v ?? 25;
      const all = [...TRAVEL, v];
      const m = mean(all);
      const md = median(all);
      const above = all.filter((u) => u > m).length;
      const note = v >= 50
        ? "<br>จุดสีส้มอยู่ไกลจากกลุ่ม ค่าเฉลี่ยถูกดึงตามไป แต่มัธยฐานยังอยู่ที่เดิม"
        : "";
      return `จุดสีส้ม <span class="m">${v}</span> นาที  ค่าเฉลี่ย <span class="m">${fmt(m)}</span>  มัธยฐาน <span class="m">${fmt(md)}</span><br>มีคนใช้เวลามากกว่าค่าเฉลี่ย <span class="m">${above}</span> จาก <span class="m">11</span> คน${note}`;
    },
  },
};
