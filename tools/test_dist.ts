// Regression checks for false success after a failed static build.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "descartes-dist-test-"));
function check() {
  const result = spawnSync(process.execPath, [path.join(root, "tools/check_dist.ts")], {
    cwd: root, encoding: "utf8", env: { ...process.env, DC_OUT: fixture },
  });
  if (result.error) throw result.error;
  return result;
}
try {
  const empty = check();
  assert.notEqual(empty.status, 0, "An empty build directory must fail validation");
  assert.match(empty.stderr, /ไม่มีหน้า HTML/);

  fs.writeFileSync(path.join(fixture, "index.html"), '<!doctype html><html><body><h1 id="content">Test</h1><a href="#content">Content</a></body></html>');
  const valid = check();
  assert.equal(valid.status, 0, valid.stderr);
  assert.match(valid.stdout, /ตรวจ 1 หน้า/);

  fs.writeFileSync(path.join(fixture, "index.html"), '<!doctype html><html><body><h1>Test</h1><a href="/missing/">Broken</a></body></html>');
  const broken = check();
  assert.notEqual(broken.status, 0, "A broken internal link must fail validation");
  assert.match(broken.stderr, /missing/);
  console.log("Dist checks passed: empty output rejected, valid page accepted, broken link rejected");
} finally {
  // Remove only the exact disposable fixture created by this test invocation.
  fs.rmSync(fixture, { recursive: true, force: true });
}
