# Continuation of docs/plan.md

Historical report for the initial 2026-10-28 revision. Claude subsequently expanded the upper-secondary corpus; current counts, system fixes and verification are in [system-followup.md](system-followup.md).

## Scope and preservation

Continue the existing approved Astro + MDX curriculum plan. Preserve all prior work. No commits, publishing, repository creation, or deployment are authorized by this continuation.

The repository has an unborn `main` branch and all source files were untracked at handoff. Work continues in place with disjoint chapter ownership; a worktree cannot preserve these uncommitted sources without creating a commit.

## Baseline observed on 2026-10-28

- 23 chapters have complete exercise sets. Eight additional lower-secondary chapters and 19 upper-secondary chapters require completion.
- `npm run typecheck`: passed.
- `npm test`: 969 cases passed.
- `uv run tools/check_math.py`: 926 content checks and 253 exercise checks passed.
- `npm run build`: 180 pages built and distribution checks passed.
- Existing build warnings concern large dependency chunks and JSXGraph's internal eval.

## Work allocation

| Task | Owned files | Status |
| --- | --- | --- |
| Complete lower secondary | Chapters 21, 24, 26–31 and matching board modules | Complete; 77 new exercises; 8 scoped builds checked |
| Complete upper secondary A | Chapters 32–40 and matching board modules | Complete; 40 instructional pages, 76 exercises, 6 board modules; 9 scoped builds checked |
| Complete upper secondary B | Chapters 41–50 and matching board modules | Complete; 40 instructional pages, 80 exercises, 7 graphs in 6 modules |
| Integrate and verify | Shared infrastructure, graph fix in chapter 3, chapter 17 coverage, documentation, whole-site checks | Complete for local delivery; automated and browser checks passed |

All authors follow AUTHORING.md and chapter 25. They do not edit shared schemas or the site catalog. Integration will verify metadata, generated links, answer validation, mathematical checks, and browser behavior.

## Review targets

- Chapter 3: small powers are nearly invisible against a fixed vertical scale.
- Chapter 4: inspect fraction label positioning in the actual browser.
- Chapters 18–19: check corresponding-angle terminology consistency.
- Chapter 17: the official IPST Project 14 page confirms angle-angle-side in the M.2 book 2 congruence chapter: https://proj14.ipst.ac.th/m2/m2-math-book2/math-m2b2-027/ . Added its theorem, derivation through ASA, worked example, misconception check, and one exercise. No source examples were copied.
- Final checks must be repeated after all writers finish; baseline results do not verify new content.

## Integration observations

- Chapter 3's scale now follows the selected exponent; labels and the caption explicitly explain the changing scale. Browser interaction at n = 1, 4, 10, 1 succeeded without JavaScript errors.
- Chapter 4's fraction label aligned with its point at the initial -3/4 setting in the current browser. The old report was not reproduced, so no speculative label edit was made.
- Mobile viewport 390px: no document horizontal overflow on the inspected graph and exercise pages. The number-answer exercise rejected 999 and accepted its intended answer, showing the correct feedback and solved state.
- Reload restored the solved exercise. Mobile navigation opened and Escape closed it, restoring focus to the menu button.
- Baseline static browser sweep: 53 pages, 61 graph instances, no missing graph SVG or page errors. Slider endpoints were exercised. Graphs inside closed solutions were opened before inspection; their initial deferred rendering is intentional.
- Development-server dependency optimization produced a stale MathLive import after concurrent Astro sync. Browser checks switched to the built static preview to test the delivery artifact independently of that development cache.
- Reproduced a MathLive keyboard bug: its deferred `insertLineBreak` input cleared the verdict after Enter's keydown. The input handler now checks the submitted answer for that event instead of clearing it. A real-browser regression first failed with empty feedback, then passed for correct feedback, equivalent-but-wrong-form feedback, and clearing feedback after an actual formula edit. Scoped chapter 25 build and distribution checks passed (8 pages).
- Normalized four corresponding-angle references in chapter 19 to the terminology already used in chapter 18.

## Worker handoff evidence

Lower-secondary author reported 15 new MDX files and 77 new exercises; existing prose and boards were retained. All eight scoped builds and distribution checks passed. Whole-site checks will be observed again by the coordinator after all authors finish. The author now independently reviews chapters 41–50.

The author's cleanup of its own verified `.dc-build/m3-finish` and temporary authoring files/logs was rejected by automatic approval policy. Those files remain; no retry or bypass was attempted.

## Independent review

- Chapters 32–40: reviewer read all instructional and exercise text against the plan and catalog. Found ambiguous wording for “neither” versus “not both” in chapter 32's counting example and clubs exercise. Sent to the author for explicit wording. No other important mathematical errors or named plan omissions were reported. Board source was inspected, but browser verification remains separate.
- Chapters 41–50: reviewer found chapter 45 finance incorrectly restricted to the basic route although shared exercises require it, and chapter 43's clubs-counting example omitted the assumption that the two groups are disjoint. Counterexample enumeration produced 18 pairs for disjoint groups and 14 for a one-member overlap. Sent to the author for correction. All named topics in this scope were present.
- Coordinator browser check: an actual pointer drag to (1, 4) in the quadratic vertex exercise produced the value `1, 4` and correct feedback.

All reported ambiguities and the finance metadata issue have been corrected in the source. The 76 generic exercise hints across chapters 32–40 were replaced with task-specific progressive hints. Each new upper-secondary instructional page now includes three worked examples and mathematical checks.

The upper-secondary author independently reviewed new chapter 28–31 content, including circle arc conditions, surface and volume dimensions, probability simulations, and height/distance problems. No additional material finding was reported in that reviewed scope.

## Final automated verification

Observed by the coordinator after all authors reported stable source:

| Check | Observed result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | 1,379 cases passed |
| `uv run tools/check_math.py` | 1,213 content checks and 486 exercise checks passed |
| Complete curriculum inventory | 50 chapters, 218 instructional pages, 460 exercises; no structural problems |
| `npm run build` | 320 pages built; distribution checks passed for headings, IDs, links, assets and formula rendering |
| Mobile browser width sweep | All 320 pages inspected at 390 × 844; no document horizontal overflow |
| Full graph browser sweep | 71 pages, 80 graph instances; all rendered without page errors; slider endpoints and checkbox toggles exercised |
| Route integration | Finance visible in both tracks; basic set navigation skips power sets, advanced navigation includes it |
| Formula keyboard regression | Enter retains correct/wrong-form verdicts; typing clears stale feedback on the final build |

Desktop and mobile home screenshots were visually inspected. The binomial endpoint (n = 12, p = 1) and the adaptive powers graph in dark mode were also inspected at mobile width. A final left-margin adjustment prevents binomial y-axis labels from being clipped at 390px; typecheck, full build and focused browser checks were repeated for that adjustment.

The chapter 45 sequence plot now includes the minimum selectable tenth term (-13). The chapter 50 probability plot includes probability 1 at both degenerate binomial endpoints. These fixes preserve the full allowed slider ranges.

The known dependency warnings for bundle size and JSXGraph's internal eval remain. These checks do not establish performance on a physical phone, teacher acceptance of every explanation, or a hosted deployment. The project lifecycle remains `unconfirmed`.

Some ignored scoped builds and authoring helpers in TEMP remain because automatic approval rejected cleanup with the reason `blocked by policy`. They were preserved without retries or alternate deletion routes.
