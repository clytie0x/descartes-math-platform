# /// script
# requires-python = ">=3.11"
# dependencies = ["sympy==1.14.0"]
# ///
"""คำนวณซ้ำทุกคำตอบในเว็บด้วย SymPy ถ้าไม่ตรงให้จบด้วย exit code 1

    uv run tools/check_math.py

ตรวจสองแหล่งใน src/content/chapters
1. หน้าเนื้อหา ทุกความเห็น {/* check: ... */} ในไฟล์ .mdx ต้องได้ True
2. แบบฝึกหัด ใน exercises/<ข้อ>/task.toml
   truth   ค่าที่ถูกต้อง เขียนเป็นนิพจน์ SymPy คำตอบใน answer ต้องเท่ากับค่านี้
           และคำตอบผิดใน wrong ต้องไม่เท่ากับค่านี้
   checks  รายการเงื่อนไขที่ต้องได้ True ใช้กับข้อที่เครื่องตรวจไม่ได้ เช่นข้อวาดกราฟ

ในนิพจน์ใช้ได้ทุกอย่างของ SymPy ตัวแปร x y t a b c h k และตัวช่วยสองตัว
   vertex(f)  จุดยอดของฟังก์ชันกำลังสอง คืนค่า (h, k)
   roots(f)   รากจริงของ f = 0 เรียงจากน้อยไปมาก
"""

from __future__ import annotations

import re
import sys
import tomllib
from pathlib import Path

import sympy
from sympy.parsing.sympy_parser import (convert_xor, implicit_multiplication_application, parse_expr,
                                        standard_transformations)

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "src" / "content" / "chapters"

SYMS = {name: sympy.Symbol(name, real=True) for name in "xytabchk"}
TRANSFORMS = standard_transformations + (implicit_multiplication_application, convert_xor)


def only_var(f: sympy.Expr) -> sympy.Symbol:
    free = sorted(f.free_symbols, key=str)
    if len(free) != 1:
        raise ValueError(f"{f} ต้องมีตัวแปรเดียว")
    return free[0]


def vertex(f: sympy.Expr) -> tuple:
    v = only_var(f)
    p = sympy.Poly(sympy.expand(f), v)
    if p.degree() != 2:
        raise ValueError(f"{f} ไม่ใช่ฟังก์ชันกำลังสอง")
    a, b, _ = p.all_coeffs()
    h = sympy.nsimplify(-b / (2 * a))
    return (h, sympy.simplify(f.subs(v, h)))


def roots(f: sympy.Expr) -> list:
    v = only_var(f)
    return sorted(sympy.solve(sympy.Eq(f, 0), v), key=lambda r: float(r))


NS = {**{k: getattr(sympy, k) for k in dir(sympy) if not k.startswith("_")}, **SYMS,
      "vertex": vertex, "roots": roots}


SAFE_BUILTINS = {f.__name__: f for f in (range, len, abs, sorted, sum, min, max, all, any, round, int, float, list,
                                           tuple, set, zip, map, enumerate, reversed, bool, str)}


def run(code: str):
    # ใส่ชื่อทั้งหมดเป็น globals ฟังก์ชัน lambda ในเงื่อนไขจะได้มองเห็นชื่อของ SymPy
    return eval(code, {"__builtins__": SAFE_BUILTINS, **NS})


def holds(value) -> bool:
    """True ของ Python หรือ true ของ SymPy (ผลของ < > และ And) ถือว่าผ่าน"""
    return value is True or value is sympy.true


def student(s: str) -> sympy.Expr:
    """อ่านคำตอบแบบที่นักเรียนพิมพ์ เช่น 2(x+1)  x^2-4x  3/4  sqrt(2)"""
    s = s.replace("−", "-").replace("×", "*")
    return parse_expr(s, local_dict=dict(SYMS), transformations=TRANSFORMS)


def same(a, b) -> bool:
    if isinstance(a, (list, tuple)) or isinstance(b, (list, tuple)):
        a, b = list(a), list(b)
        return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    return sympy.simplify(sympy.sympify(a) - sympy.sympify(b)) == 0


def as_value(task: dict, ans) -> object:
    kind = task["type"]
    if kind == "set":
        items = ans if isinstance(ans, list) else str(ans).split(",")
        return sorted((student(str(s)) for s in items), key=lambda r: float(r))
    if kind == "point":
        return tuple(student(s) for s in str(ans).split(","))
    return student(str(ans))


def check_pages() -> tuple[int, list[str]]:
    n, errors = 0, []
    for f in sorted(CONTENT.rglob("*.mdx")):
        for m in re.finditer(r"\{/\*\s*check:\s*(.*?)\s*\*/\}", f.read_text(encoding="utf-8"), re.S):
            n += 1
            where = f.relative_to(ROOT).as_posix()
            try:
                if not holds(run(m.group(1))):
                    errors.append(f"{where}: ไม่จริง {m.group(1)}")
            except Exception as e:  # สูตรในความเห็นเขียนผิดก็ต้องรายงาน
                errors.append(f"{where}: คำนวณไม่ได้ {m.group(1)}  ({e})")
    return n, errors


def check_tasks() -> tuple[int, list[str]]:
    n, errors = 0, []
    for f in sorted(CONTENT.rglob("exercises/*/task.toml")):
        task = tomllib.loads(f.read_text(encoding="utf-8"))
        where = f.parent.relative_to(ROOT).as_posix()
        try:
            if "truth" in task:
                n += 1
                truth = run(task["truth"])
                if not same(as_value(task, task["answer"]), truth):
                    errors.append(f"{where}: answer {task['answer']} ไม่เท่ากับ truth {truth}")
                for w in task.get("wrong", []):
                    # ข้อที่มี form คำตอบผิดอาจค่าเท่ากับเฉลยแต่ผิดรูปได้ เช่นแยกตัวประกอบไม่ครบ
                    if "form" not in task and same(as_value(task, w["answer"]), truth):
                        errors.append(f"{where}: คำตอบผิด {w['answer']} ดันเท่ากับ truth")
            elif task["type"] not in ("choice", "order", "self"):
                errors.append(f"{where}: ข้อแบบ {task['type']} ต้องมี truth")
            for c in task.get("checks", []):
                n += 1
                if not holds(run(c)):
                    errors.append(f"{where}: ไม่จริง {c}")
        except Exception as e:
            errors.append(f"{where}: คำนวณไม่ได้ ({e})")
    return n, errors


def main() -> int:
    np_, e1 = check_pages()
    nt, e2 = check_tasks()
    errors = e1 + e2
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"ตรวจผ่าน {np_} จุดในหน้าเนื้อหา และ {nt} จุดในแบบฝึกหัด")
    return 0


if __name__ == "__main__":
    sys.exit(main())
