import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "smol-toml";
import { md, mdInline } from "../src/lib/markdown.ts";

const mathCount = (html: string): number => (html.match(/class="katex"/g) ?? []).length;

test("renders inline math in nested raw HTML tables and divs", () => {
  const html = md(String.raw`<div class="question"><table><tbody><tr><td>$x^2$</td><td><span>$\frac{1}{2}$</span></td></tr></tbody></table></div>`);
  assert.equal(mathCount(html), 2);
  assert.match(html, /class="table-wrap"/);
  assert.match(html, /class="question"/);
});

test("renders display math inside a raw HTML block", () => {
  const html = md(String.raw`<div>
$$
\frac{a}{b}=c
$$
</div>`);
  assert.equal(mathCount(html), 1);
  assert.match(html, /class="katex-display"/);
});

test("keeps existing Markdown and inline HTML math behavior", () => {
  assert.equal(mathCount(md("A $x$ and <em>$y$</em>\n\n$$\nz^2\n$$")), 3);
  assert.match(mdInline("$x$"), /^<span class="katex"/);
});

test("preserves code, SVG, attributes, escaped dollars and unpaired dollars", () => {
  const html = md(String.raw`<div data-price="$99">
<code>$x$</code><pre>$y$</pre><svg viewBox="0 0 20 20"><text>$z$</text><path d="M0 0 L10 10" /></svg>
\$literal\$ and $unpaired
</div>`);
  assert.equal(mathCount(html), 0);
  assert.match(html, /<code>\$x\$<\/code>/);
  assert.match(html, /<pre>\$y\$<\/pre>/);
  assert.match(html, /<text>\$z\$<\/text>/);
  assert.match(html, /viewBox="0 0 20 20"/);
  assert.match(html, /data-price="\$99"/);
  assert.ok(html.includes(String.raw`\$literal\$ and $unpaired`));
  assert.equal(mathCount(md("\\$literal\\$ and `$code$`")), 0);
});

test("invalid raw HTML math fails with caller context", () => {
  assert.throws(() => md(String.raw`<div>$\notARealCommand{x}$</div>`, "broken-task.toml"), /broken-task\.toml[\s\S]*Undefined control sequence/);
});

test("renders the actual exercise fields with the public Markdown functions", (t) => {
  const root = fileURLToPath(new URL("../src/content/chapters/", import.meta.url));
  const files = fs.readdirSync(root, { recursive: true, encoding: "utf8" }).filter((name) => name.endsWith(`${path.sep}task.toml`));
  let fields = 0;
  for (const name of files) {
    const task = parse(fs.readFileSync(path.join(root, name), "utf8"));
    for (const key of ["statement", "solution", "hints", "choices", "steps", "label", "unit"]) {
      const values = Array.isArray(task[key]) ? task[key] : [task[key]];
      for (const value of values) {
        if (typeof value !== "string") continue;
        const render = ["choices", "steps", "label", "unit"].includes(key) ? mdInline : md;
        const html = render(value, `${name}:${key}`);
        assert.doesNotMatch(html, /class="katex-error"/, `${name}:${key}`);
        fields++;
      }
    }
  }
  assert.ok(files.length > 0);
  t.diagnostic(`Rendered ${fields} fields from ${files.length} exercise files`);
});
