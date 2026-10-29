# System follow-up after upper-secondary deepening

Date: 2026-10-29

## Scope

Implement the four system findings in section 6 of `upper-deepening-plan.md`, verify the expanded graphs and figures, and refresh stale documentation. No commit, external repository creation, publication, or deployment is included.

The current corpus is 50 chapters, 232 instructional pages and 492 exercises. Upper secondary has 94 instructional pages; a fresh character count found the minimum at 3,366 Thai characters after excluding frontmatter and check comments. The previous 218-page/460-exercise report describes the earlier revision.

## Tasks

| Task | Ownership | Completion evidence |
| --- | --- | --- |
| Simplified radical answer form | Expression checker, focused tests, chapter 35 exercises 09–10, authoring documentation | Red/green tests covering simplified and unsimplified equivalent answers |
| Math inside raw exercise HTML | Markdown pipeline and focused tests | Correct rendering without changing code, SVG or escaped text; invalid formulas fail |
| Old chapter 38 URLs | Static redirects and focused compatibility checks | Both old URLs resolve to appropriate new pages in the built static site |
| Intermittent build diagnosis | Read-only evidence review; coordinator runs sequential builds | Exact original failure evidence and repeated serial build outcomes; no speculative dependency changes |
| Expanded UI verification | Coordinator | Mobile/desktop graph and figure inspection and functional browser checks |
| Mobile navigation keyboard fix | Coordinator, `site.ts`, browser regression | Closed menu excluded from Tab; open menu contains focus; Escape and resizing work |
| Documentation and repeatable checks | Coordinator | Current counts, command entry points and evidence recorded |

The source repository still has an unborn branch and all original source is untracked. Work continues in place with disjoint ownership, preserving existing edits. Previously blocked cleanup operations are not retried.

## Findings before changes

- The navigation browser regression failed because Tab after the theme button focused the closed mobile sidebar.
- The full-curriculum structural helper remains in ignored temporary output; it is not currently a CI command. Do not blindly promote its old 3–5-page cap: the newer approved deepening plan deliberately splits long chapters into additional pages.

## Verification

The following results were observed against the expanded corpus and integrated changes. The earlier local results in `progress.md` describe a different revision.

| Check | Observed result |
| --- | --- |
| `npm test` | 1,494 answer cases; 54 radical-form cases; 6 Markdown tests including 2,276 fields from 492 exercises; 2 legacy routes / 16 navigation cases; empty/valid/broken distribution cases all passed |
| `npm run typecheck` | Passed |
| `uv run tools/check_math.py` | 1,723 content checks and 528 exercise checks passed |
| Sequential diagnostic builds | Three complete builds with separate output/cache directories passed; each produced and validated 336 pages |
| Final `npm run build` | Passed; 336 generated pages, including two compatibility pages; headings, IDs, links, assets and formulas validated |
| `node tools/test_redirects.ts --dist` | Both emitted legacy pages and mapped destination anchors verified |
| Browser navigation regression | Closed drawer excluded from Tab; open drawer contains focus; Escape restores trigger focus; resizing and generated in-page links passed |
| Browser math regression | Simplified radical accepted; equivalent unsimplified radical received form feedback; legacy hyperbola topic preserved its query and mapped fragment |
| Interactive graph sweep | 85 graph instances on 75 pages rendered; range endpoints and checkbox toggles exercised without page errors |
| Upper-secondary SVG review | 65 figures from 57 pages reviewed through browser captures and independent reviewers |
| Final mobile-width sweep | All 334 normal pages passed at 390 × 844 with no document horizontal overflow; the two compatibility pages were verified separately |

## Corrections from visual and keyboard review

- Six SVG viewports were enlarged where labels or a circle extended beyond their bounds: distance/midpoint, parabola, the radian circle, the finance timeline, the transport bar chart, and the travel-time histogram. The timeline's unit label was moved away from its last tick.
- A long inline list in the percentile lesson caused 407px document width at a 390px viewport. It is now display math, allowing the existing formula scroll container to contain the list.
- Final captures of seven affected pages (eight figures) showed no text outside SVG bounds. They were visually inspected after rendering. A misleading earlier truth-tree capture was retaken with stable scrolling; its source geometry did not need editing.
- `initDrawer()` previously bound only links present at startup. A delegated handler now also closes the drawer for the in-page TOC links created later, re-enabling the target content.

## Intermittent build evidence and limits

The original failure is recorded in Claude's subagent log `agent-a4142c56471db0105.jsonl`, lines 176–183, under session `42a27bb4-3f42-466d-b4e3-067cc07ef9da`. The failing command piped Astro output through `tail -15`, which discarded the actual ReferenceError name/message and then ran distribution validation without checking the build exit code. The remaining trace contains `loadExercises`, a generic browser-API hint and a libuv `UV_HANDLE_CLOSING` assertion. A subsequent retry passed.

The browser-API hint alone does not prove browser API use: the installed Astro helper selects that hint when the error text contains `document` or `window`. The current exercise loader uses TOML parsing and raw module data. Concurrency remains a hypothesis, not an established cause.

The new distribution regression prevents the misleading “0 pages passed” result. Diagnostic runs retained full output and real exit codes in `.dc-build/system-followup/build-01.log` through `build-03.log`. All three passed. The final build log is retained separately. No speculative framework or dependency change was made, and no claim is made that the historical intermittent crash is fixed.

## Delivery boundaries

No dependencies were added. The focused regressions are included in `npm test`, so the existing CI build job will run them. The two browser regressions can be rerun from the README instructions. Static compatibility uses client-side replacement plus manual fallback links, suitable for GitHub Pages; it is not a server HTTP 301 response.

At this local verification checkpoint, no commit, push, external repository creation or deployment had been performed. The user subsequently authorized committing and publishing on 2026-10-29. Physical-phone testing and teacher acceptance remain unverified. Previously blocked cleanup paths were preserved; current ignored logs and captures are retained as evidence. The lifecycle remains `unconfirmed`.
