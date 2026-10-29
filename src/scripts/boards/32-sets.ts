import type { BoardDef } from "./types.ts";

const expressions = ["A ∪ B", "A ∩ B", "A − B", "A′"];
export const boards: Record<string, BoardDef> = {
  "c32-venn": {
    bbox: [-4, 2.6, 4, -2.6], axis: false, aspect: 8 / 5.2,
    initial: { op: 0 },
    sliders: [{ key: "op", label: "เลือกส่วน 0 ยูเนียน 1 อินเตอร์เซกชัน 2 ผลต่าง 3 คอมพลีเมนต์", min: 0, max: 3, step: 1 }],
    draw(board, s, c) {
      board.create("polygon", [[-3.8, 2.3], [3.8, 2.3], [3.8, -2.3], [-3.8, -2.3]], { vertices: { visible: false }, borders: { strokeColor: c.rule, strokeWidth: 1 }, fillOpacity: 0, highlight: false });
      for (const center of [-1, 1]) {
        board.create("circle", [[center, 0], 1.7], { strokeColor: c.ink, strokeWidth: 1.5, fillOpacity: 0, highlight: false });
      }
      board.create("text", [-1.4, 1.9, "A"], { strokeColor: c.ink, fixed: true });
      board.create("text", [1.2, 1.9, "B"], { strokeColor: c.ink, fixed: true });
      board.create("text", [-3.6, 2.05, "U"], { strokeColor: c.ink, fixed: true });
      for (let ix = -11; ix <= 11; ix++) for (let iy = -6; iy <= 6; iy++) {
        const x = ix * 0.3, y = iy * 0.3;
        const inA = (x + 1) ** 2 + y ** 2 < 1.7 ** 2;
        const inB = (x - 1) ** 2 + y ** 2 < 1.7 ** 2;
        board.create("point", [x, y], {
          withLabel: false, fixed: true, size: 1.5, strokeWidth: 0,
          fillColor: c.accent, highlight: false,
          visible: () => [inA || inB, inA && inB, inA && !inB, !inA][s.op ?? 0] ?? false,
        });
      }
    },
    readout(s) {
      return `จุดสีส้มแสดงบริเวณ <span class="m">${expressions[s.op ?? 0]}</span> จุดใช้บอกบริเวณ ไม่ได้บอกจำนวนสมาชิกของเซต`;
    },
  },
};
