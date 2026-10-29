/* ชนิดข้อมูลของนิยามกราฟ ใช้ร่วมกันทุกไฟล์ในโฟลเดอร์นี้ */

import type JXG from "jsxgraph";

export interface Colors {
  ink: string;
  ink3: string;
  rule: string;
  paper: string;
  accent: string;
  teal: string;
  violet: string;
}

export interface Slider {
  key: string;
  label: string; // HTML ได้ เช่น <i>a</i>
  min: number;
  max: number;
  step: number;
  toggle?: boolean; // แสดงเป็นช่องติ๊ก ค่า 0 หรือ 1 แทนแถบเลื่อน
}

export interface BoardDef {
  bbox: [number, number, number, number]; // ซ้าย บน ขวา ล่าง
  steps?: [number, number]; // ระยะห่างเส้นตารางแกน x และแกน y
  axis?: boolean; // false ไม่วาดแกนและเส้นตาราง ใช้กับรูปที่ไม่ใช่กราฟพิกัด เช่นตาชั่ง การสร้างด้วยวงเวียน
  aspect?: number; // ความกว้างหารความสูงของกรอบ ค่าเริ่มต้น 4/3 เส้นจำนวนใช้ราว 3 ให้ bbox สัดส่วนเดียวกันรูปจะไม่เบี้ยว
  initial: Record<string, number>;
  sliders?: Slider[];
  /* สร้างของในกราฟ ฟังก์ชันที่ส่งให้ JSXGraph ต้องอ่านค่าจาก state ทุกครั้ง แถบเลื่อนจะได้ขยับกราฟได้
     เรียก changed() เมื่อนักเรียนลากจุดจน state เปลี่ยน */
  draw(board: JXG.Board, state: Record<string, number>, c: Colors, changed: () => void): void;
  readout?(state: Record<string, number>): string;
  value?(state: Record<string, number>): string;
}
