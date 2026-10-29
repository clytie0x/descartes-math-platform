import type { BoardDef } from "./types.ts";

function num(n: number): string { return String(Math.round(n*1000)/1000).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c49-center": {
    bbox:[-1,2,22,-2],aspect:5.75,initial:{x:8},sliders:[{key:"x",label:"ข้อมูลตัวที่ห้า",min:6,max:20,step:1}],
    draw(board,s,c){
      for(const x of [2,3,4,5])board.create("point",[x,0],{fixed:true,withLabel:false,fillColor:c.ink,strokeColor:c.ink});
      board.create("point",[()=>s.x??8,0],{fixed:true,withLabel:false,fillColor:c.accent,strokeColor:c.accent});
      board.create("point",[()=>(14+(s.x??8))/5,1],{name:"เฉลี่ย",fixed:true,fillColor:c.teal,strokeColor:c.teal});
      board.create("point",[4,-1],{name:"มัธยฐาน",fixed:true,fillColor:c.violet,strokeColor:c.violet});
    },
    readout(s){return `ข้อมูล <span class="m">2, 3, 4, 5, ${num(s.x??8)}</span> เฉลี่ย <span class="m">${num((14+(s.x??8))/5)}</span> มัธยฐาน <span class="m">4</span>`;},
  },
};
