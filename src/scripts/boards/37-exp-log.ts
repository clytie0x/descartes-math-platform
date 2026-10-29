import type { BoardDef } from "./types.ts";
function num(n: number): string { return String(Math.round(n * 100) / 100).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c37-base": {
    bbox: [-3, 5, 5, -3], aspect: 1, initial: { a: 2 },
    sliders: [{ key: "a", label: "ฐาน a", min: 0.25, max: 3, step: 0.25 }],
    draw(board, s, c) {
      board.create("functiongraph", [(x: number) => (s.a ?? 2) ** x], { strokeColor: c.accent, strokeWidth: 3, highlight: false });
      board.create("functiongraph", [(x: number) => x > 0 && s.a !== 1 ? Math.log(x) / Math.log(s.a ?? 2) : Number.NaN], { strokeColor: c.teal, strokeWidth: 3, dash: 2, highlight: false });
      board.create("line", [[0, 0], [1, 1]], { strokeColor: c.ink3, dash: 2, strokeWidth: 1, highlight: false });
    },
    readout(s) {
      const a = s.a ?? 2;
      return a === 1 ? "ฐานหนึ่งให้ฟังก์ชันคงตัว จึงไม่มีฟังก์ชันลอการิทึมผกผัน" : `ฐาน <span class="m">a = ${num(a)}</span> สีส้มเป็นเอกซ์โพเนนเชียล เส้นประเขียวเป็นลอการิทึม ทั้งคู่${a > 1 ? "เพิ่ม" : "ลด"}และสะท้อนกันข้ามเส้น <span class="m">y = x</span>`;
    },
  },
};
