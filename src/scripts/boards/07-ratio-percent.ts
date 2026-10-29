/* กราฟของบทที่ 7 อัตราส่วน สัดส่วน และร้อยละ */

import type { BoardDef } from "./types.ts";

/* ตัวเลขในข้อความ ปัดทศนิยมสองตำแหน่ง ใช้เครื่องหมายลบแบบคณิตศาสตร์ */
function fmt(n: number): string {
  const r = Math.round(n * 100) / 100;
  return String(r).replace("-", "−");
}

export const boards: Record<string, BoardDef> = {
  /* แถบร้อยละ แกนนอนคือร้อยละ แถบยาว 100 หน่วยแทนจำนวนทั้งหมด ส่วนที่ระบายสีคือร้อยละที่เลือก */
  "c7-percent-bar": {
    bbox: [-12, 5.2, 162, -1.6],
    steps: [10, 10],
    initial: { whole: 240, p: 15 },
    sliders: [
      { key: "whole", label: "ทั้งหมด", min: 40, max: 400, step: 20 },
      { key: "p", label: "ร้อยละ", min: 0, max: 150, step: 5 },
    ],
    draw(board, s, c) {
      const whole = (): number => s.whole ?? 240;
      const p = (): number => s.p ?? 15;
      const part = (): number => (p() / 100) * whole();
      const hidden = { visible: false, fixed: true, withLabel: false };
      const mono = "font-family: 'IBM Plex Mono', monospace; font-weight: 600";

      board.create("polygon", [[0, 1], [100, 1], [100, 2.6], [0, 2.6]], {
        fillColor: c.paper, fillOpacity: 1, highlight: false, vertices: hidden,
        borders: { strokeColor: c.ink, strokeWidth: 2, highlight: false, fixed: true },
      });
      board.create("polygon", [[0, 1], [() => p(), 1], [() => p(), 2.6], [0, 2.6]], {
        fillColor: c.accent, fillOpacity: 0.35, highlight: false, vertices: hidden,
        borders: { strokeColor: c.accent, strokeWidth: 2.5, highlight: false, fixed: true },
      });
      board.create("segment", [[() => p(), 0], [() => p(), 4]], {
        strokeColor: c.teal, strokeWidth: 1.5, dash: 2, fixed: true, highlight: false,
      });
      board.create("text", [0, 3.2, "0"], {
        fontSize: 13, strokeColor: c.ink, fixed: true, highlight: false, anchorX: "middle", cssStyle: mono,
      });
      board.create("text", [100, 3.2, () => fmt(whole())], {
        fontSize: 13, strokeColor: c.ink, fixed: true, highlight: false, anchorX: "middle", cssStyle: mono,
      });
      board.create("text", [() => p(), 4.5, () => fmt(part())], {
        fontSize: 15, strokeColor: c.accent, fixed: true, highlight: false, anchorX: "middle", cssStyle: mono,
      });
    },
    readout(s) {
      const whole = s.whole ?? 240;
      const p = s.p ?? 15;
      const part = (p / 100) * whole;
      const head = `ร้อยละ <span class="m">${fmt(p)}</span> ของ <span class="m">${fmt(whole)}</span> คือ <span class="m">${fmt(p)}/100 × ${fmt(whole)} = ${fmt(part)}</span>`;
      if (p < 100) return `${head}<br>ส่วนที่เหลือคือร้อยละ <span class="m">${fmt(100 - p)}</span> เท่ากับ <span class="m">${fmt(whole - part)}</span>`;
      if (p > 100) return `${head}<br>มากกว่าทั้งหมดอยู่ร้อยละ <span class="m">${fmt(p - 100)}</span> เท่ากับ <span class="m">${fmt(part - whole)}</span>`;
      return `${head}<br>ร้อยละ 100 คือจำนวนทั้งหมดพอดี`;
    },
  },
};
