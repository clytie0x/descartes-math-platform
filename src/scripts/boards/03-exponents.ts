/* กราฟของบทที่ 3 เลขยกกำลัง */

import type JXG from "jsxgraph";
import type { BoardDef } from "./types.ts";

/* จำนวนเต็มมีจุลภาคคั่นหลักพัน */
function grouped(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export const boards: Record<string, BoardDef> = {
  /* แท่งสูง 2ⁿ เทียบกับเส้นประ 2 × n ดูว่าการคูณด้วย 2 ซ้ำๆ โตเร็วกว่าการบวก 2 ซ้ำๆ แค่ไหน */
  "c3-doubling": {
    bbox: [-0.6, 20, 10.9, -1.6],
    steps: [1, 2],
    initial: { n: 4 },
    sliders: [{ key: "n", label: "<i>n</i>", min: 1, max: 10, step: 1 }],
    draw(board, s, c) {
      const n = (): number => s.n ?? 4;
      const ceiling = (): number => Math.max(8, 1.25 * 2 ** n());
      let scaledN = Number.NaN;
      const rescale = (): void => {
        if (scaledN === n()) return;
        scaledN = n();
        const axis = board.defaultAxes.y as unknown as JXG.Axis;
        axis.defaultTicks.setAttribute({ ticksDistance: Math.max(1, 2 ** (n() - 3)) });
        board.setBoundingBox([-0.6, ceiling(), 10.9, -0.08 * ceiling()], false);
      };
      board.on("update", rescale);
      const top = (k: number) => (): number => (k <= n() ? 2 ** k : 0);
      const hide = { visible: false, fixed: true, withLabel: false };
      for (let k = 1; k <= 10; k++) {
        const pts = [
          board.create("point", [k - 0.35, 0], hide),
          board.create("point", [k + 0.35, 0], hide),
          board.create("point", [k + 0.35, top(k)], hide),
          board.create("point", [k - 0.35, top(k)], hide),
        ];
        board.create("polygon", pts, {
          fillColor: c.accent, fillOpacity: 0.55, highlight: false, fixed: true,
          borders: { strokeColor: c.accent, strokeWidth: 1.5, highlight: false },
          vertices: { visible: false },
        });
      }
      board.create("functiongraph", [(x: number) => 2 * x, 0, 10.6], {
        strokeColor: c.teal, strokeWidth: 2, dash: 2, highlight: false,
      });
      board.create("text", [() => n() - 0.45, () => 2 ** n() + 0.04 * ceiling(), () => grouped(2 ** n())], {
        fontSize: 14, strokeColor: c.ink, fixed: true, highlight: false,
        cssStyle: "font-family: 'IBM Plex Mono', monospace; font-weight: 600",
      });
      rescale();
    },
    readout(s) {
      const n = s.n ?? 4;
      return `คูณ 2 ซ้ำ <span class="m">${n}</span> ครั้ง ได้ <span class="m">2<sup>${n}</sup> = ${grouped(2 ** n)}</span>  บวก 2 ซ้ำ <span class="m">${n}</span> ครั้ง ได้ <span class="m">2 × ${n} = ${2 * n}</span>`;
    },
  },
};
