import type { BoardDef } from "./types.ts";
function num(n: number): string { return String(Math.round(n * 100) / 100).replace("-", "−"); }

/* เศษส่วนของ π จากจำนวนเต็ม p/q เช่น piFrac(-2, 6) ได้ −π/3 */
function piFrac(p: number, q: number): string {
  if (p === 0) return "0";
  const g = (x: number, y: number): number => (y === 0 ? x : g(y, x % y));
  const d = g(Math.abs(p), Math.abs(q));
  let n = p / d, m = q / d;
  if (m < 0) { n = -n; m = -m; }
  const sign = n < 0 ? "−" : "";
  const top = Math.abs(n) === 1 ? "π" : `${Math.abs(n)}π`;
  return m === 1 ? `${sign}${top}` : `${sign}${top}/${m}`;
}

const LABEL_CSS = "font-family: KaTeX_Math, 'Times New Roman', serif; font-style: italic";

export const boards: Record<string, BoardDef> = {
  "c39-circle-sine": {
    bbox: [-1.6, 1.6, 8.6, -1.6], aspect: 10.2 / 3.2, initial: { angle: 60 },
    sliders: [{ key: "angle", label: "มุม θ องศา", min: 0, max: 360, step: 5 }],
    draw(board, s, c) {
      const theta = (): number => (s.angle ?? 60) * Math.PI / 180;
      board.create("circle", [[0, 0], 1], { strokeColor: c.ink3, strokeWidth: 1.5, fillOpacity: 0, highlight: false });
      const p = board.create("point", [() => Math.cos(theta()), () => Math.sin(theta())], { fixed: true, withLabel: false, size: 4, fillColor: c.accent, strokeColor: c.accent, highlight: false });
      board.create("segment", [[0, 0], p], { strokeColor: c.accent, strokeWidth: 2, highlight: false });
      board.create("functiongraph", [(x: number) => Math.sin(x - 2), 2, 2 + 2 * Math.PI], { strokeColor: c.teal, strokeWidth: 2, highlight: false });
      const q = board.create("point", [() => 2 + theta(), () => Math.sin(theta())], { fixed: true, withLabel: false, size: 4, fillColor: c.accent, strokeColor: c.accent, highlight: false });
      board.create("segment", [p, q], { strokeColor: c.teal, dash: 2, strokeWidth: 1, highlight: false });
    },
    readout(s) {
      const degree = s.angle ?? 60, rad = degree * Math.PI / 180;
      return `<span class="m">θ = ${degree}° = ${num(rad)}</span> เรเดียน จุดวงกลม <span class="m">(${num(Math.cos(rad))}, ${num(Math.sin(rad))})</span> ความสูงเดียวกันเป็นค่าไซน์บนกราฟทางขวา แกนนอนของกราฟเลื่อนไว้สองหน่วยเพื่อแยกภาพ`;
    },
  },

  /* y = a sin(bx + c) + d ปรับทีละพารามิเตอร์ เทียบกับ y = sin x เส้นประ ค่า c เก็บเป็นจำนวนเท่าของ π/6 */
  "c39-sine-params": {
    bbox: [-4, 5.5, 10, -5.5], aspect: 14 / 11,
    initial: { a: 2, b: 1, c6: 0, d: 0 },
    sliders: [
      { key: "a", label: "<i>a</i>", min: -3, max: 3, step: 0.5 },
      { key: "b", label: "<i>b</i>", min: 0.5, max: 3, step: 0.5 },
      { key: "c6", label: "<i>c</i> เป็นจำนวนเท่าของ π/6", min: -6, max: 6, step: 1 },
      { key: "d", label: "<i>d</i>", min: -2, max: 2, step: 0.5 },
    ],
    draw(board, s, c) {
      const a = (): number => s.a ?? 2, b = (): number => s.b ?? 1;
      const cc = (): number => (s.c6 ?? 0) * Math.PI / 6, d = (): number => s.d ?? 0;
      board.create("functiongraph", [(x: number) => Math.sin(x)], { strokeColor: c.teal, strokeWidth: 1.5, dash: 2, highlight: false });
      board.create("functiongraph", [() => d()], { strokeColor: c.violet, strokeWidth: 1.5, dash: 3, highlight: false });
      board.create("functiongraph", [(x: number) => a() * Math.sin(b() * x + cc()) + d()], { strokeColor: c.accent, strokeWidth: 3, highlight: false });
      board.create("point", [() => -cc() / b(), () => d()], { fixed: true, withLabel: false, size: 4, fillColor: c.accent, strokeColor: c.ink, highlight: false });
    },
    readout(s) {
      const a = s.a ?? 2, b = s.b ?? 1, c6 = s.c6 ?? 0, d = s.d ?? 0;
      if (a === 0) return `<span class="m"><i>a</i> = 0</span> กราฟเหลือเส้นตรง <span class="m"><i>y</i> = ${num(d)}</span> ไม่ขึ้นลงเลย`;
      const m = Math.round(b * 2); // b = m/2
      const period = piFrac(4, m);
      const shift = piFrac(-c6 * 2, 6 * m); // −c/b = −(c6·π/6)/(m/2)
      const amp = Math.abs(a);
      const inner = `${b === 1 ? "" : num(b)}<i>x</i>${c6 === 0 ? "" : ` ${c6 > 0 ? "+" : "−"} ${piFrac(Math.abs(c6), 6)}`}`;
      const tail = d === 0 ? "" : ` ${d > 0 ? "+" : "−"} ${num(Math.abs(d))}`;
      const front = a === 1 ? "" : a === -1 ? "−" : `${num(a)} `;
      return `<span class="m"><i>y</i> = ${front}sin(${inner})${tail}</span> แอมพลิจูด <span class="m">${num(amp)}</span> คาบ <span class="m">${period}</span> จุดเริ่มรอบ (จุดส้ม) อยู่ที่ <span class="m"><i>x</i> = ${shift}</span> เส้นกึ่งกลาง <span class="m"><i>y</i> = ${num(d)}</span> เรนจ์ <span class="m">[${num(d - amp)}, ${num(d + amp)}]</span>`;
    },
  },

  /* กรณีคลุมเครือ ด.ด.ม. ให้มุม A ด้าน b = 6 และด้าน a ที่อยู่ตรงข้ามมุม A วงกลมรัศมี a รอบ C ตัดฐานได้ศูนย์ หนึ่ง หรือสองจุด */
  "c39-ssa": {
    bbox: [-1, 7.5, 15.5, -1.5], aspect: 16.5 / 9, axis: false,
    initial: { A: 30, a: 4 },
    sliders: [
      { key: "A", label: "มุม <i>A</i> องศา", min: 20, max: 80, step: 5 },
      { key: "a", label: "ด้าน <i>a</i>", min: 1, max: 9, step: 0.5 },
    ],
    draw(board, s, c) {
      const side = 6;
      const base = { fixed: true, highlight: false };
      const C = (): [number, number] => {
        const r = (s.A ?? 30) * Math.PI / 180;
        return [side * Math.cos(r), side * Math.sin(r)];
      };
      const disc = (): number => (s.a ?? 4) ** 2 - C()[1] ** 2;
      const far = (): number => (disc() < -1e-9 ? Number.NaN : C()[0] + Math.sqrt(Math.max(disc(), 0)));
      const near = (): number => {
        const x = C()[0] - Math.sqrt(Math.max(disc(), 0));
        return disc() > 1e-9 && x > 1e-9 ? x : Number.NaN;
      };
      const label = (name: string, offset: [number, number]) => ({
        name, withLabel: true, label: { offset, fontSize: 17, strokeColor: c.ink, cssStyle: LABEL_CSS },
      });
      board.create("segment", [[0, 0], [15, 0]], { ...base, strokeColor: c.ink3, strokeWidth: 1.5 });
      board.create("circle", [[() => C()[0], () => C()[1]], () => s.a ?? 4], { ...base, strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fillOpacity: 0 });
      board.create("segment", [[() => C()[0], () => C()[1]], [() => C()[0], 0]], { ...base, strokeColor: c.ink3, strokeWidth: 1, dash: 3 });
      board.create("segment", [[0, 0], [() => C()[0], () => C()[1]]], { ...base, strokeColor: c.ink, strokeWidth: 2.5 });
      board.create("segment", [[() => C()[0], () => C()[1]], [() => far(), 0]], { ...base, strokeColor: c.accent, strokeWidth: 3, visible: () => !Number.isNaN(far()) });
      board.create("segment", [[() => C()[0], () => C()[1]], [() => near(), 0]], { ...base, strokeColor: c.violet, strokeWidth: 3, visible: () => !Number.isNaN(near()) });
      board.create("point", [0, 0], { ...base, size: 3.5, fillColor: c.ink, strokeColor: c.paper, ...label("A", [-14, -12]) });
      board.create("point", [() => C()[0], () => C()[1]], { ...base, size: 3.5, fillColor: c.ink, strokeColor: c.paper, ...label("C", [-6, 14]) });
      board.create("point", [() => far(), 0], { ...base, size: 4, fillColor: c.accent, strokeColor: c.paper, visible: () => !Number.isNaN(far()), ...label("B", [4, -14]) });
      board.create("point", [() => near(), 0], { ...base, size: 4, fillColor: c.violet, strokeColor: c.paper, visible: () => !Number.isNaN(near()), ...label("B′", [-18, -14]) });
    },
    readout(s) {
      const A = s.A ?? 30, a = s.a ?? 4, side = 6;
      const h = side * Math.sin(A * Math.PI / 180);
      const head = `<span class="m"><i>b</i> = 6</span> ความสูงจาก C ถึงฐาน <span class="m"><i>h</i> = <i>b</i> sin <i>A</i> ≈ ${num(h)}</span>`;
      if (a < h - 1e-9) return `${head} ด้าน <span class="m"><i>a</i> = ${num(a)}</span> สั้นกว่าความสูง ยื่นไม่ถึงฐาน ไม่มีสามเหลี่ยม`;
      const B = Math.asin(Math.min(1, side * Math.sin(A * Math.PI / 180) / a)) * 180 / Math.PI;
      if (Math.abs(a - h) < 1e-9) return `${head} ด้าน <span class="m"><i>a</i></span> เท่ากับความสูงพอดี ได้สามเหลี่ยมมุมฉากรูปเดียว <span class="m"><i>B</i> = 90°</span>`;
      if (a < side) return `${head} ด้าน <span class="m"><i>a</i> = ${num(a)}</span> อยู่ระหว่าง <span class="m"><i>h</i></span> กับ <span class="m"><i>b</i></span> ได้สองรูป <span class="m"><i>B</i> ≈ ${num(B)}°</span> (ส้ม) หรือ <span class="m"><i>B</i> ≈ ${num(180 - B)}°</span> (ม่วง)`;
      return `${head} ด้าน <span class="m"><i>a</i> = ${num(a)} ≥ <i>b</i></span> จุดตัดอีกจุดอยู่หลัง A ได้สามเหลี่ยมรูปเดียว <span class="m"><i>B</i> ≈ ${num(B)}°</span>`;
    },
  },
};
