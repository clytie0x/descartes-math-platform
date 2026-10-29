import type { BoardDef } from "./types.ts";

function num(n: number): string { return String(Math.round(n*1000)/1000).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c46-secant": {
    bbox:[-2,7,3.5,-1.5],initial:{h:1.5},sliders:[{key:"h",label:"<i>h</i>",min:-1.5,max:1.5,step:0.05}],
    draw(board,s,c){
      const hh=()=>s.h??1.5, slope=()=>Math.abs(hh())<1e-9?2:2+hh();
      board.create("functiongraph",[(x:number)=>x*x],{strokeColor:c.accent,strokeWidth:3});
      board.create("functiongraph",[(x:number)=>2*x-1],{strokeColor:c.ink3,strokeWidth:1,dash:2});
      board.create("functiongraph",[(x:number)=>1+slope()*(x-1)],{strokeColor:c.teal,strokeWidth:2});
      board.create("point",[1,1],{fixed:true,withLabel:false,fillColor:c.violet,strokeColor:c.violet});
      board.create("point",[()=>1+hh(),()=>(1+hh())**2],{fixed:true,withLabel:false,fillColor:c.teal,strokeColor:c.teal});
    },
    readout(s){const h=s.h??1.5;return Math.abs(h)<1e-9?`<span class="m">h = 0</span> หารไม่ได้ เส้นประคือเส้นสัมผัส ความชัน <span class="m">2</span>`:`<span class="m">h = ${num(h)}</span> ความชันเส้นตัด <span class="m">${num(2+h)}</span> เส้นประคือเส้นสัมผัส ความชัน <span class="m">2</span>`;},
  },
  "c46-tangent": {
    bbox:[-4,10,4,-2],initial:{a:1},sliders:[{key:"a",label:"จุดสัมผัส",min:-2.5,max:2.5,step:0.1}],
    draw(board,s,c){
      board.create("functiongraph",[(x:number)=>x*x],{strokeColor:c.accent,strokeWidth:3});
      board.create("functiongraph",[(x:number)=>2*(s.a??1)*x-(s.a??1)**2],{strokeColor:c.teal,strokeWidth:2});
      board.create("point",[()=>s.a??1,()=>(s.a??1)**2],{fixed:true,withLabel:false,fillColor:c.violet,strokeColor:c.violet});
    },
    readout(s){return `จุดสัมผัส <span class="m">(${num(s.a??1)}, ${num((s.a??1)**2)})</span> ความชัน <span class="m">${num(2*(s.a??1))}</span>`;},
  },
  "c46-riemann": {
    bbox:[-0.3,1.3,1.4,-0.2],aspect:1.13,initial:{n:4},sliders:[{key:"n",label:"จำนวนช่วง",min:2,max:20,step:1}],
    draw(board,s,c){
      board.create("functiongraph",[(x:number)=>x*x,0,1],{strokeColor:c.accent,strokeWidth:3});
      for(let j=0;j<20;j++){
        const n=()=>s.n??4,left=()=>j<n()?j/n():0,right=()=>j<n()?(j+1)/n():0,top=()=>j<n()?((j+1)/n())**2:0;
        board.create("polygon",[[left,0],[right,0],[right,top],[left,top]],{fillColor:c.teal,fillOpacity:0.15,borders:{strokeColor:c.teal,strokeWidth:1},vertices:{visible:false},highlight:false});
      }
    },
    readout(s){const n=s.n??4;return `ผลรวมปลายขวา <span class="m">${num((n+1)*(2*n+1)/(6*n*n))}</span> ปริพันธ์จริง <span class="m">1/3</span> สังเกตว่าส่วนเกินลดลงเมื่อช่วงแคบลง`;},
  },
};
