async (page) => {
  const origin = new URL(page.url()).origin;
  await page.setViewportSize({width:390,height:844});
  await page.goto(origin + '/m4-6/49-quantitative-data/positions/');
  await page.evaluate(() => document.fonts.ready);
  const width = await page.evaluate(() => ({viewport:innerWidth,width:document.documentElement.scrollWidth}));
  if (width.width > width.viewport + 1) throw new Error('Percentile lesson overflows: '+JSON.stringify(width));

  await page.goto(origin + '/m4-6/35-exponents/exercises/');
  const exercise = page.locator('section.ex').filter({has:page.locator('h2').filter({hasText:'รวมพจน์ที่มีราก'})});
  await exercise.locator('.ex-input').fill('sqrt(75)');
  await exercise.locator('.ex-check').click();
  const rejected = await exercise.locator('.ex-feedback').innerText();
  if (!rejected.includes('ค่าเท่ากันแล้ว')) throw new Error('Equivalent unsimplified radical must receive form feedback: '+rejected);
  await exercise.locator('.ex-input').fill('5sqrt(3)');
  await exercise.locator('.ex-check').click();
  const accepted = await exercise.locator('.ex-feedback').innerText();
  if (accepted !== 'ถูกต้อง') throw new Error('Simplified radical must be accepted: '+accepted);

  await page.goto(origin + '/m4-6/38-analytic-geometry/ellipse-hyperbola/?from=bookmark#ไฮเพอร์โบลา');
  await page.waitForURL(url => url.pathname.endsWith('/hyperbola/'));
  const legacy = await page.evaluate(() => ({path:location.pathname,query:location.search,hash:decodeURIComponent(location.hash)}));
  if (legacy.query !== '?from=bookmark' || legacy.hash !== '#นิยามด้วยผลต่างระยะ') throw new Error('Legacy topic route lost its destination: '+JSON.stringify(legacy));
  return {mobileWidth:width,unsimplified:rejected,simplified:accepted,legacy};
}
