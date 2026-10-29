async (page) => {
  const origin = new URL(page.url()).origin;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin + '/');
  await page.locator('.theme-btn').focus();
  await page.keyboard.press('Tab');
  if (await page.evaluate(() => Boolean(document.activeElement.closest('.sidebar')))) {
    throw new Error('Closed mobile navigation must not receive keyboard focus');
  }
  await page.locator('.menu-btn').click();
  if (!(await page.evaluate(() => Boolean(document.activeElement.closest('.sidebar'))))) {
    throw new Error('Opening navigation must move focus inside');
  }
  const last = page.locator('.sidebar a[href]:visible').last();
  await last.focus();
  await page.keyboard.press('Tab');
  if (!(await page.evaluate(() => Boolean(document.activeElement.closest('.sidebar'))))) {
    throw new Error('Tab must stay inside open mobile navigation');
  }
  await page.locator('.drawer-close').focus();
  await page.keyboard.press('Shift+Tab');
  if (!(await page.evaluate(() => Boolean(document.activeElement.closest('.sidebar'))))) {
    throw new Error('Shift+Tab must stay inside open mobile navigation');
  }
  await page.keyboard.press('Escape');
  if (await page.locator('.menu-btn').getAttribute('aria-expanded') !== 'false') {
    throw new Error('Escape must close navigation');
  }
  if (!(await page.locator('.menu-btn').evaluate(el => el === document.activeElement))) {
    throw new Error('Closing navigation must restore focus to its trigger');
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  if (await page.locator('.sidebar').evaluate(el => el.inert)) {
    throw new Error('Desktop navigation must remain interactive after resizing');
  }
  await page.locator('.sidebar a[href]').first().focus();
  await page.setViewportSize({ width: 390, height: 844 });
  if (!(await page.locator('.sidebar').evaluate(el => el.inert))) {
    throw new Error('Resizing back to mobile must hide navigation from focus');
  }
  await page.goto(origin + '/m1/03-exponents/meaning/');
  await page.locator('.menu-btn').click();
  await page.locator('.sidebar .toc-inline a').first().click();
  if (await page.locator('.menu-btn').getAttribute('aria-expanded') !== 'false' || await page.locator('.main').evaluate(el => el.inert)) {
    throw new Error('Activating a generated in-page navigation link must close the drawer and enable the content');
  }
  return { closedFocus: 'passed', focusContainment: 'passed', escape: 'passed', resize: 'passed', inPageLinks: 'passed' };
}
