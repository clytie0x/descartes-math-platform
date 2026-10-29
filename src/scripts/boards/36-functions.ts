import type { BoardDef } from "./types.ts";

const labels = ["y = 2x + 1", "y = x²", "y = ⌈x⌉", "y = 2ˣ"];
export const boards: Record<string, BoardDef> = {
  "c36-models": {
    bbox: [-3, 7, 5, -3], initial: { model: 0 },
    sliders: [{ key: "model", label: "0 เชิงเส้น 1 กำลังสอง 2 ขั้นบันได 3 เอกซ์โพเนนเชียล", min: 0, max: 3, step: 1 }],
    draw(board, s, c) {
      board.create("functiongraph", [(x: number) => {
        const model = s.model ?? 0;
        // Render step intervals separately so jumps are not joined by vertical segments.
        return model === 0 ? 2 * x + 1 : model === 1 ? x * x : model === 3 ? 2 ** x : Number.NaN;
      }], { strokeColor: c.accent, strokeWidth: 3, highlight: false });
      for (let k = -3; k < 5; k++) {
        board.create("segment", [[k, k + 1], [k + 1, k + 1]], { visible: () => s.model === 2, strokeColor: c.accent, strokeWidth: 3, highlight: false });
        board.create("point", [k, k + 1], { visible: () => s.model === 2, fixed: true, withLabel: false, size: 3, fillColor: c.paper, strokeColor: c.accent, highlight: false });
        board.create("point", [k + 1, k + 1], { visible: () => s.model === 2, fixed: true, withLabel: false, size: 3, fillColor: c.accent, strokeColor: c.accent, highlight: false });
      }
    },
    readout(s) { return `กราฟ <span class="m">${labels[s.model ?? 0]}</span> ขั้นบันไดใช้จุดโปร่งทางซ้ายและจุดทึบทางขวา`; },
  },
};
