/* กราฟของบทที่ 11 ความรู้เบื้องต้นเกี่ยวกับจำนวนจริง เส้นจำนวนที่ขยายดู √n ทีละขั้น */

import type { BoardDef } from "./types.ts";

/* ซ่อนของด้วยการย้ายออกไปนอกกรอบ */
const OFF = -100;
/* ความสูงของเส้นจำนวนสามเส้น บนสุดเป็นจำนวนเต็ม ถัดลงมาเป็นทศนิยมหนึ่งตำแหน่ง ล่างสุดเป็นสองตำแหน่ง
   ทุกเส้นยาวจาก x = 0 ถึง x = 10 แบ่งเป็นสิบช่องเท่ากัน */
const LINE_Y = [3.5, 2.0, 0.5];
const Y = (k: number): number => LINE_Y[k] ?? OFF;
const MONO = "font-family: 'IBM Plex Mono', monospace";

/* รากที่สองแบบปัดลงของจำนวนเต็มบวก คำนวณด้วยจำนวนเต็ม ไม่ให้ทศนิยมของเครื่องปัดผิด */
function isqrt(m: number): number {
  let r = Math.floor(Math.sqrt(m));
  while (r * r > m) r--;
  while ((r + 1) * (r + 1) <= m) r++;
  return r;
}

/* จำนวนเต็ม v หารด้วย 10 ยกกำลัง d เขียนเป็นทศนิยม d ตำแหน่ง */
function dec(v: number, d: number): string {
  return (v / 10 ** d).toFixed(d);
}

function m(s: string): string {
  return `<span class="m">${s}</span>`;
}

/* a² < n < b² จึงได้ a < √n < b เขียนจำนวนเต็มที่หารด้วย 10^d แล้วเป็นค่าจริง */
function between(lo: number, d: number, n: number): string {
  const hi = lo + 1;
  const sq = (v: number): string => dec(v * v, 2 * d);
  return `${m(`${dec(lo, d)}<sup>2</sup> = ${sq(lo)} &lt; ${n} &lt; ${sq(hi)} = ${dec(hi, d)}<sup>2</sup>`)}`
    + `<br>จึงได้ ${m(`${dec(lo, d)} &lt; √${n} &lt; ${dec(hi, d)}`)}`;
}

export const boards: Record<string, BoardDef> = {
  /* √n บนเส้นจำนวน ขยายช่วงที่มี √n ทีละสิบเท่า จากจำนวนเต็ม ไปทศนิยมหนึ่งตำแหน่ง และสองตำแหน่ง */
  "c11-root-zoom": {
    bbox: [-0.8, 4.4, 10.8, -0.6],
    axis: false,
    initial: { n: 2, zoom: 0 },
    sliders: [
      { key: "n", label: "<i>n</i>", min: 2, max: 99, step: 1 },
      { key: "zoom", label: "ขยาย", min: 0, max: 2, step: 1 },
    ],
    draw(board, s, c) {
      const n = (): number => s.n ?? 2;
      const zoom = (): number => s.zoom ?? 0;
      const a = (): number => isqrt(n());
      const perfect = (): boolean => a() * a() === n();
      const t1 = (): number => isqrt(100 * n()); // ส่วนสิบที่ปัดลง เช่น √2 ได้ 14
      const t2 = (): number => isqrt(10000 * n()); // ส่วนร้อยที่ปัดลง เช่น √2 ได้ 141
      const shown = (k: number): boolean => k === 0 || (zoom() >= k && !perfect());
      const y = (k: number, dy = 0) => (): number => (shown(k) ? Y(k) + dy : OFF);

      // ช่วงที่ระบายบนแต่ละเส้น นับเป็นช่องที่เท่าไรจากซ้าย
      const lo = (k: number) => (): number => (k === 0 ? a() : k === 1 ? t1() - 10 * a() : t2() - 10 * t1());
      // ตำแหน่งของ √n บนแต่ละเส้น
      const at = (k: number) => (): number => {
        if (k === 0) return Math.sqrt(n());
        if (k === 1) return 10 * Math.sqrt(n()) - 10 * a();
        return 100 * Math.sqrt(n()) - 10 * t1();
      };
      // ป้ายใต้ขีดของแต่ละเส้น เส้นล่างสุดใส่แค่ขีดคู่ จะได้ไม่เบียดกันบนมือถือ
      const tickLabel = (k: number, i: number): string => {
        if (k === 0) return String(i);
        if (k === 1) return dec(10 * a() + i, 1);
        return i % 2 === 0 ? dec(10 * t1() + i, 2) : "";
      };

      // เส้นประเชื่อมช่วงที่ระบายบนเส้นบน ไปยังเส้นล่างที่ขยายช่วงนั้นเต็มความยาว
      for (const k of [1, 2]) {
        const top = (): number => (shown(k) ? Y(k - 1) - 0.55 : OFF);
        const bottom = (): number => (shown(k) ? Y(k) + 0.5 : OFF);
        const from = lo(k - 1);
        board.create("segment", [[from, top], [0, bottom]], {
          strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
        });
        board.create("segment", [[() => from() + 1, top], [10, bottom]], {
          strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
        });
      }

      for (const k of [0, 1, 2]) {
        board.create("segment", [[0, y(k)], [10, y(k)]], {
          strokeColor: c.ink, strokeWidth: 2, fixed: true, highlight: false,
        });
        for (let i = 0; i <= 10; i++) {
          board.create("segment", [[i, y(k, -0.1)], [i, y(k, 0.1)]], {
            strokeColor: c.ink, strokeWidth: 1.5, fixed: true, highlight: false,
          });
          board.create("text", [i, y(k, -0.18), () => tickLabel(k, i)], {
            anchorX: "middle", anchorY: "top", fontSize: k === 0 ? 12 : 11, strokeColor: c.ink3,
            fixed: true, highlight: false, cssStyle: MONO,
          });
        }
        // ช่วงที่มี √n อยู่ ถ้า n เป็นจำนวนกำลังสองสมบูรณ์ ไม่มีช่วงให้ระบาย
        const band = (): number => (perfect() ? OFF : y(k)());
        board.create("segment", [[lo(k), band], [() => lo(k)() + 1, band]], {
          strokeColor: c.accent, strokeWidth: 7, fixed: true, highlight: false,
        });
        board.create("point", [at(k), y(k)], {
          fixed: true, withLabel: false, size: 5, fillColor: c.ink, strokeColor: c.paper, strokeWidth: 2, highlight: false,
        });
      }

      // เส้นบนสุดบอกว่าจุดคือ √n
      board.create("text", [at(0), y(0, 0.22), () => `√${n()}`], {
        anchorX: "middle", anchorY: "bottom", fontSize: 14, strokeColor: c.ink,
        fixed: true, highlight: false, cssStyle: `${MONO}; font-weight: 600`,
      });
      // เส้นล่างสุดใส่ค่าที่ปลายช่วงไว้ด้านบน เพราะใต้เส้นมีป้ายแค่ขีดคู่
      for (const side of [0, 1]) {
        board.create("text", [() => lo(2)() + side, y(2, 0.2), () => dec(t2() + side, 2)], {
          anchorX: "middle", anchorY: "bottom", fontSize: 11, strokeColor: c.accent,
          fixed: true, highlight: false, cssStyle: `${MONO}; font-weight: 600`,
        });
      }
    },
    readout(s) {
      const n = s.n ?? 2;
      const zoom = s.zoom ?? 0;
      const a = isqrt(n);
      if (a * a === n) {
        return `${m(`${n} = ${a}<sup>2</sup>`)} พอดี จึงได้ ${m(`√${n} = ${a}`)} เป็นจำนวนเต็ม ลองเลือก ${m("<i>n</i>")} ที่ไม่ใช่จำนวนกำลังสองสมบูรณ์`;
      }
      if (zoom <= 0) return between(a, 0, n);
      if (zoom === 1) return between(isqrt(100 * n), 1, n);
      return `${between(isqrt(10000 * n), 2, n)}<br>เครื่องคิดเลขให้ ${m(`√${n} ≈ ${Math.sqrt(n).toFixed(5)}`)}`;
    },
  },
};
