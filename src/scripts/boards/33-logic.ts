import type { BoardDef } from "./types.ts";

export const boards: Record<string, BoardDef> = {
  "c33-truth": {
    bbox: [0, 4, 8, 0], aspect: 2, axis: false,
    initial: { p: 1, q: 0 },
    sliders: [
      { key: "p", label: "p เป็นจริง", min: 0, max: 1, step: 1, toggle: true },
      { key: "q", label: "q เป็นจริง", min: 0, max: 1, step: 1, toggle: true },
    ],
    draw(board, s, c) {
      const truth = (v: boolean): string => v ? "T" : "F";
      const rows: [string, () => boolean][] = [
        ["p ∧ q", () => !!s.p && !!s.q],
        ["p ∨ q", () => !!s.p || !!s.q],
        ["p → q", () => !s.p || !!s.q],
        ["p ↔ q", () => !!s.p === !!s.q],
      ];
      rows.forEach(([label, value], i) => {
        board.create("text", [1, 3.3 - i * 0.8, label], { fixed: true, strokeColor: c.ink, fontSize: 20 });
        board.create("text", [5.5, 3.3 - i * 0.8, () => truth(value())], { fixed: true, strokeColor: c.accent, fontSize: 22 });
      });
    },
    readout(s) {
      return `<span class="m">p = ${s.p ? "T" : "F"}, q = ${s.q ? "T" : "F"}</span> ลองให้เหตุจริงแต่ผลเท็จ แล้วสังเกตลูกศร`;
    },
  },
};
