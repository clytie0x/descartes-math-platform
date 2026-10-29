/* ตรวจคำตอบในหน้าแบบฝึกหัด site.ts โหลดไฟล์นี้เฉพาะหน้าที่มี <section class="ex"> แล้วเรียก initExercises()
   ExerciseList.astro ใส่ข้อมูลเฉลยไว้ใน data-ex ของแต่ละข้อ ตัวตรวจจริงอยู่ใน mathexpr.ts */

import { MathfieldElement } from "mathlive";
import { checkAnswer, type Task } from "./mathexpr.ts";
import { load, save } from "./store.ts";

// ฟอนต์ของช่องพิมพ์สูตรคือฟอนต์ของ KaTeX ซึ่งทุกหน้าโหลดอยู่แล้ว ไม่ต้องโหลดซ้ำ และไม่ใช้เสียงกดแป้น
MathfieldElement.fontsDirectory = null;
MathfieldElement.soundsDirectory = null;

function inputOf(section: HTMLElement, task: Task): string {
  if (task.type === "choice") {
    return section.querySelector<HTMLInputElement>("input[type=radio]:checked")?.value ?? "";
  }
  if (task.type === "order") {
    return Array.from(section.querySelectorAll<HTMLElement>(".ex-order > li")).map((li) => li.dataset.k).join(",");
  }
  if (task.type === "point") {
    const board = section.querySelector<HTMLElement & { dcValue?: () => string }>(".board");
    return board?.dcValue?.() ?? "";
  }
  const mf = section.querySelector<MathfieldElement>("math-field");
  if (mf) return mf.getValue("ascii-math");
  return section.querySelector<HTMLInputElement>(".ex-input")?.value ?? "";
}

/* ข้อเรียงขั้น กดลูกศรเพื่อสลับกับขั้นข้างบนหรือข้างล่าง */
function initOrder(section: HTMLElement, onChange: () => void): void {
  const list = section.querySelector<HTMLOListElement>(".ex-order");
  if (!list) return;
  list.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-move]");
    const li = btn?.closest("li");
    if (!btn || !li) return;
    const dir = Number(btn.dataset.move);
    const other = dir < 0 ? li.previousElementSibling : li.nextElementSibling;
    if (!other) return;
    if (dir < 0) list.insertBefore(li, other);
    else list.insertBefore(other, li);
    btn.focus();
    onChange();
  });
}

function init(section: HTMLElement): void {
  const task = JSON.parse(section.dataset.ex ?? "{}") as Task;
  const btn = section.querySelector<HTMLButtonElement>(".ex-check");
  const out = section.querySelector<HTMLElement>(".ex-feedback");
  const id = section.querySelector("h2")?.id ?? "";
  const key = `dc-ex:${location.pathname}:${id}`;
  if (load(key) === "1") section.classList.add("is-solved");
  if (!btn || !out) return;

  const clear = (): void => {
    out.textContent = "";
    out.classList.remove("is-right", "is-wrong");
  };
  const run = (): void => {
    const verdict = checkAnswer(task, inputOf(section, task));
    out.textContent = verdict.message;
    out.classList.toggle("is-right", verdict.ok);
    out.classList.toggle("is-wrong", !verdict.ok);
    if (verdict.ok) {
      section.classList.add("is-solved");
      save(key, "1");
    }
  };
  btn.addEventListener("click", run);
  initOrder(section, clear);
  for (const field of Array.from(section.querySelectorAll<HTMLElement>(".ex-input, math-field"))) {
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        run();
      }
    });
    field.addEventListener("input", (e) => {
      // MathLive emits this after Enter's keydown; retain the submitted verdict.
      if (e instanceof InputEvent && e.inputType === "insertLineBreak") run();
      else clear();
    });
  }
}

export function initExercises(): void {
  for (const s of Array.from(document.querySelectorAll<HTMLElement>("section.ex[data-ex]"))) init(s);
}
