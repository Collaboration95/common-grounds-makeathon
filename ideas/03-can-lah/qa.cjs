// QA harness. Uses existing Playwright installation; no preview runtime dependency.
const { chromium } = require('/tmp/rewind-audit-511e9e5/node_modules/playwright');
const fs=require('fs');const path=require('path');
const root=__dirname;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Users/speedpowermac/.cache/puppeteer/chrome/mac_arm-147.0.7727.57/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'});
 const context=await browser.newContext({viewport:{width:1280,height:900}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.join(root,'preview.html'));await page.screenshot({path:path.join(root,'evidence/preview-pass2-desktop.png'),fullPage:true});
 const tests=[];function check(label,pass){tests.push({label,pass:!!pass});if(!pass)throw new Error(label);}
 check('file protocol opens with no script error',errors.length===0);
 await page.locator('#stage').focus();await page.keyboard.press('Space');check('keyboard plays seat reaction',(await page.locator('#response').textContent()).includes('Thanks'));
 await page.keyboard.press('2');await page.locator('#delivery').fill('85');await page.locator('#play').click();check('firm rain authored take',(await page.locator('#response').textContent()).includes('go together'));
 await page.locator('#delivery').fill('20');await page.locator('#play').click();check('soft rain authored take',(await page.locator('#response').textContent()).includes('share my umbrella'));
 await page.keyboard.press('3');await page.locator('#delivery').fill('85');await page.locator('#play').click();check('firm teammate authored take',(await page.locator('#response').textContent()).includes('go again'));await page.locator('#delivery').fill('20');await page.locator('#play').click();check('gentle teammate authored take',(await page.locator('#response').textContent()).includes('One step'));await page.locator('#delivery').fill('85');await page.locator('#play').click();
 check('all played ending',(await page.locator('#ending').textContent()).includes('Three exchanges'));
 await page.locator('#motion').click();check('still mode active',await page.locator('body').evaluate(b=>b.classList.contains('still')));
 await page.locator('#play').click();check('still mode preserves reaction',(await page.locator('#response').textContent()).includes('go again'));
 await page.locator('#reset').click();check('reset clears takes and progress',await page.evaluate(()=>!document.querySelector('.progress .done')&&document.querySelector('#stage').dataset.scene==='0'));
 const box=await page.locator('#stage').boundingBox();await page.mouse.move(box.x+box.width*.35,box.y+130);await page.mouse.down();await page.mouse.move(box.x+box.width*.85,box.y+130,{steps:10});await page.mouse.up();check('real pointer drag bends and plays',await page.locator('#delivery').inputValue()==='85' && (await page.locator('#response').textContent()).includes('Steady'));
 await page.mouse.move(box.x+150,box.y+130);await page.mouse.down();await page.keyboard.press('3');await page.mouse.up();check('context change cancels active drag',await page.locator('#stage').getAttribute('data-scene')==='2'&&(await page.locator('#response').textContent()).includes('another attempt'));const before=await page.locator('#take').textContent();await page.mouse.move(box.x+150,box.y+130);await page.mouse.down();await page.locator('#stage').dispatchEvent('pointercancel',{pointerId:1});await page.mouse.up();check('cancel does not play',await page.locator('#take').textContent()===before);
 await page.locator('#sound').click();await page.locator('#play').click();check('audio context creates without page error',errors.length===0);
 await page.screenshot({path:path.join(root,'evidence/preview-pass2-played.png'),fullPage:true});
 for(const width of [1280,390,320]){await page.setViewportSize({width,height:width===1280?800:844});check('no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(width===390)await page.screenshot({path:path.join(root,'evidence/preview-pass2-mobile.png'),fullPage:true});}
 fs.writeFileSync(path.join(root,'evidence/preview-tests.json'),JSON.stringify({tests,errors},null,2));
 await browser.close();console.log('preview checks',tests.length);
})().catch(e=>{console.error(e);process.exit(1)});
