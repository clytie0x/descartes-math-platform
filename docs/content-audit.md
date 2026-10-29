# Curriculum content audit

Date: 2026-10-29

## Scope and method

Review all 50 registered chapters, including instructional prose, definitions,
formula conditions, worked examples, exercise statements and solutions. Check
topic coverage against the project plans and the IPST 2017 curriculum guides.
Automated arithmetic checks supplement the semantic review; they do not prove
that every surrounding explanation is correct.

Primary references:

- [IPST lower-secondary curriculum guide](https://www.scimath.org/e-books/8380/8380.pdf), learning standards and content tables.
- [IPST upper-secondary curriculum guide](https://www.scimath.org/e-books/8379/8379.pdf), printed pages 14–27, core and additional mathematics.

## Coverage

The source inventory contains 50 chapter indexes, 232 instructional pages and
492 exercises. All registered chapters have an index, lessons and exercises.
Lesson numbers are consecutive, chapter membership in each upper-secondary
track matches `site.toml`, and no unregistered MDX chapter was found. All
exercises have statements and solutions.

| Chapters | MDX files, including indexes | Exercise files | Semantic review |
| --- | ---: | ---: | --- |
| 1–20 | 111 | 198 | Complete |
| 21–37 | 92 | 169 | Complete |
| 38–43 | 39 | 55 | Complete |
| 44–50 | 40 | 70 | Complete |
| Total | 282 | 492 | Complete |

Reviewers read Thai prose, definitions, theorems, worked examples, figure labels,
captions and Board descriptions. Exercise review included statements, hints,
solutions, choices and feedback for wrong answers. Early truncated reads were
not counted as complete; separate passes filled those gaps. SVG coordinate
boilerplate and mathematical check comments were excluded from prose-only
passes, rather than treated as proof of the surrounding explanation.

## Topic coverage against the guides

This is a topic-presence comparison with the cited 2017 guides, not a claim that
the site reproduces every textbook exercise or certifies every learning outcome.
No missing major topic group was identified in this comparison.

| Guide topic group | Site chapters |
| --- | --- |
| Lower-secondary numbers, powers, ratios, equations and polynomials | 1, 3–4, 6–7, 10–11, 14–15, 20–23, 25, 27 |
| Construction, geometry, transformations, measurement and trigonometric ratios | 2, 5, 12–13, 17–19, 24, 28–29, 31 |
| Coordinates, data displays, statistical summaries and probability | 8–9, 16, 26, 30 |
| Sets, logic, real numbers, powers and functions | 32–37 |
| Analytic geometry, trigonometric functions, matrices and vectors | 38–41 |
| Complex numbers, counting, probability and binomial theorem | 42–44 |
| Sequences, limits, series, financial mathematics and calculus | 45–46 |
| Data collection, qualitative/quantitative summaries and distributions | 47–50 |

The upper-secondary comparison includes rational polynomial equations and
inequalities, function composition/inverses and step functions, inverse
trigonometric functions, transpose, three-dimensional vectors, circular
permutations, infinite series, annuities, continuity, derivatives/integrals and
uniform/binomial/normal distributions.

## Corrections

The audit corrected 75 content source files without adding or removing chapters,
lessons or exercises. Main answer keys remained unchanged; corrections concern
reasoning, conditions, completeness of explanations and misleading feedback.

| Chapters | Corrected issues |
| --- | --- |
| 1–5 | Distinguish vertical level difference from spatial distance; ensure the road/bisector construction has an intersection; align an exponent misconception with its actual wrong answer; correct decimal-place reasoning in the fuel solution; qualify pyramid and cube sections; avoid assuming a cone's apex angle is acute. |
| 7–10 | Correct 1/9 km to about 111 m; use a stated VAT rate; distinguish horizontal lines from the x-axis itself; handle coincident/missing intercepts and discrete trip counts; recognize that ages can form statistical data; treat matching totals as consistency checks; allow rounding totals of 99/101; limit conclusions from counts; qualify Pythagorean-triple scaling. |
| 14–20 | Correct multiplication/division precedence and binary units; handle median ties and asymmetric data; repair the impossible right-triangle construction; remove parallel markings from an exercise asking whether parallelism follows; include all five congruence criteria and the missing 75-degree interior angle; separate the kite perimeter/angle problems; cover a degenerate proof case; correct factorization definitions and principal-root feedback. |
| 21–27 | Base integer rounding on the solved inequality; qualify division by expressions that may vanish; remove false universal factorization rules; state the constant-term condition for quadratic substitutions; avoid inferring raw-data symmetry from a box plot; include vertical-line/intercept exceptions. |
| 33, 37–40 | Make the certificate condition biconditional; qualify exponential steepness and pH modelling; use absolute coordinate differences for lengths; handle inverse-sine endpoints and SSA boundary cases; permit valid equivalence proofs; distinguish coefficient dependence from repeated whole equations and include vertical lines. |
| 41–43 | State zero-vector and direction conditions; explain signed direction cosines; handle zero projection residuals; avoid claiming a vertical force necessarily lifts an object; cover axis arguments and root-polygon boundaries; remove the assumption that every higher-degree real polynomial has a real root; distinguish required from forbidden team members. |
| 44–50 | Correct exact ratio wording; define nominal interest rates as decimals; qualify geometric-sequence growth and discontinuity examples; distinguish bias from the sign of each individual estimate; qualify systematic-sampling intervals, self-selection and missing-data claims; avoid causal claims in Simpson's example; use the actual score range; qualify binomial-to-normal approximation. |

Two specialist modelling references were checked where the prose extends beyond
pure mathematics: [IUPAC's pH definition](https://goldbook.iupac.org/terms/view/P04524)
and [NIST's binary prefixes](https://physics.nist.gov/cuu/Units/binary.html).
Financial and tax rates in examples are stated assumptions, rather than claims
about current products or regulations.

## Verification observed

| Check | Result |
| --- | --- |
| Source inventory reconciliation | 50 chapters, 232 lessons, 492 exercises; no structural errors |
| `uv run tools/check_math.py` | 1,728 content checks and 528 exercise checks passed |
| `npm test` | 1,494 answer cases; 54 radical-form cases; six Markdown tests, including 2,276 fields from 492 tasks; redirect and distribution regressions passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; 336 generated pages and distribution validation |
| `node tools/test_redirects.ts --dist` | Two legacy routes and 16 navigation cases passed, including emitted HTML |
| Independent correction review | All changed content hunks reviewed; the final SSA sine-equals-one issue was corrected and rechecked; no remaining reportable regression found |
| Browser sweep | All 70 affected routes loaded at 390 × 844, had content/headings, no KaTeX error elements and no document horizontal overflow |
| Desktop visual check | The revised factorization explanation and its displayed counterexample rendered correctly with the answer expanded |

Local diagnostic logs and the route-sweep results remain under ignored
`.dc-build/`. The normal test/build commands above remain reproducible from the
repository.

## Limits and publication

This is an AI-assisted academic content review with reproducible mathematical
checks and a separate adversarial correction review. It is not teacher acceptance
or a guarantee that no error can remain. This pass did not revalidate every SVG
coordinate or interact with every graph; the earlier graph/figure sweeps are
recorded separately in `system-followup.md`. Physical-phone and classroom
acceptance remain unverified.

Release gate: the content commit must complete the
[GitHub Pages workflow](https://github.com/clytie0x/descartes-math-platform/actions/workflows/pages.yml)
and the corrected text must be observed at [the public HTTPS site](https://math.teerapat.codes/).
Local checks alone do not establish publication.
