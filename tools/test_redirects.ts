// Verify static redirect behavior without starting Astro or a browser.
// Add --dist after a full build to check emitted pages and mapped fragment IDs.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = fs.readFileSync(path.join(root, "src/pages/m4-6/38-analytic-geometry/[legacy].astro"), "utf8");
const frontmatter = source.split("---")[1]!.split("const { primary,")[0]!.replace("export function", "function");
const script = /<script is:inline define:vars=\{\{ primary, fragments \}\}>([\s\S]*?)<\/script>/.exec(source)![1]!;
interface Redirect {
  params: { legacy: string };
  props: { primary: string; secondary: string; fragments: Record<string, string> };
}
function routes(only?: string): Redirect[] {
  return vm.runInNewContext(`${frontmatter}\ngetStaticPaths()`, { process: { env: { DC_ONLY: only } } });
}
assert.equal(routes("m4-6/44-probability").length, 0);
assert.equal(routes("m4-6/38-analytic-geometry").length, 2);
const redirects = routes();
assert.equal(redirects.length, 2);
const base = "/m4-6/38-analytic-geometry/";
assert.equal(redirects[0]!.params.legacy, "circle-parabola");
assert.equal(redirects[0]!.props.primary, `${base}circle/`);
assert.equal(redirects[0]!.props.secondary, `${base}parabola/`);
assert.equal(redirects[1]!.params.legacy, "ellipse-hyperbola");
assert.equal(redirects[1]!.props.primary, `${base}ellipse/`);
assert.equal(redirects[1]!.props.secondary, `${base}hyperbola/`);

let cases = 0;
for (const route of redirects) {
  const { primary, secondary, fragments } = route.props;
  const origin = "https://math.teerapat.codes";
  function redirect(hash: string, query = ""): string {
    let result = "";
    vm.runInNewContext(script, {
      primary, fragments, URL,
      location: {
        href: `${origin}${base}${route.params.legacy}/${query}${hash}`,
        hash, search: query, replace: (url: string) => { result = url; },
      },
    });
    cases++;
    return result;
  }
  assert.equal(redirect(""), `${origin}${primary}`);
  assert.equal(redirect("#สรุป", "?track=adv"), new URL(`${primary}?track=adv#สรุป`, origin).href);
  assert.equal(redirect("#%E0%A4%A"), `${origin}${primary}#%E0%A4%A`);
  assert.equal(redirect("#__proto__"), `${origin}${primary}#__proto__`);
  for (const [old, target] of Object.entries(fragments)) {
    assert.equal(redirect(`#${encodeURIComponent(old)}`, "?track=adv"), new URL(target.replace("#", "?track=adv#"), origin).href);
    const [url, heading] = target.split("#");
    const mdx = fs.readFileSync(path.join(root, "src/content/chapters", `${url!.slice(1, -1)}.mdx`), "utf8");
    assert.ok(mdx.includes(`## ${heading}`), `Mapped heading must exist: ${target}`);
  }
  for (const target of [primary, secondary]) {
    assert.ok(fs.existsSync(path.join(root, "src/content/chapters", `${target.slice(1, -1)}.mdx`)));
  }
  if (process.argv.includes("--dist")) {
    const dist = path.resolve(root, process.env.DC_OUT ?? "dist");
    const html = fs.readFileSync(path.join(dist, base, route.params.legacy, "index.html"), "utf8");
    assert.ok(html.includes(`href="${primary}"`));
    assert.ok(html.includes(`href="${secondary}"`));
    assert.ok(html.includes('rel="canonical"'));
    assert.ok(html.includes("location.replace(target.href)"));
    for (const target of Object.values(fragments)) {
      const [url, heading] = target.split("#");
      const page = fs.readFileSync(path.join(dist, url!, "index.html"), "utf8");
      assert.ok(page.includes(`id="${heading}"`), `Emitted heading must exist: ${target}`);
    }
  }
}
assert.ok(source.includes("<noscript>"));
console.log(`Redirect checks passed: ${redirects.length} routes, ${cases} navigation cases${process.argv.includes("--dist") ? ", emitted HTML verified" : ""}`);
