/* กราฟลากได้ด้วย JSXGraph ใช้กับ <div class="board" data-board="ชื่อ">
   แต่ละกราฟนิยามไว้ใน src/scripts/boards/ แถบเลื่อนเป็น <input type="range"> ธรรมดา ใช้บนมือถือได้ง่ายกว่า */

import JXG from "jsxgraph";
import { BOARDS, type BoardDef, type Colors } from "./boards/index.ts";

function css(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function colors(): Colors {
  return {
    ink: css("--ink"),
    ink3: css("--ink-3"),
    rule: css("--rule"),
    paper: css("--paper"),
    accent: css("--accent"),
    teal: css("--teal"),
    violet: css("--violet"),
  };
}

let uid = 0;

function axisAttrs(c: Colors, step: number): object {
  return {
    strokeColor: c.ink,
    strokeWidth: 1.5,
    highlight: false,
    ticks: {
      majorHeight: -1, // เส้นตารางเต็มกราฟ
      minorTicks: 0,
      ticksDistance: step,
      insertTicks: false,
      strokeColor: c.rule,
      strokeOpacity: 1,
      drawZero: false,
      label: { fontSize: 11, strokeColor: c.ink3, cssStyle: "font-family: 'IBM Plex Mono', monospace" },
    },
  };
}

interface Mounted {
  board: JXG.Board | null;
  def: BoardDef;
  state: Record<string, number>;
}

function mount(el: HTMLElement): Mounted | null {
  const name = el.dataset.board ?? "";
  const def = BOARDS[name];
  if (!def) {
    el.textContent = `ไม่พบกราฟชื่อ ${name}`;
    return null;
  }
  if (!el.id) el.id = `board-${++uid}`;
  if (def.aspect) el.style.aspectRatio = String(def.aspect);
  const m: Mounted = { board: null, def, state: { ...def.initial } };

  const readout = def.readout ? document.createElement("div") : null;
  if (readout) {
    readout.className = "board-readout";
    readout.setAttribute("aria-live", "polite");
  }

  const changed = (): void => {
    if (readout && def.readout) readout.innerHTML = def.readout(m.state);
    el.dispatchEvent(new CustomEvent("dc-board-change"));
  };

  let anchor: HTMLElement = el;
  if (def.sliders?.length) {
    const box = document.createElement("div");
    box.className = "board-controls";
    for (const s of def.sliders) {
      const id = `${el.id}-${s.key}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.innerHTML = s.label;
      const input = document.createElement("input");
      input.id = id;
      if (s.toggle) {
        input.type = "checkbox";
        input.checked = (m.state[s.key] ?? 0) > 0;
      } else {
        input.type = "range";
        input.min = String(s.min);
        input.max = String(s.max);
        input.step = String(s.step);
        input.value = String(m.state[s.key]);
      }
      const out = document.createElement("output");
      out.htmlFor = id;
      const show = (): void => {
        out.textContent = s.toggle ? "" : String(m.state[s.key]).replace("-", "−");
      };
      input.addEventListener("input", () => {
        m.state[s.key] = s.toggle ? Number(input.checked) : Number(input.value);
        show();
        m.board?.update();
        changed();
      });
      show();
      box.append(label, input, out);
    }
    anchor.after(box);
    anchor = box;
  }
  if (readout) anchor.after(readout);

  const draw = (): void => {
    if (m.board) JXG.JSXGraph.freeBoard(m.board);
    const c = colors();
    const [stepX, stepY] = def.steps ?? [1, 1];
    const board = JXG.JSXGraph.initBoard(el.id, {
      boundingbox: def.bbox,
      axis: def.axis ?? true,
      keepAspectRatio: false,
      showCopyright: false,
      showNavigation: false,
      pan: { enabled: false },
      zoom: { enabled: false },
      defaultAxes: { x: axisAttrs(c, stepX), y: axisAttrs(c, stepY) },
    } as Partial<JXG.BoardAttributes>);
    m.board = board;
    def.draw(board, m.state, c, changed);
    changed();
  };
  draw();
  document.addEventListener("dc-theme", draw);

  // ข้อแบบลากจุดในแบบฝึกหัด exercise.ts อ่านค่าจากตรงนี้
  if (def.value) {
    const value = def.value;
    (el as HTMLElement & { dcValue?: () => string }).dcValue = () => value(m.state);
  }
  return m;
}

/* สร้างกราฟเมื่อเลื่อนมาเห็น กราฟที่อยู่ใน <details> ที่ยังปิดอยู่มีขนาดเป็นศูนย์ ถ้าสร้างตอนนั้นจะวาดผิด
   site.ts โหลดไฟล์นี้เฉพาะหน้าที่มีกราฟ แล้วเรียก initBoards() */
export function initBoards(): void {
  const boards = Array.from(document.querySelectorAll<HTMLElement>(".board[data-board]"));
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      seen.unobserve(e.target);
      mount(e.target as HTMLElement);
    }
  }, { rootMargin: "200px" });
  for (const el of boards) seen.observe(el);
}
