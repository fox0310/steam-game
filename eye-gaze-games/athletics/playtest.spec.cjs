const {test,expect}=require('@playwright/test');
const path=require('node:path');
const url='/eye-gaze-games/athletics/';
async function hoverRunner(page){const b=await page.locator('#runner').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);}
async function follow(page,steps){for(let i=0;i<steps;i++){await hoverRunner(page);await page.clock.runFor(120);}}
async function range(page,id,value){await page.locator('#'+id).evaluate((input,value)=>{input.value=String(value);input.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function progress(page){return Number(await page.locator('body').getAttribute('data-progress'));}
test.beforeEach(async({page})=>{await page.clock.install();await page.goto(url);await expect(page.locator('#start')).toBeEnabled();});

test('游標碰到即移動，離開即停，移回繼續；老師暫停凍結進度',async({page})=>{
 await page.locator('#start').click();await page.clock.runFor(300);expect(await progress(page)).toBe(0);
 await follow(page,5);expect(await progress(page)).toBeGreaterThan(0);
 await page.mouse.move(5,5);await page.clock.runFor(50);const stopped=await progress(page);
 await page.clock.runFor(1000);expect(await progress(page)).toBe(stopped);
 await follow(page,5);expect(await progress(page)).toBeGreaterThan(stopped);
 await page.locator('#start').click();const paused=await progress(page);await hoverRunner(page);await page.clock.runFor(500);
 expect(await progress(page)).toBe(paused);await expect(page.locator('body')).toHaveAttribute('data-state','idle');
});

test('游標靜止時，人物移出命中範圍即停',async({page})=>{
 await range(page,'duration',16);await page.locator('#start').click();await hoverRunner(page);
 await page.clock.runFor(1500);const stopped=await progress(page);expect(stopped).toBeGreaterThan(0);expect(stopped).toBeLessThan(.15);
 await page.clock.runFor(1500);expect(await progress(page)).toBe(stopped);
});

for(const route of ['full','upper','lower']) test(`${route} 路線到終點完成，停下並只慶祝一次`,async({page})=>{
 await page.locator(`[data-route="${route}"]`).click();await range(page,'duration',16);
 await page.evaluate(()=>{
  window.audioNotes=[];
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(Audio){const create=Audio.prototype.createOscillator;Audio.prototype.createOscillator=function(){const osc=create.call(this),set=osc.frequency.setValueAtTime.bind(osc.frequency);osc.frequency.setValueAtTime=(n,t)=>{window.audioNotes.push(n);return set(n,t);};return osc;};}
 });
 await page.locator('#start').click();await follow(page,141);
 await expect(page.locator('body')).toHaveAttribute('data-state','complete');await expect(page.locator('#celebration')).toBeVisible();
 expect(await progress(page)).toBe(1);const notes=await page.evaluate(()=>window.audioNotes);expect(notes.filter(n=>n>500)).toHaveLength(4);
 await page.clock.runFor(1000);await hoverRunner(page);await page.clock.runFor(1000);expect(await progress(page)).toBe(1);
 expect(await page.evaluate(()=>window.audioNotes.length)).toBe(notes.length);
 await page.locator('#start').click();await expect(page.locator('#celebration')).toBeHidden();expect(await progress(page)).toBe(0);
});

test('半圈兩段折返，不跳回起點',async({page})=>{
 await page.locator('[data-route=upper]').click();await range(page,'duration',16);await page.locator('#laps').selectOption('2');await page.locator('#start').click();
 await follow(page,130);const before=await page.locator('#runner').boundingBox();await follow(page,10);const after=await page.locator('#runner').boundingBox();
 expect(Math.abs(after.x-before.x)).toBeLessThan(100);expect(await progress(page)).toBeGreaterThan(.5);
 await follow(page,138);await expect(page.locator('body')).toHaveAttribute('data-state','complete');
 const end=await page.locator('#runner').boundingBox(),field=await page.locator('#field').boundingBox();expect(end.x+end.width/2).toBeLessThan(field.x+field.width*.12);
});

test('老師設定及回起點；設定可保存',async({page})=>{
 await page.locator('[data-route=lower]').click();await range(page,'duration',64);await range(page,'size',12);await range(page,'volume',15);
 await page.locator('#direction').selectOption('reverse');await page.locator('#guide').check();await page.locator('#sound').uncheck();
 await page.reload();await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('[data-route=lower]')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#duration')).toHaveValue('64');await expect(page.locator('#size')).toHaveValue('12');await expect(page.locator('#sound')).not.toBeChecked();await expect(page.locator('#guide-layer')).toBeVisible();
 await page.locator('#start').click();await follow(page,5);await page.locator('#reset').click();expect(await progress(page)).toBe(0);
});

test('專注、鍵盤及窄螢幕：人物和控制不溢出',async({page})=>{
 await page.locator('#focus').click();await expect(page.locator('#panel')).toBeHidden();await expect(page.locator('#start')).toBeVisible();
 await page.locator('body').click({position:{x:10,y:10}});await page.keyboard.press('Space');await follow(page,5);expect(await progress(page)).toBeGreaterThan(0);
 await page.keyboard.press('Escape');await expect(page.locator('body')).not.toHaveClass(/focus/);
 await page.locator('#settings').click();await range(page,'size',12);
 for(const size of [{width:390,height:844},{width:1024,height:768},{width:1920,height:1080}]){
  await page.setViewportSize(size);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const target=await page.locator('#runner').boundingBox();expect(target.x).toBeGreaterThanOrEqual(0);expect(target.x+target.width).toBeLessThanOrEqual(size.width);
 }
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:`/tmp/athletics-${test.info().project.name}-desktop.png`,fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`/tmp/athletics-${test.info().project.name}-mobile.png`,fullPage:true});
});

test('設定損壞及無法保存不影響遊戲',async({page})=>{
 await page.evaluate(()=>localStorage.setItem('fox-athletics-settings-v1','{bad json'));await page.reload();await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('#duration')).toHaveValue('40');
 await page.evaluate(()=>localStorage.setItem('fox-athletics-settings-v1',JSON.stringify({route:'__proto__',duration:0,size:100,laps:9,sound:'yes'})));await page.reload();
 await expect(page.locator('#duration')).toHaveValue('16');await expect(page.locator('#size')).toHaveValue('12');await expect(page.locator('[data-route=full]')).toHaveAttribute('aria-pressed','true');
});

test('載圖失敗時不能開始',async({page})=>{
 await page.route('**/assets/runner.png',route=>route.abort());await page.reload();await expect(page.locator('#load-error')).toBeVisible();await expect(page.locator('#start')).toBeDisabled();
});

test('單檔 HTML 直接從 file 開啟，所有圖像與追視操作正常',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file://'+path.join(__dirname,'運動場追視_單檔版.html'));await expect(page.locator('#start')).toBeEnabled();
 expect(await page.locator('#stadium').evaluate(im=>im.src.startsWith('data:image/png;')&&im.naturalWidth===2500)).toBe(true);
 await page.locator('#start').click();await follow(page,5);expect(await progress(page)).toBeGreaterThan(0);expect(errors).toEqual([]);
});


test('靜音開始後開啟聲音，立即有跑步聲；關閉後不再播放',async({page})=>{
 await page.evaluate(()=>{
  window.audioNotes=[];
  const Audio=window.AudioContext||window.webkitAudioContext;
  const create=Audio.prototype.createOscillator;
  Audio.prototype.createOscillator=function(){const osc=create.call(this),set=osc.frequency.setValueAtTime.bind(osc.frequency);osc.frequency.setValueAtTime=(n,t)=>{window.audioNotes.push(n);return set(n,t);};return osc;};
 });
 await page.locator('#sound').uncheck();await page.locator('#start').click();await follow(page,5);
 expect(await page.evaluate(()=>window.audioNotes.length)).toBe(0);
 await page.locator('#sound').check();await follow(page,8);
 const notes=await page.evaluate(()=>window.audioNotes);expect(notes.length).toBeGreaterThan(0);expect(notes.every(n=>n===95||n===130)).toBe(true);
 await page.locator('#sound').uncheck();await follow(page,8);expect(await page.evaluate(()=>window.audioNotes.length)).toBe(notes.length);
});
