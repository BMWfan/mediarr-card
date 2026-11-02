import { chromium } from '../../dev/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = fileURLToPath(new URL('../../', import.meta.url));
const runtime = process.env.HA_DEV_RUNTIME_DIR || path.join(root, 'dev/.runtime');
const base = `http://127.0.0.1:${process.env.HA_DEV_PORT || 8124}`;
const auth = JSON.parse(await fs.readFile(path.join(runtime, 'local-auth.json'), 'utf8'));
const fixture = JSON.parse(await fs.readFile(path.join(root, 'tests/fixtures/plex.json'), 'utf8'));
await fs.rm(path.join(runtime, 'test-results.json'), {force:true});
await fs.rm(path.join(runtime, 'dashboard.png'), {force:true});
const errors = [];
const passed = [];
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--no-proxy-server'],
});
async function setState(value) {
  const response = await fetch(`${base}/api/states/sensor.plex_mediarr_dev`, {
    method: 'POST', headers: {Authorization: `Bearer ${auth.access_token}`, 'Content-Type': 'application/json'},
    body: JSON.stringify(value),
  });
  assert.ok(response.ok, `fixture API returned ${response.status}`);
}
try {
  await setState(fixture);
  const page = await browser.newPage();
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(({ auth, base }) => localStorage.setItem('hassTokens', JSON.stringify({
    hassUrl: base, clientId: base + '/', ...auth, expires: Date.now() + auth.expires_in * 1000,
  })), { auth, base });
  await page.goto(base + '/mediarr-test/test');
  // Playwright CSS locators traverse Home Assistant's open shadow roots.
  const card = page.locator('mediarr-card');
  await card.waitFor();
  await card.evaluate(el => { el.setConfig({...el.config, view:'legacy'}); el.hass=el._hass; });
  await card.locator('.media-item-title').filter({hasText:'Mediarr Cloud Test'}).waitFor();
  passed.push('authenticated dashboard renders Plex fixture');
  await card.locator('.section-header').click();
  await card.locator('.section-content.collapsed').waitFor({state:'attached'});
  await card.locator('.section-header').click();
  await card.locator('.section-content.collapsed').waitFor({state:'detached'});
  passed.push('section collapses and expands');
  await card.locator('.media-item').first().click();
  assert.ok((await card.locator('.media-info').textContent()).includes('Mediarr Cloud Test'));
  passed.push('media selection updates details');
  const details = card.locator('.media-details-panel');
  assert.equal(await details.getAttribute('open'), '');
  assert.equal(await details.locator('.media-details-synopsis').textContent(), fixture.attributes.data[0].summary);
  const detailText = await details.textContent();
  for (const value of ['8.4', 'Alex Example', 'Sam Sample', 'Dana Director', 'Adventure', '112 min']) {
    assert.ok(detailText.includes(value), `missing detail: ${value}`);
  }
  await details.locator('summary').click();
  assert.equal(await details.getAttribute('open'), null);
  await details.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await details.getAttribute('open'), '');
  passed.push('synopsis, rating, cast and metadata render; details toggle with mouse and keyboard');
  await page.mouse.move(0, 0);
  const banner = card.locator('.media-content');
  await banner.scrollIntoViewIfNeeded();
  const before = await banner.boundingBox();
  const cardBefore = await card.boundingBox();
  const transforms = await banner.locator('.media-background').evaluateAll(els => els.map(el => getComputedStyle(el).transform));
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  const after = await banner.boundingBox();
  const cardAfter = await card.boundingBox();
  const relative = (box, parent) => ({x:box.x-parent.x,y:box.y-parent.y,width:box.width,height:box.height});
  assert.deepEqual(relative(after, cardAfter), relative(before, cardBefore), 'banner geometry changes on hover');
  assert.deepEqual(await banner.locator('.media-background').evaluateAll(els => els.map(el => getComputedStyle(el).transform)), transforms, 'backdrop zoom changes on hover');
  passed.push('banner and crossfade layers stay stable on hover');

  await page.screenshot({path:path.join(runtime,'dashboard.png'),fullPage:true});

  const opener = card.locator('.mediarr-open-button');
  const originalUrl = page.url();
  const sidebarCount = await page.locator('ha-sidebar').count();
  await opener.click();
  const overlay = page.locator('mediarr-overlay-host');
  const dialog = overlay.locator('dialog');
  await dialog.waitFor();
  assert.equal(await dialog.evaluate(el => el.matches(':modal')), true);
  const bounds = await dialog.boundingBox();
  assert.equal(bounds.x,0);
  assert.equal(bounds.y,0);
  assert.equal(bounds.width,1280);
  assert.equal(bounds.height,720);
  assert.equal(page.url(),originalUrl);
  assert.equal(await page.locator('ha-sidebar').count(),sidebarCount);
  const expanded = overlay.locator('mediarr-card');
  await expanded.locator('.media-details-synopsis').waitFor();
  assert.equal(await expanded.locator('.mediarr-open-button').count(),0);
  passed.push('fullscreen top-layer overlay opens without navigation or sidebar changes');
  const search = expanded.locator('.mediarr-search');
  await search.fill('not-a-movie');
  assert.equal(await expanded.locator('.media-item:visible').count(),0);
  assert.ok((await expanded.locator('.mediarr-search-status').textContent()).startsWith('0'));
  await search.fill('development fixture');
  await expanded.locator('.media-item:visible').waitFor();
  await expanded.locator('.media-item:visible').click();
  assert.ok((await expanded.locator('.media-details-panel').textContent()).includes('Alex Example'));
  passed.push('overlay search matches synopsis and selection shows movie details');
  await expanded.evaluate(el => { void el.sections.seer._openSeasonModal('Series fixture', el); });
  await expanded.locator('.mediarr-modal-overlay').waitFor();
  await expanded.locator('#season-select').selectOption('first');
  await expanded.locator('.mediarr-btn-cancel').click();
  await expanded.locator('.mediarr-modal-overlay').waitFor({state:'detached'});
  await expanded.evaluate(el => { void el.sections.seer._openStatusModal('Request fixture', el); });
  await expanded.locator('.mediarr-modal-overlay').waitFor();
  await page.keyboard.press('Escape');
  await expanded.locator('.mediarr-modal-overlay').waitFor({state:'detached'});
  assert.equal(await dialog.isVisible(),true);
  passed.push('nested season/status dialogs stay interactive and Escape dismisses them before the overlay');
  await search.fill('');
  await setState({state:'1',attributes:{data:[{title:'Overlay live update',summary:'Updated sensor'}]}});
  await expanded.locator('.media-item-title').filter({hasText:'Overlay live update'}).waitFor();
  await setState(fixture);
  await expanded.locator('.media-item-title').filter({hasText:'Mediarr Cloud Test'}).waitFor();
  await page.screenshot({path:path.join(runtime,'overlay-desktop.png'),fullPage:false});
  await page.keyboard.press('Escape');
  await overlay.waitFor({state:'detached'});
  assert.equal(await opener.evaluate(el => el.matches(':focus')),true);
  assert.equal(page.url(),originalUrl);
  passed.push('overlay receives live sensor updates; Escape restores card and keyboard focus');
  await opener.click();
  await dialog.waitFor();
  await overlay.locator('.mediarr-overlay-close').click();
  await overlay.waitFor({state:'detached'});
  await opener.click();
  await dialog.waitFor();
  await page.evaluate(()=>history.back());
  await overlay.waitFor({state:'detached'});
  assert.equal(page.url(),originalUrl);
  passed.push('overlay Back button and browser Back return to the original dashboard');

  const sparse = {title:'Sparse fixture'};
  await setState({state:'1',attributes:{data:[sparse]}});
  await card.locator('.media-item-title').filter({hasText:sparse.title}).waitFor();
  await card.locator('.media-item').first().click();
  assert.equal(await details.locator('dl').count(), 0, 'metadata from previous movie leaked');
  assert.equal(await details.locator('.media-details-synopsis').count(), 0);
  assert.ok((await details.locator('p').textContent()).length > 0);
  passed.push('missing metadata shows fallback without stale movie details');
  const unsafe = {title:'Escaping fixture', summary:'<img src=x onerror=alert(1)>', cast:[{name:'<b>Actor</b>'}], rating:0};
  await setState({state:'1',attributes:{data:[unsafe]}});
  await card.locator('.media-item-title').filter({hasText:unsafe.title}).waitFor();
  await card.locator('.media-item').first().click();
  assert.equal(await details.locator('.media-details-synopsis').textContent(), unsafe.summary);
  assert.equal(await details.locator('img, b, script').count(), 0);
  assert.ok((await details.textContent()).includes('<b>Actor</b>'));
  assert.ok((await details.locator('dd').first().textContent()).includes('0'));
  passed.push('metadata HTML is escaped and zero ratings are preserved');

  await page.setViewportSize({width:390,height:844});
  const longSummary = 'A story about an unexpected journey. '.repeat(100);
  await setState({state:'1',attributes:{data:[{title:'Mobile detail fixture',summary:longSummary}]}});
  await card.locator('.media-item-title').filter({hasText:'Mobile detail fixture'}).waitFor();
  await card.locator('.media-item').first().click();
  assert.equal(await details.locator('.media-details-synopsis').textContent(), longSummary.trim());
  const mobileLayout = await details.evaluate(panel => {
    const text = panel.querySelector('.media-details-synopsis');
    return {width:panel.clientWidth,scrollWidth:panel.scrollWidth,textHeight:text.clientHeight,textScrollHeight:text.scrollHeight};
  });
  assert.ok(mobileLayout.scrollWidth <= mobileLayout.width + 1, 'details overflow horizontally on mobile');
  assert.equal(mobileLayout.textHeight,mobileLayout.textScrollHeight, 'long synopsis is clipped');
  await page.screenshot({path:path.join(runtime,'details-mobile.png'),fullPage:true});
  passed.push('long synopsis remains readable without horizontal overflow on mobile');
  await opener.click();
  await dialog.waitFor();
  const mobileBounds = await dialog.boundingBox();
  assert.equal(mobileBounds.x,0);
  assert.equal(mobileBounds.y,0);
  assert.equal(mobileBounds.width,390);
  assert.equal(mobileBounds.height,844);
  const overflow = await dialog.evaluate(el => el.scrollWidth > el.clientWidth);
  assert.equal(overflow,false);
  await expanded.locator('.media-item').click();
  await page.screenshot({path:path.join(runtime,'overlay-mobile.png'),fullPage:false});
  await overlay.locator('.mediarr-overlay-close').click();
  await overlay.waitFor({state:'detached'});
  assert.equal(page.url(),originalUrl);
  passed.push('mobile overlay fills viewport and closes without horizontal overflow');

  await setState({state:'0',attributes:{...fixture.attributes,data:[]}});
  await card.locator('.plex-list .media-item').waitFor({state:'detached'});
  await card.locator('.plex-list .empty-message').waitFor();
  passed.push('empty list renders empty message');
  await setState({state:'unavailable',attributes:{}});
  await page.waitForFunction(() => {
    function find(root) {
      for (const el of root.querySelectorAll('*')) {
        if (el.localName === 'mediarr-card') return el;
        if (el.shadowRoot) { const result = find(el.shadowRoot); if (result) return result; }
      }
    }
    const card = find(document);
    return card?._hass?.states['sensor.plex_mediarr_dev']?.state === 'unavailable' && !!card.querySelector('.plex-list .empty-message');
  });
  passed.push('unavailable sensor renders fallback');
  await setState(fixture);
  await card.locator('.media-item-title').filter({hasText:'Mediarr Cloud Test'}).waitFor();
  passed.push('sensor recovers after unavailable state');
  assert.deepEqual(errors,[], 'JavaScript exceptions');
  passed.push('no JavaScript exceptions');
  await fs.writeFile(path.join(runtime,'test-results.json'),JSON.stringify({passed,errors},null,2));
  console.log(`PASS: ${passed.length} checks\n${passed.join('\n')}`);
} finally {
  try { await setState(fixture); } finally { await browser.close(); }
}
