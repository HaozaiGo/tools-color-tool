module.exports = async (page, assert, lang) => {
  await page.fill('#val-cmyk','cmyk(0%, 100%, 100%, 0%)'); await page.press('#val-cmyk','Enter');
  assert.equal(await page.inputValue('#val-hex'),'#FF0000');
  await page.fill('#val-hsl','hsl(-60, 100%, 50%)'); await page.press('#val-hsl','Enter');
  assert.equal(await page.inputValue('#val-hex'),'#FF00FF');
  await page.fill('#val-hex','invalid'); await page.press('#val-hex','Enter');
  assert.match(await page.locator('.toast').last().textContent(), lang === 'en' ? /Invalid/ : /格式错误/);
  assert.equal(await page.textContent('#color-hex-display'),'#FF00FF');
  await page.click('[data-tab="palette"]');
  assert.equal(await page.locator('.tab.active').getAttribute('data-tab'),'palette');
  assert.equal(await page.locator('[data-tab="converter"]').getAttribute('aria-selected'),'false');
  assert.ok(await page.locator('.palette-swatch').count() >= 3);
  await page.click('[data-tab="gradient"]');
  assert.equal(await page.locator('.tab.active').getAttribute('data-tab'),'gradient');
  assert.equal(await page.locator('[data-tab="gradient"]').getAttribute('aria-selected'),'true');
  assert.equal(await page.locator('#panel-converter').isVisible(),false);
  assert.equal(await page.locator('#panel-gradient').isVisible(),true);
  await page.waitForFunction(() => {
    const active = getComputedStyle(document.querySelector('[data-tab="gradient"]')).backgroundColor;
    const inactive = getComputedStyle(document.querySelector('[data-tab="converter"]')).backgroundColor;
    return active === 'rgb(59, 130, 246)' && inactive !== active;
  });
  await page.selectOption('#gradient-type','radial');
  assert.match(await page.textContent('#gradient-css-code'),/radial-gradient/);
  assert.notEqual(await page.locator('#gradient-preview').evaluate(el => getComputedStyle(el).backgroundImage),'none');
};
