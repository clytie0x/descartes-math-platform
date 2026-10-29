import type { BoardDef } from "./types.ts";

function num(n: number): string { return String(Math.round(n*1000)/1000).replace("-", "−"); }

export const boards: Record<string, BoardDef> = {
  "c42-complex-plane": {
    bbox:[-6,6,6,-6],aspect:1,initial:{a:3,b:2},
    sliders:[{key:"a",label:"ส่วนจริง",min:-5,max:5,step:1},{key:"b",label:"ส่วนจินตภาพ",min:-5,max:5,step:1}],
    draw(board,s,c){
      const a=()=>s.a??3,b=()=>s.b??2;
      board.create("segment",[[0,0],[a,b]],{strokeColor:c.accent,strokeWidth:3});
      board.create("point",[a,b],{name:"z",fixed:true,fillColor:c.accent,strokeColor:c.accent});
      board.create("point",[a,()=>-b()],{name:"สังยุค",fixed:true,fillColor:c.teal,strokeColor:c.teal});
      board.create("segment",[[a,b],[a,()=>-b()]],{strokeColor:c.teal,dash:2});
    },
    readout(s){return `พิกัด <span class="m">(${num(s.a??3)}, ${num(s.b??2)})</span> ขนาด <span class="m">${num(Math.hypot(s.a??3,s.b??2))}</span> สังยุคสะท้อนข้ามแกนนอน`;},
  },
  "c42-nth-roots": {
    bbox:[-3,3,3,-3],aspect:1,initial:{n:3,r:8,t:90},
    sliders:[{key:"n",label:"<i>n</i>",min:2,max:8,step:1},{key:"r",label:"ขนาดของ <i>w</i>",min:1,max:16,step:1},{key:"t",label:"มุมของ <i>w</i> (องศา)",min:0,max:345,step:15}],
    draw(board,s,c){
      const n=()=>s.n??3,rad=()=>Math.pow(s.r??8,1/n());
      const ang=(k:number)=>((s.t??90)*Math.PI/180+2*k*Math.PI)/n();
      const X=(k:number)=>()=>rad()*Math.cos(ang(k)),Y=(k:number)=>()=>rad()*Math.sin(ang(k));
      const next=(k:number)=>()=>k+1<n()?k+1:0;
      const base={fixed:true,highlight:false};
      board.create("circle",[[0,0],rad],{...base,strokeColor:c.teal,strokeWidth:1.5,dash:2,fillOpacity:0});
      board.create("segment",[[0,0],[()=>2.9*Math.cos((s.t??90)*Math.PI/180),()=>2.9*Math.sin((s.t??90)*Math.PI/180)]],{...base,strokeColor:c.violet,strokeWidth:1.5,dash:1});
      for(let k=0;k<8;k++){
        board.create("segment",[[X(k),Y(k)],[()=>X(next(k)())(),()=>Y(next(k)())()]],{...base,visible:()=>k<n(),strokeColor:c.accent,strokeWidth:2});
        board.create("point",[X(k),Y(k)],{...base,visible:()=>k<n(),withLabel:false,size:4,fillColor:k===0?c.accent:c.paper,strokeColor:c.accent});
      }
    },
    readout(s){
      const n=s.n??3,r=s.r??8,t=s.t??90;
      return `ราก <span class="m">${n}</span> ตัว อยู่บนวงกลมรัศมี <span class="m">${num(Math.pow(r,1/n))}</span> ห่างกันทีละ <span class="m">${num(360/n)}°</span> รากแรก (จุดทึบ) ทำมุม <span class="m">${num(t/n)}°</span> เส้นประม่วงชี้ทิศของ <span class="m">w</span>`;
    },
  },
};
