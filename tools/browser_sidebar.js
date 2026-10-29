async (page) => {
  const origin = new URL(await page.url()).origin;
  await page.setViewportSize({width:1280,height:900});
  const settled = () => page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const position = () => page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar');
    const current = sidebar.querySelector('a[aria-current="page"]');
    const box = sidebar.getBoundingClientRect();
    const link = current.getBoundingClientRect();
    return {top:sidebar.scrollTop,current:current.getAttribute('href'),visible:link.top>=box.top&&link.bottom<=box.bottom,windowY:scrollY};
  });
  await page.goto(origin+'/m1/01-integers/');
  await page.locator('.sidebar a[href="/m4-6/47-statistics-data/"]').click();
  await settled();
  const chapter = await position();
  if (!chapter.visible || chapter.top === 0) throw new Error('Late chapter must remain visible after navigation: '+JSON.stringify(chapter));
  await page.locator('.sidebar .nav-section.is-open > ul:not(.toc-inline) > li > a').first().click();
  await settled();
  const lesson = await position();
  if (!lesson.visible || lesson.top === 0 || lesson.windowY !== 0) throw new Error('Lesson navigation must preserve the sidebar without scrolling the article: '+JSON.stringify(lesson));
  await page.reload();
  await settled();
  const reloaded = await position();
  if (!reloaded.visible || Math.abs(reloaded.top-lesson.top)>2) throw new Error('Reload must retain sidebar position: '+JSON.stringify({lesson,reloaded}));
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await settled();
  await page.locator('.menu-btn').click();
  const mobile = await page.evaluate(() => {
    const sidebar = document.querySelector('.sidebar').getBoundingClientRect();
    const header = document.querySelector('.drawer-head').getBoundingClientRect();
    const current = document.querySelector('.sidebar a[aria-current="page"]').getBoundingClientRect();
    const close = document.querySelector('.drawer-close').getBoundingClientRect();
    return {currentVisible:current.top>=header.bottom&&current.bottom<=sidebar.bottom,closeVisible:close.top>=0&&close.bottom<=innerHeight};
  });
  if (!mobile.currentVisible || !mobile.closeVisible) throw new Error('Mobile drawer must show the current lesson and close control: '+JSON.stringify(mobile));
  await page.locator('.drawer-close').click();
  if (await page.locator('.menu-btn').getAttribute('aria-expanded')!=='false') throw new Error('Mobile drawer must close');
  return {chapter,lesson,reloaded,mobile};
}
