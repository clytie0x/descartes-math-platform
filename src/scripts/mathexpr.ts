/* อ่านนิพจน์คณิตศาสตร์แบบข้อความ แล้วตรวจคำตอบ ไม่ใช้ DOM จึงใช้ได้ทั้งในเบราว์เซอร์และใน tools/test_answers.ts
   รับรูปแบบที่ MathLive ส่งออกเป็น ascii-math และที่นักเรียนพิมพ์เอง เช่น 2(x+1)  x^2-4x+3  3/4  sqrt(2)
   ตัวอักษรที่ติดกันคือการคูณ ax คือ a คูณ x */

export type Node =
  | { k: "num"; v: number }
  | { k: "var"; name: string }
  | { k: "add"; terms: Node[] }          // ผลบวก ลบเขียนเป็น neg
  | { k: "mul"; factors: Node[] }
  | { k: "div"; a: Node; b: Node }
  | { k: "pow"; base: Node; exp: Node }
  | { k: "neg"; a: Node }
  | { k: "fn"; name: string; arg: Node };

const FUNCS = new Set(["sqrt", "abs", "sin", "cos", "tan", "ln", "log", "exp"]);

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

export class ParseError extends Error {}

function normalize(src: string): string {
  return src
    .replace(/[−–]/g, "-")
    .replace(/[×·⋅]/g, "*")
    .replace(/÷/g, "/")
    .replace(/\\cdot|\\times/g, "*")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/π/g, "pi")
    .replace(/√/g, "sqrt")
    .replace(/\\left|\\right/g, "")
    .replace(/[{[]/g, "(")
    .replace(/[}\]]/g, ")")
    .replace(/,(?=\d{3}(?!\d))/g, ""); // 1,000 คือหนึ่งพัน
}

function tokenize(src: string): Tok[] {
  const s = normalize(src);
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i] ?? "";
    if (/\s/.test(c)) {
      i++;
    } else if (/[\d.]/.test(c)) {
      const m = /^\d*\.?\d+|^\d+\.?/.exec(s.slice(i));
      if (!m) throw new ParseError("ตัวเลขไม่ถูกต้อง");
      out.push({ t: "num", v: Number(m[0]) });
      i += m[0].length;
    } else if (/[a-zA-Z]/.test(c)) {
      const m = /^[a-zA-Z]+/.exec(s.slice(i));
      let word = m?.[0] ?? c;
      i += word.length;
      // แยกคำออกเป็นชื่อฟังก์ชัน pi และตัวแปรตัวเดียว เช่น 2pix คือ 2 pi x
      while (word.length) {
        const fn = [...FUNCS, "pi"].find((f) => word.startsWith(f));
        if (fn) {
          out.push({ t: "id", v: fn });
          word = word.slice(fn.length);
        } else {
          out.push({ t: "id", v: word[0] ?? "" });
          word = word.slice(1);
        }
      }
    } else if ("+-*/^()".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
    } else {
      throw new ParseError(`อ่านเครื่องหมาย ${c} ไม่ออก`);
    }
  }
  return out;
}

export function parse(src: string): Node {
  const toks = tokenize(src);
  let pos = 0;
  const peek = (): Tok | undefined => toks[pos];
  const isOp = (v: string): boolean => {
    const t = peek();
    return t?.t === "op" && t.v === v;
  };

  function expr(): Node {
    const terms: Node[] = [term()];
    while (isOp("+") || isOp("-")) {
      const minus = isOp("-");
      pos++;
      const t = term();
      terms.push(minus ? { k: "neg", a: t } : t);
    }
    return terms.length === 1 ? (terms[0] as Node) : { k: "add", terms };
  }

  function startsPrimary(): boolean {
    const t = peek();
    return t !== undefined && (t.t === "num" || t.t === "id" || (t.t === "op" && t.v === "("));
  }

  function term(): Node {
    let left = unary();
    for (;;) {
      if (isOp("*")) {
        pos++;
        left = mul(left, unary());
      } else if (isOp("/")) {
        pos++;
        left = { k: "div", a: left, b: unary() };
      } else if (startsPrimary()) {
        left = mul(left, power()); // คูณโดยไม่มีเครื่องหมาย เช่น 2x หรือ (x+1)(x-1)
      } else {
        return left;
      }
    }
  }

  function mul(a: Node, b: Node): Node {
    const fa = a.k === "mul" ? a.factors : [a];
    return { k: "mul", factors: [...fa, b] };
  }

  function unary(): Node {
    if (isOp("-")) {
      pos++;
      return { k: "neg", a: unary() };
    }
    if (isOp("+")) {
      pos++;
      return unary();
    }
    return power();
  }

  function power(): Node {
    const base = primary();
    if (isOp("^")) {
      pos++;
      return { k: "pow", base, exp: unary() };
    }
    return base;
  }

  function primary(): Node {
    const t = peek();
    if (!t) throw new ParseError("นิพจน์จบไม่ครบ");
    pos++;
    if (t.t === "num") return { k: "num", v: t.v };
    if (t.t === "id") {
      if (t.v === "pi") return { k: "num", v: Math.PI };
      if (FUNCS.has(t.v)) {
        if (isOp("(")) return { k: "fn", name: t.v, arg: primary() };
        return { k: "fn", name: t.v, arg: power() };
      }
      return { k: "var", name: t.v };
    }
    if (t.v === "(") {
      const inner = expr();
      if (!isOp(")")) throw new ParseError("วงเล็บไม่ครบคู่");
      pos++;
      return inner;
    }
    throw new ParseError(`ไม่คาดว่าจะเจอ ${t.v} ตรงนี้`);
  }

  if (!toks.length) throw new ParseError("ยังไม่ได้ใส่คำตอบ");
  const tree = expr();
  if (pos < toks.length) throw new ParseError("มีบางส่วนที่อ่านไม่ออก");
  return tree;
}

export function evaluate(n: Node, env: Record<string, number>): number {
  switch (n.k) {
    case "num":
      return n.v;
    case "var": {
      const v = env[n.name];
      if (v === undefined) throw new ParseError(`ไม่รู้ค่าของ ${n.name}`);
      return v;
    }
    case "add":
      return n.terms.reduce((s, t) => s + evaluate(t, env), 0);
    case "mul":
      return n.factors.reduce((s, t) => s * evaluate(t, env), 1);
    case "div":
      return evaluate(n.a, env) / evaluate(n.b, env);
    case "pow":
      return Math.pow(evaluate(n.base, env), evaluate(n.exp, env));
    case "neg":
      return -evaluate(n.a, env);
    case "fn": {
      const x = evaluate(n.arg, env);
      const f: Record<string, (v: number) => number> = {
        sqrt: Math.sqrt, abs: Math.abs, sin: Math.sin, cos: Math.cos, tan: Math.tan,
        ln: Math.log, log: Math.log10, exp: Math.exp,
      };
      const fn = f[n.name];
      return fn ? fn(x) : Number.NaN;
    }
  }
}

export function variables(n: Node, out: Map<string, number> = new Map()): Map<string, number> {
  switch (n.k) {
    case "var":
      out.set(n.name, (out.get(n.name) ?? 0) + 1);
      break;
    case "add":
      n.terms.forEach((t) => variables(t, out));
      break;
    case "mul":
      n.factors.forEach((t) => variables(t, out));
      break;
    case "div":
      variables(n.a, out);
      variables(n.b, out);
      break;
    case "pow":
      variables(n.base, out);
      variables(n.exp, out);
      break;
    case "neg":
      variables(n.a, out);
      break;
    case "fn":
      variables(n.arg, out);
      break;
    case "num":
      break;
  }
  return out;
}

/* เทียบตัวเลขสองตัว absolute คือคลาดได้ไม่เกิน tol ใช้เมื่อโจทย์ให้ปัดทศนิยม
   ไม่เช่นนั้นเทียบแบบสัดส่วน ตัวเลขเล็กมากอย่าง 6 × 10⁻²⁸ จะไม่ถูกนับว่าเท่ากับ 0 */
function close(a: number, b: number, tol: number, absolute = false): boolean {
  if (a === b) return true;
  if (absolute) return Math.abs(a - b) <= tol;
  return Math.abs(a - b) <= tol * Math.max(Math.abs(a), Math.abs(b));
}

/* ใช้ตอนแทนค่าตัวแปรเทียบนิพจน์ ค่าใกล้ศูนย์จากการปัดเศษของเครื่องต้องนับว่าเท่ากัน */
function near(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));
}

/* สองนิพจน์เท่ากันไหม แทนค่าตัวแปรด้วยเลขสุ่มหลายชุดแล้วเทียบผล ใช้ seed คงที่ให้ผลซ้ำได้ */
export function equivalent(a: Node, b: Node, tol = 1e-9, absolute = false): boolean {
  const names = [...new Set([...variables(a).keys(), ...variables(b).keys()])];
  if (!names.length) return close(evaluate(a, {}), evaluate(b, {}), tol, absolute);
  let seed = 12345;
  const rand = (): number => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  let tried = 0;
  for (let i = 0; i < 40 && tried < 8; i++) {
    const env: Record<string, number> = {};
    for (const n of names) env[n] = Math.round((rand() * 8 - 4) * 1000) / 1000 + 0.137;
    const x = evaluate(a, env);
    const y = evaluate(b, env);
    if (!Number.isFinite(x) && !Number.isFinite(y)) continue;
    if (!near(x, y)) return false;
    tried++;
  }
  return tried >= 4;
}

function hasVar(n: Node): boolean {
  return variables(n).size > 0;
}

function stripSign(n: Node): Node {
  return n.k === "neg" ? stripSign(n.a) : n;
}

/* A collected radical sum keyed by its square-free radicand; 1 denotes a rational term.
   Keep the submitted structure: evaluating first would silently simplify wrong forms. */
type RadicalTerm = { p: number; q: number };
function radicalTerms(n: Node): Map<number, RadicalTerm> | null {
  const gcd = (a: number, b: number): number => b === 0 ? Math.abs(a) : gcd(b, a % b);
  const integer = (m: Node): number | null => {
    if (m.k === "neg" && m.a.k === "num" && Number.isSafeInteger(m.a.v)) return -m.a.v;
    return m.k === "num" && Number.isSafeInteger(m.v) ? m.v : null;
  };
  const rational = (m: Node): RadicalTerm | null => {
    const value = integer(m);
    if (value !== null) return { p: value, q: 1 };
    if (m.k !== "div") return null;
    const p = integer(m.a);
    const q = integer(m.b);
    return p !== null && q !== null && q > 1 && gcd(p, q) === 1 ? { p, q } : null;
  };
  const scalar = rational(n);
  if (scalar) return new Map([[1, scalar]]);
  if (n.k === "neg") {
    const inner = radicalTerms(n.a);
    if (!inner) return null;
    return new Map([...inner].map(([b, c]) => [b, { p: -c.p, q: c.q }]));
  }
  if (n.k === "fn" && n.name === "sqrt" && n.arg.k === "num") {
    let b = n.arg.v;
    if (!Number.isSafeInteger(b) || b < 2) return null;
    // Remove each prime once; finding it a second time proves a square factor.
    for (let d = 2; d * d <= b; d += d === 2 ? 1 : 2) {
      if (b % d === 0) {
        b /= d;
        if (b % d === 0) return null;
      }
    }
    return new Map([[n.arg.v, { p: 1, q: 1 }]]);
  }
  if (n.k === "add") {
    const result = new Map<number, RadicalTerm>();
    for (const term of n.terms) {
      const part = radicalTerms(term);
      if (!part) return null;
      for (const [b, c] of part) {
        if (c.p === 0 || result.has(b)) return null;
        result.set(b, c);
      }
    }
    return result;
  }
  if (n.k === "mul" && n.factors.length === 2) {
    const [a, b] = n.factors as [Node, Node];
    const left = rational(a);
    const coefficient = left ?? rational(b);
    const body = left ? b : a;
    if (!coefficient || coefficient.p === 0 || Math.abs(coefficient.p) === coefficient.q) return null;
    const terms = radicalTerms(body);
    if (!terms || (terms.size === 1 && terms.has(1)) || [...terms.values()].some((c) => c.q !== 1)) return null;
    // A factored sum is allowed, but the inner sum must have no remaining common factor.
    if ([...terms.values()].reduce((g, c) => gcd(g, c.p), 0) !== 1) return null;
    const result = new Map<number, RadicalTerm>();
    for (const [r, c] of terms) {
      const p = coefficient.p * c.p;
      if (!Number.isSafeInteger(p) || gcd(p, coefficient.q) !== 1) return null;
      result.set(r, { p, q: coefficient.q });
    }
    return result;
  }
  if (n.k === "div") {
    const q = integer(n.b);
    const terms = radicalTerms(n.a);
    if (q === null || q <= 1 || !terms || [...terms.values()].some((c) => c.q !== 1 || c.p === 0)) return null;
    if ([...terms.values()].reduce((g, c) => gcd(g, c.p), q) !== 1) return null;
    return new Map([...terms].map(([b, c]) => [b, { p: c.p, q }]));
  }
  return null;
}

/* รูปที่โจทย์บังคับ
   factored   เป็นผลคูณของพหุนามดีกรีต่ำกว่า เช่น (x-1)(x+3) หรือ 2(x-1)^2
   expanded   ไม่มีวงเล็บที่มีตัวแปรถูกคูณหรือยกกำลัง เช่น x^2-4x+3
   vertex     รูป a(x-h)^2+k ซึ่งมีตัวแปรปรากฏแค่ครั้งเดียว */
export function hasForm(n: Node, form: string): boolean {
  if (form === "radical") return radicalTerms(n) !== null;
  if (form === "vertex") {
    const vars = [...variables(n).values()];
    return vars.length === 1 && vars[0] === 1;
  }
  if (form === "fraction") {
    // จำนวนเต็ม หรือเศษส่วนอย่างต่ำหนึ่งตัว เช่น 5/11 หรือ -3/4 ไม่รับทศนิยมหรือ 45/99
    const top = stripSign(n);
    const isInt = (m: Node): boolean => m.k === "num" && Number.isInteger(m.v);
    if (isInt(top)) return true;
    if (top.k !== "div" || !isInt(top.a) || !isInt(top.b)) return false;
    const p = (top.a as { v: number }).v;
    const q = (top.b as { v: number }).v;
    const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
    return q > 1 && gcd(Math.abs(p), q) === 1;
  }
  if (form === "simplified") {
    // เอกนามที่จัดเสร็จแล้ว เช่น 4x^6 หรือ a^7/b^2 ตัวแปรแต่ละตัวปรากฏครั้งเดียว
    // ยกกำลังได้เฉพาะตัวแปรหรือตัวเลข และแต่ละผลคูณมีตัวเลขไม่เกินหนึ่งตัว
    if ([...variables(n).values()].some((c) => c > 1)) return false;
    let ok = true;
    const walk = (m: Node): void => {
      if (m.k === "pow" && hasVar(m.base) && m.base.k !== "var") ok = false;
      if (m.k === "mul" && m.factors.filter((f) => !hasVar(f)).length > 1) ok = false;
      if (m.k === "add") m.terms.forEach(walk);
      if (m.k === "mul") m.factors.forEach(walk);
      if (m.k === "neg") walk(m.a);
      if (m.k === "div") {
        walk(m.a);
        walk(m.b);
      }
      if (m.k === "pow") walk(m.base);
    };
    walk(n);
    return ok;
  }
  if (form === "factored") {
    // แยกครบแล้ว ผลคูณของตัวประกอบที่แยกต่อด้วยจำนวนเต็มไม่ได้อีก และดึงตัวร่วมที่เป็นตัวเลขออกหมดแล้ว
    // เช่นรับ 2(x-2)(x+2) แต่ไม่รับ 2(x^2-4) 3(2x^2-3x) (2x-2)(x+1) หรือ 3(x+2)(x-1/3)
    const top = stripSign(n);
    const factors = top.k === "mul" ? top.factors : [top];
    const withVar = factors.filter((f) => hasVar(f));
    if (!withVar.length) return false;
    if (factors.length === 1 && top.k !== "pow") return false; // ไม่มีอะไรถูกแยกออกมาเลย
    for (const f of factors) {
      if (!hasVar(f)) {
        if (!Number.isInteger(evaluate(f, {}))) return false;
        continue;
      }
      const base = f.k === "pow" && !hasVar(f.exp) ? f.base : f;
      if (!irreducibleFactor(base)) return false;
    }
    return true;
  }
  if (form === "expanded") {
    // รูปผลสำเร็จ ผลบวกของเอกนามที่จัดเสร็จแล้ว และไม่มีพจน์ที่คล้ายกันสองพจน์
    const terms: Node[] = [];
    const flat = (m: Node): void => {
      if (m.k === "add") m.terms.forEach(flat);
      else if (m.k === "neg" && m.a.k === "add") terms.push(m); // -(a+b) ยังไม่ได้กระจาย
      else terms.push(stripSign(m));
    };
    flat(n);
    const seen = new Set<string>();
    for (const t of terms) {
      const sig = monomialSignature(t);
      if (sig === null || seen.has(sig)) return false;
      seen.add(sig);
    }
    return true;
  }
  return true;
}

/* สัมประสิทธิ์ของพหุนามตัวแปรเดียว จากค่าที่ x = 0, 1, ..., 8 ด้วยผลต่างจำกัด เรียงจากดีกรีต่ำไปสูง
   คืน null ถ้าไม่ใช่พหุนามดีกรีไม่เกิน 6 หรือสัมประสิทธิ์ไม่ใช่จำนวนเต็ม */
function integerPoly(f: Node, v: string): number[] | null {
  const N = 9;
  const ys: number[] = [];
  for (let i = 0; i < N; i++) ys.push(evaluate(f, { [v]: i }));
  if (ys.some((y) => !Number.isFinite(y))) return null;
  // ผลต่างจำกัดชั้นที่ k ที่ x = 0 หารด้วย k! คือสัมประสิทธิ์ของ x(x-1)...(x-k+1)
  const diffs: number[] = [];
  let row = ys.slice();
  for (let k = 0; k < N; k++) {
    diffs.push(row[0] ?? 0);
    row = row.slice(1).map((y, i) => y - (row[i] ?? 0));
  }
  const deg = diffs.reduce((d, x, k) => (Math.abs(x) > 1e-6 ? k : d), 0);
  if (deg > 6) return null;
  // แปลงจากฐานแฟกทอเรียลเป็นฐานกำลังปกติ
  let coeffs: number[] = [0];
  let basis: number[] = [1];
  let fact = 1;
  for (let k = 0; k <= deg; k++) {
    if (k > 0) {
      fact *= k;
      const next = new Array(basis.length + 1).fill(0) as number[];
      basis.forEach((c, i) => {
        next[i + 1] = (next[i + 1] ?? 0) + c;
        next[i] = (next[i] ?? 0) - (k - 1) * c;
      });
      basis = next;
    }
    const scale = (diffs[k] ?? 0) / fact;
    coeffs = basis.map((c, i) => (coeffs[i] ?? 0) + scale * c);
  }
  const rounded = coeffs.map((c) => Math.round(c));
  if (rounded.some((c, i) => Math.abs(c - (coeffs[i] ?? 0)) > 1e-6)) return null;
  while (rounded.length > 1 && rounded[rounded.length - 1] === 0) rounded.pop();
  return rounded;
}

/* ตัวประกอบที่แยกต่อด้วยจำนวนเต็มไม่ได้แล้ว ตัวประกอบที่มีหลายตัวแปรตรวจไม่ได้ ถือว่าผ่าน */
function irreducibleFactor(f: Node): boolean {
  const vars = [...variables(f).keys()];
  if (vars.length !== 1) return true;
  const c = integerPoly(f, vars[0] ?? "x");
  if (!c) return false; // สัมประสิทธิ์ไม่ใช่จำนวนเต็ม เช่น x - 1/3
  const deg = c.length - 1;
  if (deg < 1) return false;
  const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
  if (c.reduce((g, x) => gcd(g, x), 0) !== 1) return false; // ยังดึงตัวเลขออกได้ เช่น 2x - 2
  if (deg === 1) return true;
  if (c[0] === 0) return false; // ยังดึง x ออกได้
  // ทฤษฎีบทรากตรรกยะ ถ้ามีราก p/q ก็ยังแยกได้อีก
  const a0 = Math.abs(c[0] ?? 0);
  const an = Math.abs(c[deg] ?? 0);
  const divisors = (m: number): number[] => [...Array(m).keys()].map((i) => i + 1).filter((d) => m % d === 0);
  for (const p of divisors(a0)) {
    for (const q of divisors(an)) {
      for (const r of [p / q, -p / q]) {
        const val = c.reduce((sum, coef, i) => sum + coef * r ** i, 0);
        if (Math.abs(val) < 1e-9) return false;
      }
    }
  }
  // ดีกรีสี่ขึ้นไปอาจแยกเป็นกำลังสองคูณกำลังสองได้ เช่น x^4 + 4 ไม่ตรวจกรณีนี้
  return true;
}

/* ลายเซ็นของเอกนาม เช่น 3x^2y ได้ "x^2 y^1" ใช้หาพจน์ที่คล้ายกัน
   คืน null ถ้าไม่ใช่เอกนามที่จัดเสร็จ คือมีวงเล็บที่มีตัวแปร หารด้วยตัวแปร ตัวแปรซ้ำ หรือตัวเลขหลายตัว */
function monomialSignature(t: Node): string | null {
  const factors = t.k === "mul" ? t.factors : [t];
  const powers = new Map<string, number>();
  let numbers = 0;
  for (const f of factors) {
    if (!hasVar(f)) {
      numbers++;
      continue;
    }
    if (f.k === "var" && !powers.has(f.name)) powers.set(f.name, 1);
    else if (f.k === "pow" && f.base.k === "var" && !hasVar(f.exp) && !powers.has(f.base.name)) {
      powers.set(f.base.name, evaluate(f.exp, {}));
    } else return null;
  }
  if (numbers > 1) return null;
  return [...powers.entries()].sort().map(([v, e]) => `${v}^${e}`).join(" ");
}

export interface Task {
  type: "number" | "expr" | "set" | "choice" | "point" | "order" | "self";
  answer?: string | number | (string | number)[];
  form?: string;
  tolerance?: number;
  wrong?: { answer: string | number | (string | number)[]; message: string }[];
  alternatives?: number[][]; // ข้อแบบ order ลำดับอื่นที่ถูกด้วย
}

export interface Verdict {
  ok: boolean;
  message: string;
}

const FORM_MSG: Record<string, string> = {
  factored: "ค่าเท่ากันแล้ว แต่โจทย์ให้เขียนเป็นผลคูณ ลองแยกตัวประกอบต่อ",
  expanded: "ค่าเท่ากันแล้ว แต่ยังไม่อยู่ในรูปผลสำเร็จ กระจายวงเล็บ หารให้เสร็จ และรวมพจน์ที่คล้ายกันให้หมด",
  vertex: "ค่าเท่ากันแล้ว แต่โจทย์ให้เขียนในรูป a(x − h)² + k",
  fraction: "ค่าเท่ากันแล้ว แต่ต้องตอบเป็นเศษส่วนอย่างต่ำ เช่น 5/11",
  simplified: "ค่าเท่ากันแล้ว แต่ยังจัดให้อยู่ในรูปอย่างง่ายไม่เสร็จ รวมตัวแปรที่ซ้ำกันและคูณตัวเลขให้เหลือตัวเดียว",
  radical: "ค่าเท่ากันแล้ว แต่ยังจัดกรณฑ์ไม่เสร็จ ถอดกำลังสองสมบูรณ์ รวมพจน์ที่คล้ายกัน ลดเศษส่วน และทำส่วนให้ไม่มีราก",
};

function squash(s: string): string {
  return s.replace(/\s|\*/g, "").toLowerCase();
}

function asList(v: Task["answer"]): string[] {
  if (Array.isArray(v)) return v.map(String);
  return String(v ?? "").split(",").map((s) => s.trim()).filter(Boolean);
}

function sameSet(a: string[], b: string[], tol: number, absolute: boolean): boolean {
  if (a.length !== b.length) return false;
  const left = a.map((s) => evaluate(parse(s), {})).sort((x, y) => x - y);
  const right = b.map((s) => evaluate(parse(s), {})).sort((x, y) => x - y);
  return left.every((x, i) => close(x, right[i] ?? Number.NaN, tol, absolute));
}

/* ตรวจคำตอบของนักเรียน input เป็นข้อความเสมอ ข้อแบบ point ส่งมาเป็น "x,y" ข้อแบบ choice ส่งเลขตัวเลือก */
export function checkAnswer(task: Task, input: string): Verdict {
  const tol = task.tolerance ?? 1e-9;
  const abs = task.tolerance !== undefined;
  if (!input.trim()) return { ok: false, message: "ยังไม่ได้ใส่คำตอบ" };
  try {
    if (task.type === "order") {
      // ลำดับที่ถูกคือ 0, 1, 2, ... ตามที่เขียนใน steps
      const mine = asList(input).map(Number).join(",");
      const right = [asList(task.answer).map(Number), ...(task.alternatives ?? [])].map((o) => o.join(","));
      if (right.includes(mine)) return { ok: true, message: "ถูกต้อง" };
      const w = task.wrong?.find((x) => asList(x.answer).map(Number).join(",") === mine);
      return { ok: false, message: w?.message ?? "ลำดับยังไม่ถูก ดูว่าแต่ละขั้นใช้เหตุผลจากขั้นไหนก่อนหน้า" };
    }
    if (task.type === "choice") {
      const ok = Number(input) === Number(task.answer);
      const w = task.wrong?.find((x) => Number(x.answer) === Number(input));
      return { ok, message: ok ? "ถูกต้อง" : (w?.message ?? "ยังไม่ใช่ ลองอ่านตัวเลือกอีกครั้ง") };
    }
    if (task.type === "set" || task.type === "point") {
      const mine = asList(input);
      if (task.type === "point") {
        const want = asList(task.answer);
        const ok = mine.length === 2 && mine.every((s, i) => close(evaluate(parse(s), {}), evaluate(parse(want[i] ?? ""), {}), tol, abs));
        const w = task.wrong?.find((x) => {
          const wl = asList(x.answer);
          return mine.every((s, i) => close(evaluate(parse(s), {}), evaluate(parse(wl[i] ?? ""), {}), tol, abs));
        });
        return { ok, message: ok ? "ถูกต้อง" : (w?.message ?? "ยังไม่ใช่ ลองลากจุดใหม่") };
      }
      if (sameSet(mine, asList(task.answer), tol, abs)) return { ok: true, message: "ถูกต้อง" };
      const w = task.wrong?.find((x) => sameSet(mine, asList(x.answer), tol, abs));
      return { ok: false, message: w?.message ?? "ยังไม่ใช่ ตรวจว่าได้คำตอบครบทุกตัวและไม่เกิน" };
    }
    const mine = parse(input);
    const want = parse(String(task.answer));
    if (task.type === "number" && variables(mine).size) {
      return { ok: false, message: "ข้อนี้ต้องตอบเป็นตัวเลข" };
    }
    if (equivalent(mine, want, tol, abs)) {
      if (task.form && !hasForm(mine, task.form)) {
        // คำตอบผิดที่ค่าเท่ากับเฉลยแต่ผิดรูป เช่นแยกตัวประกอบไม่ครบ เทียบตัวอักษรเพื่อขึ้นข้อความของตัวเอง
        const same = task.wrong?.find((x) => squash(String(x.answer)) === squash(input));
        if (same) return { ok: false, message: same.message };
        return { ok: false, message: FORM_MSG[task.form] ?? "ค่าเท่ากันแล้ว แต่ยังไม่อยู่ในรูปที่โจทย์ถาม" };
      }
      return { ok: true, message: "ถูกต้อง" };
    }
    const w = task.wrong?.find((x) => equivalent(mine, parse(String(x.answer)), tol, abs));
    return { ok: false, message: w?.message ?? "ยังไม่ใช่ ลองตรวจการคำนวณอีกครั้ง" };
  } catch (e) {
    if (e instanceof ParseError) return { ok: false, message: `อ่านคำตอบไม่ออก ${e.message}` };
    throw e;
  }
}
