import type { BoardDef } from "./types.ts";

function num(n: number): string { return String(Math.round(n*1000)/1000).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c45-sequence": {
    bbox:[-1,30,11,-15],steps:[1,5],initial:{a:2,d:2},
    sliders:[{key:"a",label:"พจน์แรก",min:-4,max:6,step:1},{key:"d",label:"ผลต่างร่วม",min:-1,max:2,step:1}],
    draw(board,s,c){
      for(let n=1;n<=10;n++)board.create("point",[n,()=> (s.a??2)+(n-1)*(s.d??2)],{fixed:true,withLabel:false,size:4,fillColor:c.accent,strokeColor:c.accent});
    },
    readout(s){return `พจน์แรก <span class="m">${num(s.a??2)}</span> ผลต่างร่วม <span class="m">${num(s.d??2)}</span> พจน์ที่สิบ <span class="m">${num((s.a??2)+9*(s.d??2))}</span> กราฟมีเฉพาะตำแหน่งจำนวนเต็มบวก`;},
  },
};
