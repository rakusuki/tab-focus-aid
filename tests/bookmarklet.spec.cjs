const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

const bookmarklet = fs.readFileSync(path.join(__dirname, '..', 'bookmarklet.txt'),'utf8').trim();
test.beforeEach(async ({page}) => {
  await page.setContent(`<!doctype html><html lang="ja"><head><meta charset="utf-8"></head><body>
    <button id="before">Before</button>
    <div id="target" class="access-link" onclick="window.activationCount=(window.activationCount||0)+1">Target</div>
    <div id="excluded" role="button" onclick="window.excludedCount=(window.excludedCount||0)+1">Excluded</div>
    <button id="after">After</button>
    <script>window.activationCount=0;window.excludedCount=0</script>
  </body></html>`);
  // Evaluate the exact payload users register, not a separate source file.
  await page.evaluate(bookmarklet.slice('javascript:'.length));
});
const panel = page => page.locator('#tab-focus-aid-panel').locator('section.panel');

test('opens the candidate panel and makes a selected element Tab-reachable', async ({page}) => {
  await expect(panel(page)).toBeVisible();
  await expect(page.locator('#target')).not.toHaveAttribute('tabindex','0');
  await panel(page).locator('#apply').click();
  await expect(page.locator('#target')).toHaveAttribute('tabindex','0');
  await expect(panel(page)).toBeHidden();
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#target')).toBeFocused();
  await expect.poll(()=>page.locator('#target').evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.activationCount)).toBe(1);
});

test('allows excluding candidates before activation', async ({page}) => {
  const excluded = panel(page).locator('li').filter({hasText:'Excluded'});
  await excluded.locator('input[type=checkbox]').uncheck();
  await panel(page).locator('#apply').click();
  await expect(page.locator('#target')).toHaveAttribute('tabindex','0');
  await expect(page.locator('#excluded')).not.toHaveAttribute('tabindex','0');
});

test('Space activates a button-like target', async ({page}) => {
  await panel(page).locator('#apply').click();
  await page.locator('#target').focus();
  await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(()=>window.activationCount)).toBe(1);
});

test('restore removes attributes, events and panel', async ({page}) => {
  await panel(page).locator('#apply').click();
  await page.evaluate(bookmarklet.slice('javascript:'.length));
  await panel(page).locator('#restore').click();
  await expect(page.locator('#target')).not.toHaveAttribute('tabindex','0');
  await expect(page.locator('#target')).not.toHaveAttribute('data-tab-focus-aid','1');
  await expect(page.locator('#tab-focus-aid-panel')).toHaveCount(0);
  await page.locator('#target').evaluate(el=>el.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true})));
  await expect.poll(()=>page.evaluate(()=>window.activationCount)).toBe(0);
});

test('relaunch reopens a dismissed panel without duplicating it', async ({page}) => {
  await panel(page).locator('#dismiss').click();
  await expect(panel(page)).toBeHidden();
  await page.evaluate(bookmarklet.slice('javascript:'.length));
  await expect(panel(page)).toBeVisible();
  await expect(page.locator('#tab-focus-aid-panel')).toHaveCount(1);
});

test('close buttons hide the panel but keep page keyboard activation available', async ({page}) => {
  await panel(page).locator('#apply').click();
  await expect(panel(page)).toBeHidden();
  await page.evaluate(bookmarklet.slice('javascript:'.length));
  await panel(page).locator('#close').click();
  await expect(panel(page)).toBeHidden();
  await page.locator('#target').focus();
  await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.activationCount)).toBe(1);
  await page.evaluate(bookmarklet.slice('javascript:'.length));
  await panel(page).locator('#dismiss').click();
  await expect(panel(page)).toBeHidden();
});

test('hidden panel does not trap keyboard navigation', async ({page}) => {
  await panel(page).locator('#apply').click();
  await expect(panel(page)).toBeHidden();
  await page.locator('#before').focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#target')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('#excluded')).toBeFocused();
});

test('focus on narrow access overlay highlights the visible parent service card', async ({page}) => {
  await page.evaluate(() => {
    const card = document.createElement('div');
    card.className='eventhub-service';
    card.innerHTML='<div class="card-default" style="width:240px;height:110px;border:1px solid black;position:relative"><div class="access-link" style="height:1px;width:240px;position:absolute;top:60px" onclick="window.overlayClicks=(window.overlayClicks||0)+1"></div></div>';
    document.body.append(card);
  });
  await page.evaluate(bookmarklet.slice('javascript:'.length));
  await panel(page).locator('#rescan').click();
  await panel(page).locator('#apply').click();
  const overlay = page.locator('.eventhub-service .access-link');
  await overlay.focus();
  await expect(overlay).toBeFocused();
  const card = page.locator('.eventhub-service .card-default');
  await expect(card).toHaveAttribute('data-tab-focus-aid-highlight','1');
  await expect.poll(()=>card.evaluate(el=>getComputedStyle(el).outlineStyle)).toBe('solid');
  await page.keyboard.press('Enter');
  await expect.poll(()=>page.evaluate(()=>window.overlayClicks)).toBe(1);
  await page.locator('#after').focus();
  await expect(card).not.toHaveAttribute('data-tab-focus-aid-highlight','1');
});
