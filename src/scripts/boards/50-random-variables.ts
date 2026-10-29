import type { BoardDef } from "./types.ts";

function num(n: number): string { return String(Math.round(n*1000)/1000).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c50-binomial": {
    bbox:[-1.5,1.1,13,-0.1],steps:[1,0.2],initial:{n:6,p:0.5},
    sliders:[{key:"n",label:"จำนวนครั้ง",min:1,max:12,step:1},{key:"p",label:"โอกาสสำเร็จ",min:0,max:1,step:0.05}],
    draw(board,s,c){
      const mass=(k:number):number=>{const n=s.n??6,p=s.p??0.5;if(k>n)return 0;let choose=1;for(let j=1;j<=k;j++)choose=choose*(n-j+1)/j;return choose*p**k*(1-p)**(n-k);};
      for(let k=0;k<=12;k++)board.create("segment",[[k,0],[k,()=>mass(k)]],{strokeColor:c.accent,strokeWidth:9});
    },
    readout(s){const n=s.n??6,p=s.p??0.5;return `ค่าเฉลี่ย <span class="m">${num(n*p)}</span> ความแปรปรวน <span class="m">${num(n*p*(1-p))}</span> แกนนอนคือจำนวนสำเร็จ แกนตั้งคือความน่าจะเป็น`;},
  },
};
