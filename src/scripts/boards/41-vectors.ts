import type { BoardDef } from "./types.ts";

function num(n: number): string { return String(Math.round(n*1000)/1000).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c41-vector-sum": {
    bbox: [-7, 9, 9, -3], initial: { x: 3, y: 2 },
    sliders: [{key:"x",label:"v₁",min:-4,max:4,step:1},{key:"y",label:"v₂",min:-2,max:5,step:1}],
    draw(board,s,c) {
      const x=()=>s.x??3, y=()=>s.y??2;
      board.create("arrow", [[0,0],[2,1]], {strokeColor:c.teal,strokeWidth:3,fixed:true});
      board.create("arrow", [[2,1],[()=>2+x(),()=>1+y()]], {strokeColor:c.violet,strokeWidth:3,fixed:true});
      board.create("arrow", [[0,0],[()=>2+x(),()=>1+y()]], {strokeColor:c.accent,strokeWidth:4,fixed:true});
    },
    readout(s) {return `u = <span class="m">⟨2, 1⟩</span> v = <span class="m">⟨${num(s.x??3)}, ${num(s.y??2)}⟩</span> ผลบวก = <span class="m">⟨${num(2+(s.x??3))}, ${num(1+(s.y??2))}⟩</span>`;},
  },
};
