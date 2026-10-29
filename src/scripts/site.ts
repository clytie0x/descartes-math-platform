/* สคริปต์ที่ทุกหน้าโหลด เขียนเองทั้งหมด ไม่ใช้ไลบรารี
   กราฟ (JSXGraph) กับช่องพิมพ์สูตร (MathLive) ไฟล์ใหญ่ จึงโหลดแยกเฉพาะหน้าที่ใช้ ดูท้ายไฟล์ */

import { load, save } from "./store.ts";

const root = document.documentElement;
const THEME_KEY = "dc-theme";
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

function $<T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document): T | null {
  return ctx.querySelector<T>(sel);
}
function $all<T extends Element = HTMLElement>(sel: string, ctx: ParentNode = document): T[] {
  return Array.from(ctx.querySelectorAll<T>(sel));
}

/* ---------- โหมดมืด ---------- */

function effectiveTheme(): "light" | "dark" {
  const t = root.getAttribute("data-theme");
  if (t === "light" || t === "dark") return t;
  return darkQuery.matches ? "dark" : "light";
}

function syncThemeButton(): void {
  const btn = $(".theme-btn");
  if (!btn) return;
  const label = effectiveTheme() === "dark" ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด";
  btn.setAttribute("aria-label", label);
  btn.setAttribute("title", label);
}

function initTheme(): void {
  const btn = $(".theme-btn");
  if (!btn) return;
  syncThemeButton();
  btn.addEventListener("click", () => {
    const next = effectiveTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    save(THEME_KEY, next);
    syncThemeButton();
    // กราฟวาดสีจากตัวแปร CSS ตอนสร้าง ต้องบอกให้วาดใหม่
    document.dispatchEvent(new CustomEvent("dc-theme"));
  });
  darkQuery.addEventListener("change", () => {
    syncThemeButton();
    document.dispatchEvent(new CustomEvent("dc-theme"));
  });
}

/* ---------- เมนูบนจอแคบ ---------- */

function initDrawer(): void {
  const body = document.body;
  const openBtn = $(".menu-btn");
  const closeBtn = $(".drawer-close");
  const scrim = $(".scrim");
  const sidebar = $(".sidebar");
  const background = $all<HTMLElement>(".topbar, .main, .toc, .site-footer, .skip");
  if (!openBtn || !sidebar) return;

  function setOpen(open: boolean): void {
    const mobile = window.innerWidth <= 960;
    const wasOpen = body.classList.contains("nav-open");
    open = open && mobile;
    body.classList.toggle("nav-open", open);
    openBtn?.setAttribute("aria-expanded", open ? "true" : "false");
    if (sidebar) sidebar.inert = mobile && !open;
    for (const el of background) el.inert = open;
    if (open && !wasOpen) closeBtn?.focus({ preventScroll: true });
  }

  openBtn.addEventListener("click", () => setOpen(!body.classList.contains("nav-open")));
  closeBtn?.addEventListener("click", () => {
    setOpen(false);
    openBtn.focus();
  });
  scrim?.addEventListener("click", () => {
    setOpen(false);
    openBtn.focus();
  });
  document.addEventListener("keydown", (e) => {
    if (!body.classList.contains("nav-open")) return;
    if (e.key === "Escape") {
      setOpen(false);
      openBtn.focus();
    }
    if (e.key === "Tab") {
      const controls = $all<HTMLElement>("a[href], button, input, select, textarea, [tabindex]", sidebar)
        .filter((el) => el.tabIndex >= 0 && !el.hasAttribute("disabled") && el.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  sidebar.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.closest("a[href]")) setOpen(false);
  });
  window.addEventListener("resize", () => {
    setOpen(body.classList.contains("nav-open"));
  });
  setOpen(false);
}

/* ---------- สารบัญในหน้า และไฮไลต์ขณะเลื่อน ---------- */

function initToc(): void {
  const headings = $all(".doc h2[id], .doc h3[id]");
  const tocList = $("#toc-list");
  const inline = $(".toc-inline");
  const toc = $(".toc");

  for (const h of headings) {
    const a = document.createElement("a");
    a.className = "anchor";
    a.href = "#" + h.id;
    a.setAttribute("aria-label", "ลิงก์มาที่หัวข้อนี้");
    a.textContent = "#";
    h.appendChild(a);
  }

  if (!headings.length) {
    if (toc) toc.style.visibility = "hidden";
    return;
  }

  function title(h: HTMLElement): string {
    const clone = h.cloneNode(true);
    if (!(clone instanceof HTMLElement)) return "";
    for (const n of $all(".anchor, .katex-mathml", clone)) n.remove();
    return (clone.textContent ?? "").trim();
  }

  function build(ul: HTMLElement | null): HTMLAnchorElement[] {
    if (!ul) return [];
    return headings.map((h) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = title(h);
      a.className = h.tagName === "H3" ? "lvl-3" : "lvl-2";
      li.appendChild(a);
      ul.appendChild(li);
      return a;
    });
  }

  const linksA = build(tocList);
  const linksB = build(inline);
  let activeIdx = -1;

  function update(): void {
    const offset = 60 + 24;
    let idx = 0;
    for (const [i, h] of headings.entries()) {
      if (h.getBoundingClientRect().top - offset <= 0) idx = i;
      else break;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      idx = headings.length - 1;
    }
    if (idx === activeIdx) return;
    activeIdx = idx;
    for (const links of [linksA, linksB]) {
      links.forEach((a, i) => a.classList.toggle("is-active", i === idx));
    }
    const act = linksA[idx];
    if (act && toc && toc.offsetParent !== null) {
      const r = act.getBoundingClientRect();
      const tr = toc.getBoundingClientRect();
      if (r.top < tr.top || r.bottom > tr.bottom) act.scrollIntoView({ block: "nearest" });
    }
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        update();
      });
    },
    { passive: true },
  );
  window.addEventListener("resize", update);
  update();
}

/* ---------- วิธีทำทีละขั้น ----------
   <Steps reveal> ซ่อนขั้นที่เหลือไว้ให้กดเปิดทีละขั้น ถ้าไม่มี JavaScript จะเห็นทุกขั้น */

function initSteps(): void {
  for (const list of $all<HTMLOListElement>(".steps[data-steps] > ol")) {
    const items = $all<HTMLLIElement>(":scope > li", list);
    if (items.length < 2) continue;
    let shown = 1;
    const bar = document.createElement("div");
    bar.className = "steps-controls";
    const next = document.createElement("button");
    next.type = "button";
    next.className = "btn btn-small";
    const all = document.createElement("button");
    all.type = "button";
    all.className = "btn btn-small";
    all.textContent = "ดูทุกขั้น";
    bar.append(next, all);
    list.after(bar);

    function render(): void {
      items.forEach((li, i) => li.classList.toggle("is-hidden", i >= shown));
      next.textContent = `ดูขั้นที่ ${shown + 1}`;
      bar.hidden = shown >= items.length;
    }
    next.addEventListener("click", () => {
      shown++;
      render();
      items[shown - 1]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    all.addEventListener("click", () => {
      shown = items.length;
      render();
    });
    render();
  }
}

/* ---------- เช็กลิสต์ จำค่าไว้ในเครื่อง ---------- */

function initChecklist(): void {
  const page = location.pathname;
  const boxes = $all<HTMLInputElement>(".task-list input[type=checkbox]");
  boxes.forEach((box, i) => {
    const key = "dc-check:" + page + ":" + i;
    box.checked = load(key) === "1";
    box.addEventListener("change", () => {
      save(key, box.checked ? "1" : null);
      const all = boxes.every((b) => b.checked);
      save("dc-done:" + page, all ? "1" : null);
      markDone();
    });
  });
  markDone();
}

function markDone(): void {
  for (const a of $all<HTMLAnchorElement>(".sidebar a[href]")) {
    const path = new URL(a.getAttribute("href") ?? "", location.href).pathname;
    a.classList.toggle("is-done", load("dc-done:" + path) === "1");
  }
}

/* ---------- พาราโบลาบนหน้าแรก ลากจุดยอดได้ ---------- */

const SVG_NS = "http://www.w3.org/2000/svg";

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

function fmt(n: number): string {
  return Math.abs(n).toString();
}

function initHeroPlane(): void {
  const svg = $<SVGSVGElement>("svg.plane[data-hero]");
  const eq = $(".hero-eq");
  const vtx = $(".hero-vertex");
  if (!svg || !eq) return;

  const W = 480;
  const H = 340;
  const U = 34; // พิกเซลต่อหนึ่งหน่วย
  const ox = W / 2;
  const oy = H / 2 + 34;
  const X = (x: number): number => ox + x * U;
  const Y = (y: number): number => oy - y * U;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

  const grid = svgEl("g", {});
  for (let i = -7; i <= 7; i++) {
    grid.append(svgEl("line", { class: "grid-line", x1: X(i), y1: 0, x2: X(i), y2: H }));
  }
  for (let j = -6; j <= 6; j++) {
    grid.append(svgEl("line", { class: "grid-line", x1: 0, y1: Y(j), x2: W, y2: Y(j) }));
  }
  grid.append(svgEl("line", { class: "axis-line", x1: 0, y1: oy, x2: W, y2: oy }));
  grid.append(svgEl("line", { class: "axis-line", x1: ox, y1: 0, x2: ox, y2: H }));
  for (const i of [-6, -4, -2, 2, 4, 6]) {
    const t = svgEl("text", { class: "tick", x: X(i), y: oy + 16, "text-anchor": "middle" });
    t.textContent = String(i).replace("-", "−");
    grid.append(t);
  }
  for (const j of [-4, -2, 2, 4]) {
    const t = svgEl("text", { class: "tick", x: ox - 8, y: Y(j) + 4, "text-anchor": "end" });
    t.textContent = String(j).replace("-", "−");
    grid.append(t);
  }
  const sym = svgEl("line", { class: "sym", y1: 0, y2: H });
  const curve = svgEl("path", { class: "curve" });
  const ring = svgEl("circle", { class: "handle-ring", r: 22 });
  const handle = svgEl("circle", { class: "handle", r: 9, tabindex: 0, role: "slider", "aria-label": "จุดยอดของพาราโบลา ใช้ลูกศรเลื่อนได้" });
  svg.append(grid, sym, curve, ring, handle);

  let h = 1;
  let k = -2;
  const a = 0.5;

  function draw(): void {
    let d = "";
    for (let px = 0; px <= W; px += 4) {
      const x = (px - ox) / U;
      const y = a * (x - h) ** 2 + k;
      d += (d ? "L" : "M") + px + " " + Math.max(-50, Math.min(H + 50, Y(y))).toFixed(1);
    }
    curve.setAttribute("d", d);
    sym.setAttribute("x1", String(X(h)));
    sym.setAttribute("x2", String(X(h)));
    for (const c of [ring, handle]) {
      c.setAttribute("cx", String(X(h)));
      c.setAttribute("cy", String(Y(k)));
    }
    const hp = h === 0 ? "<i>x</i>" : `(<i>x</i> ${h > 0 ? "−" : "+"} ${fmt(h)})`;
    const kp = k === 0 ? "" : ` ${k > 0 ? "+" : "−"} ${fmt(k)}`;
    if (eq) eq.innerHTML = `<i>y</i> = ½${hp}<sup>2</sup>${kp}`;
    if (vtx) vtx.textContent = `จุดยอด (${h}, ${k})`.replace(/-/g, "−");
    handle.setAttribute("aria-valuetext", `จุดยอดอยู่ที่ x เท่ากับ ${h} y เท่ากับ ${k}`);
  }

  function toPoint(e: PointerEvent): void {
    const r = svg!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const py = ((e.clientY - r.top) / r.height) * H;
    h = Math.max(-6, Math.min(6, Math.round((px - ox) / U)));
    k = Math.max(-5, Math.min(4, Math.round((oy - py) / U)));
    draw();
  }

  let dragging = false;
  svg.addEventListener("pointerdown", (e) => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    toPoint(e);
  });
  svg.addEventListener("pointermove", (e) => {
    if (dragging) toPoint(e);
  });
  svg.addEventListener("pointerup", () => {
    dragging = false;
  });
  handle.addEventListener("keydown", (e) => {
    const moves: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    h = Math.max(-6, Math.min(6, h + m[0]));
    k = Math.max(-5, Math.min(4, k + m[1]));
    draw();
  });
  draw();
}

/* ---------- สาย ม.ปลาย ----------
   data-track บน <html> ให้ CSS ซ่อนบทและหน้าที่ไม่อยู่ในสาย สคริปต์ในหัวหน้าตั้งค่าไว้ก่อนแล้วตั้งแต่ก่อนวาด
   ปุ่มก่อนหน้าถัดไปเปลี่ยนตามลำดับบทในหนังสือของสายนั้น จาก JSON ที่ Pager.astro ใส่ไว้ */

const TRACK_KEY = "dc-track";
type Track = "all" | "basic" | "adv";

function currentTrack(): Track {
  const t = root.getAttribute("data-track");
  return t === "basic" || t === "adv" ? t : "all";
}

interface Link {
  url: string;
  label: string;
}

function setPagerLink(a: HTMLAnchorElement | null, link: Link | undefined): void {
  if (!a) return;
  a.hidden = !link;
  if (!link) return;
  a.href = link.url;
  const t = a.querySelector(".pg-title");
  if (t) t.textContent = link.label;
}

let originalPager: { prev?: Link; next?: Link } | null = null;

function readLink(a: HTMLAnchorElement | null): Link | undefined {
  if (!a) return undefined;
  return { url: a.getAttribute("href") ?? "", label: a.querySelector(".pg-title")?.textContent ?? "" };
}

function syncPager(): void {
  const data = $("#track-pager");
  const pager = $(".pager");
  if (!data || !pager) return;
  const prev = $<HTMLAnchorElement>(".pager .prev");
  const next = $<HTMLAnchorElement>(".pager .next");
  originalPager ??= { ...(prev ? { prev: readLink(prev) } : {}), ...(next ? { next: readLink(next) } : {}) } as { prev?: Link; next?: Link };
  const alt = JSON.parse(data.textContent ?? "{}") as Partial<Record<Track, { prev?: Link; next?: Link }>>;
  const pick = alt[currentTrack()] ?? originalPager;
  setPagerLink(prev, pick.prev);
  setPagerLink(next, pick.next);
}

function initTrack(): void {
  const sync = (): void => {
    const t = currentTrack();
    for (const b of $all<HTMLButtonElement>("[data-set-track]")) {
      b.setAttribute("aria-pressed", String(b.dataset.setTrack === t));
    }
    syncPager();
  };
  for (const b of $all<HTMLButtonElement>("[data-set-track]")) {
    b.addEventListener("click", () => {
      const t = b.dataset.setTrack as Track;
      if (t === "all") root.removeAttribute("data-track");
      else root.setAttribute("data-track", t);
      save(TRACK_KEY, t === "all" ? null : t);
      sync();
    });
  }
  sync();
}

function initLazy(): void {
  if (document.querySelector(".board[data-board]")) {
    void import("./board.ts").then((m) => m.initBoards());
  }
  if (document.querySelector("section.ex[data-ex]")) {
    void import("./exercise.ts").then((m) => m.initExercises());
  }
}

function start(): void {
  initChecklist();
  initTheme();
  initDrawer();
  initSteps();
  initToc();
  initTrack();
  initHeroPlane();
  initLazy();
}

// สคริปต์นี้เป็น module ซึ่งรันหลังอ่าน HTML เสร็จ แต่กันไว้เผื่อถูกโหลดก่อน
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
else start();
