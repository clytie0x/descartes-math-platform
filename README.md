# descartes

เว็บเรียนคณิตศาสตร์ ม.1 ถึง ม.6 อ่านไล่ทีละบทตามลำดับหนังสือเรียน สสวท. ฉบับปรับปรุง 2560 มีกราฟที่ลากได้ และแบบฝึกหัดที่ตรวจคำตอบในเบราว์เซอร์ ทำแบบเดียวกับ [zero-index](https://zero.teerapat.codes/)

สถานะ `unconfirmed` เริ่ม 28 ต.ค. 2569 แผนทั้งหมดอยู่ที่ [docs/plan.md](docs/plan.md) สารบัญ 50 บทอยู่ที่ `src/site.toml`

All 50 chapters are authored, with 232 instructional pages and 492 exercises. The deployment target is [math.teerapat.codes](https://math.teerapat.codes/), published by the [Pages workflow](https://github.com/clytie0x/descartes-math-platform/actions/workflows/pages.yml). Current system fixes and local verification are recorded in [docs/system-followup.md](docs/system-followup.md); [docs/progress.md](docs/progress.md) records the earlier revision. Physical-device classroom acceptance remains unverified.

## สร้างเว็บในเครื่อง

ต้องมี Node 24 ขึ้นไป และ [uv](https://docs.astral.sh/uv/) สำหรับตัวตรวจคณิต

```bash
npm ci
npm run dev
```

เปิดที่ http://localhost:4321 แก้ไฟล์แล้วหน้าเว็บเปลี่ยนเอง

ก่อนส่งงานต้องผ่านทั้งสี่คำสั่ง

| คำสั่ง | ตรวจอะไร |
|---|---|
| `npm run typecheck` | TypeScript ทั้งสคริปต์หน้าเว็บและเครื่องมือ |
| `npm test` | ตัวตรวจคำตอบทุกข้อ รูปกรณฑ์ การแปลงสูตรใน HTML ดิบ redirect และตัวตรวจผล build |
| `uv run tools/check_math.py` | คำนวณซ้ำทุกตัวอย่างในหน้าเนื้อหาและทุกเฉลยด้วย SymPy |
| `npm run build` | สร้างเว็บลง `dist/` สูตรผิดแม้แต่สูตรเดียว build พัง แล้วตรวจลิงก์ id และหัวหน้าทุกหน้า |

## โครง

| ที่ | คืออะไร |
|---|---|
| `src/site.toml` | สารบัญทั้งเว็บ 50 บท และลำดับบทของสายพื้นฐานกับเพิ่มเติม |
| `src/content/chapters/<slug>/` | เนื้อหาของบท ไฟล์ `.mdx` หน้าละไฟล์ แบบฝึกหัดอยู่ใน `exercises/` |
| `src/components/mdx/` | กล่องนิยาม ตัวอย่าง ลองคิดก่อน และกราฟ ที่ใช้ในไฟล์ `.mdx` |
| `src/scripts/` | TypeScript ของหน้าเว็บ `site.ts` ทุกหน้า `board.ts` กราฟ `exercise.ts` ตรวจคำตอบ `mathexpr.ts` ตัวอ่านนิพจน์ |
| `src/scripts/boards/` | นิยามกราฟลากได้ ไฟล์ละบท |
| `src/lib/` | อ่านสารบัญ เนื้อหา และแบบฝึกหัดตอน build |
| `tools/` | ตัวตรวจ |

วิธีเขียนบทใหม่อยู่ที่ [AUTHORING.md](AUTHORING.md)

## Browser regression

With the local static preview running, the mobile navigation regression can be repeated using the Playwright CLI already used for this project:

```powershell
npx --yes --package @playwright/cli playwright-cli --session descartes-check open http://127.0.0.1:4321/
npx --yes --package @playwright/cli playwright-cli --session descartes-check run-code --filename=tools/browser_navigation.js
npx --yes --package @playwright/cli playwright-cli --session descartes-check run-code --filename=tools/browser_math.js
npx --yes --package @playwright/cli playwright-cli --session descartes-check close
```

After a complete build, `node tools/test_redirects.ts --dist` additionally checks that the legacy pages and their mapped destination anchors exist in `dist/`.
