import type { BoardDef } from "./types.ts";
function num(n: number): string { return String(Math.round(n * 100) / 100).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c38-ellipse": {
    bbox: [-5, 4, 5, -4], aspect: 1.25, initial: { c: 2 },
    sliders: [{ key: "c", label: "ระยะโฟกัสจากศูนย์กลาง c", min: 0, max: 3.5, step: 0.25 }],
    draw(board, s, c) {
      const focus = (): number => s.c ?? 2;
      const b = (): number => Math.sqrt(16 - focus() ** 2);
      board.create("curve", [(t: number) => 4 * Math.cos(t), (t: number) => b() * Math.sin(t), 0, 2 * Math.PI], { strokeColor: c.accent, strokeWidth: 3, highlight: false });
      for (const sign of [-1, 1]) {
        board.create("point", [() => sign * focus(), 0], { fixed: true, size: 4, withLabel: false, fillColor: c.teal, strokeColor: c.teal, highlight: false });
      }
    },
    readout(s) {
      const f = s.c ?? 2, b = Math.sqrt(16 - f * f);
      return `<span class="m">a = 4, c = ${num(f)}, b = ${num(b)}</span> ขยับโฟกัสออกจากศูนย์กลาง วงรีแบนลง แต่ผลบวกระยะถึงโฟกัสยังเป็น <span class="m">2a = 8</span> เมื่อโฟกัสตรงกันได้วงกลม`;
    },
  },
  "c38-parabola": {
    bbox: [-6, 7, 6, -2], initial: { p: 1, t: 2 },
    sliders: [
      { key: "p", label: "ระยะจุดยอดถึงโฟกัส <i>p</i>", min: 0.5, max: 2, step: 0.25 },
      { key: "t", label: "พิกัด <i>x</i> ของจุด <i>P</i>", min: -5, max: 5, step: 0.5 },
    ],
    draw(board, s, c) {
      const p = (): number => s.p ?? 1;
      const t = (): number => s.t ?? 2;
      const py = (): number => t() ** 2 / (4 * p());
      board.create("functiongraph", [(x: number) => (x * x) / (4 * p())], { strokeColor: c.accent, strokeWidth: 3, highlight: false });
      board.create("functiongraph", [() => -p()], { strokeColor: c.ink3, strokeWidth: 2, dash: 2, highlight: false });
      const style = { fixed: true, size: 4, withLabel: false, highlight: false };
      const F = board.create("point", [0, () => p()], { ...style, fillColor: c.ink, strokeColor: c.ink });
      const P = board.create("point", [() => t(), () => py()], { ...style, fillColor: c.accent, strokeColor: c.accent });
      const D = board.create("point", [() => t(), () => -p()], { ...style, size: 3, fillColor: c.ink3, strokeColor: c.ink3 });
      board.create("segment", [P, F], { strokeColor: c.teal, strokeWidth: 2.5, fixed: true, highlight: false });
      board.create("segment", [P, D], { strokeColor: c.violet, strokeWidth: 2.5, dash: 2, fixed: true, highlight: false });
    },
    readout(s) {
      const p = s.p ?? 1, t = s.t ?? 2, y = (t * t) / (4 * p);
      const pf = Math.sqrt(t * t + (y - p) ** 2), pd = y + p;
      return `<span class="m">x² = ${num(4 * p)}y</span> โฟกัส <span class="m">(0, ${num(p)})</span> ไดเรกตริกซ์ <span class="m">y = ${num(-p)}</span> ระยะ <span class="m">PF = ${num(pf)}</span> เท่ากับระยะถึงไดเรกตริกซ์ <span class="m">${num(pd)}</span>`;
    },
  },
};
