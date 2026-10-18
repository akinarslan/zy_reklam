import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {mkdir, readdir, writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

test('Public mini sign: shared layout, native home navigation, pointer/Space press and reduced motion', async () => {
  const port = await new Promise(resolve => {
    const socket = net.createServer();
    socket.listen(0, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => resolve(port)); });
  });
  const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {stdio:'ignore', windowsHide:true});
  let browser;
  const output = 'docs/evidence/header-sign/local';
  try {
    const base = `http://127.0.0.1:${port}`;
    for (let n = 0; n < 100; n++) {
      if (server.exitCode !== null) throw Error('Preview exited');
      try { if ((await fetch(base)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    await mkdir(output, {recursive:true});
    browser = await chromium.launch({executablePath:process.env.ZY_CHROMIUM_PATH || undefined});
    const page = await browser.newPage({reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const paths = ['/', '/3d-vitrin/'];
    for (const dir of ['hizmetler', 'projeler', 'promosyonlar']) {
      for (const entry of await readdir(dir, {withFileTypes:true})) if (entry.isDirectory()) paths.push(`/${dir}/${entry.name}/`);
    }
    const records = [];
    for (const width of [390, 820, 1024, 1440, 2560, 3840]) {
      await page.setViewportSize({width, height:width === 820 ? 1180 : 900});
      for (const path of paths) {
        assert.equal((await page.goto(base + path)).status(), 200);
        const sign = page.getByRole('link', {name:'ZY Reklam ana sayfa', exact:true});
        assert.equal(await sign.getAttribute('href'), '/');
        assert.equal(await sign.locator('img').getAttribute('src'), '/assets/brand/zy-reklam-wordmark.svg');
        const record = await sign.evaluate(element => {
          const r = element.getBoundingClientRect(), header = document.querySelector('.header').getBoundingClientRect();
          return {width:innerWidth, headerHeight:header.height, top:r.top, bottom:r.bottom, left:r.left, right:r.right, height:r.height, overflow:document.documentElement.scrollWidth > innerWidth, canvasesInHeader:document.querySelectorAll('.header canvas').length};
        });
        assert.ok(record.height >= 44 && record.top >= 0 && record.bottom <= record.headerHeight);
        assert.ok(record.left >= 0 && record.right <= width && !record.overflow);
        assert.equal(record.headerHeight, width < 1024 ? 77 : width >= 2560 ? 103 : width >= 1920 ? 97 : 91);
        assert.equal(record.canvasesInHeader, 0);
        records.push({path, ...record});
      }
    }
    await page.setViewportSize({width:1440, height:900});
    await page.goto(base + '/');
    const sign = page.locator('.header-sign');
    const settleSign = () => page.waitForFunction(() => {
      const element = document.querySelector('.header-sign');
      getComputedStyle(element).transform;
      return element.getAnimations().every(animation => animation.playState === 'finished');
    }, null, {timeout:3000});
    // A lower-page activation must return to the real home destination/top.
    await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 1200); });
    assert.ok(await page.evaluate(() => scrollY) > 1000);
    await sign.focus();
    await Promise.all([page.waitForURL(base + '/'), page.keyboard.press('Enter')]);
    await page.waitForFunction(() => scrollY === 0);
    await page.goto(base + '/3d-vitrin/');
    await sign.focus();
    await page.keyboard.down('Space');
    assert.equal(await sign.getAttribute('data-key-pressed'), 'true');
    assert.equal(new URL(page.url()).pathname, '/3d-vitrin/');
    await Promise.all([page.waitForURL(base + '/'), page.keyboard.up('Space')]);
    await page.waitForFunction(() => scrollY === 0);
    assert.equal(await sign.getAttribute('data-key-pressed'), null);
    assert.equal(await sign.evaluate(element => getComputedStyle(element).transitionDuration), '0s');
    assert.equal(await sign.evaluate(element => getComputedStyle(element).transform), 'none');
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(() => document.documentElement.dataset.motion === 'full');
    await page.mouse.move(800, 300);
    await settleSign();
    const rest = await sign.evaluate(element => getComputedStyle(element).transform);
    await sign.hover();
    await settleSign();
    const hover = await sign.evaluate(element => getComputedStyle(element).transform);
    assert.notEqual(hover, rest);
    const box = await sign.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await settleSign();
    assert.notEqual(await sign.evaluate(element => getComputedStyle(element).transform), hover);
    // Release outside the link so this visual check does not navigate.
    await page.mouse.move(800, 300);
    await page.mouse.up();
    await settleSign();
    assert.equal(await sign.evaluate(element => getComputedStyle(element).transform), rest);
    await page.locator('[data-motion-toggle]').click();
    await sign.hover();
    assert.equal(await sign.evaluate(element => getComputedStyle(element).transform), 'none');
    await page.keyboard.press('Tab');
    await sign.focus();
    assert.equal(await sign.evaluate(element => getComputedStyle(element).outlineStyle), 'solid');
    for (const [width,height] of [[390,844],[820,1180],[1440,900],[2560,1440]]) {
      await page.setViewportSize({width,height});
      await page.goto(base + '/');
      await page.screenshot({path:`${output}/header-${width}.png`});
    }
    const nojs = await browser.newPage({javaScriptEnabled:false});
    await nojs.goto(base + '/3d-vitrin/');
    await nojs.locator('.header-sign').click();
    assert.equal(new URL(nojs.url()).pathname, '/');
    await nojs.close();
    const touch = await browser.newPage({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
    await touch.goto(base + '/3d-vitrin/');
    const touchSign = touch.locator('.header-sign');
    const touchBox = await touchSign.boundingBox();
    const cdp = await touch.context().newCDPSession(touch);
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:touchBox.x + touchBox.width/2,y:touchBox.y + touchBox.height/2}]});
    await touch.waitForFunction(() => {
      const element = document.querySelector('.header-sign');
      return element.dataset.pointerPressed === 'true'
        && element.getAnimations().every(animation => animation.playState === 'finished')
        && Math.abs(new DOMMatrix(getComputedStyle(element).transform).m11 - .97) < .001;
    }, null, {timeout:3000});
    assert.equal(await touchSign.getAttribute('data-pointer-pressed'), 'true');
    assert.ok(await touchSign.evaluate(element => Math.abs(new DOMMatrix(getComputedStyle(element).transform).m11 - .97) < .001));
    await cdp.send('Input.dispatchTouchEvent', {type:'touchCancel', touchPoints:[]});
    assert.equal(await touchSign.getAttribute('data-pointer-pressed'), null);
    assert.equal(new URL(touch.url()).pathname, '/3d-vitrin/');
    await cdp.send('Input.dispatchTouchEvent', {type:'touchStart', touchPoints:[{x:touchBox.x + touchBox.width/2,y:touchBox.y + touchBox.height/2}]});
    await Promise.all([touch.waitForURL(base + '/'), cdp.send('Input.dispatchTouchEvent', {type:'touchEnd',touchPoints:[]})]);
    await touch.close();
    assert.deepEqual(errors, []);
    await writeFile(`${output}/acceptance.json`, JSON.stringify({records, keyboard:true, pointerPress:true, touchPress:true, reducedMotion:true, manualReduced:true, nojs:true, errors}, null, 2));
    console.log(`Mini sign: ${records.length} page/viewport checks PASS; keyboard, press, reduced motion and no-JS PASS`);
  } finally { await browser?.close(); server.kill(); }
});
