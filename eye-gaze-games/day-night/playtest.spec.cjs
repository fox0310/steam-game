const {test,expect}=require('@playwright/test');
const path=require('node:path');
const url='/eye-gaze-games/day-night/';
async function hover(page){const b=await page.locator('#runner').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);}
async function follow(page,n){for(let i=0;i<n;i++){await hover(page);await page.clock.runFor(120);}}
async function segment(page){return Number(await page.locator('body').getAttribute('data-segment'));}
async function progress(page){return Number(await page.locator('body').getAttribute('data-progress'));}
async function range(page,id,value){await page.locator('#'+id).evaluate((el,value)=>{el.value=String(value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);}
async function traverse(page){const before=await segment(page);for(let i=0;i<170;i++){if(await segment(page)!==before||await page.locator('body').getAttribute('data-state')==='complete')return;await follow(page,1);}throw new Error('Arc did not complete');}
async function instrumentAudio(page){await page.evaluate(()=>{
 window.musicStarts=[];window.musicStops=0;window.rewardNotes=[];
 const Audio=window.AudioContext||window.webkitAudioContext;
 const source=Audio.prototype.createBufferSource;Audio.prototype.createBufferSource=function(){const node=source.call(this),start=node.start.bind(node),stop=node.stop.bind(node);node.start=(...args)=>{window.musicStarts.push({duration:node.buffer.duration,loop:node.loop});return start(...args);};node.stop=(...args)=>{window.musicStops++;return stop(...args);};return node;};
 const oscillator=Audio.prototype.createOscillator;Audio.prototype.createOscillator=function(){const node=oscillator.call(this),set=node.frequency.setValueAtTime.bind(node.frequency);node.frequency.setValueAtTime=(n,t)=>{window.rewardNotes.push(n);return set(n,t);};return node;};
});}
test.beforeEach(async({page})=>{await page.clock.install();await page.goto(url);await expect(page.locator('#start')).toBeEnabled();});

test('太陽只在游標跟望時移動，離開即停，回來繼續',async({page})=>{
 await expect(page.locator('#sun')).toBeVisible();await expect(page.locator('#moon')).toBeHidden();
 await page.locator('#start').click();await page.clock.runFor(500);expect(await progress(page)).toBe(0);
 await follow(page,5);expect(await progress(page)).toBeGreaterThan(0);await page.mouse.move(5,5);const stopped=await progress(page);await page.clock.runFor(1000);expect(await progress(page)).toBe(stopped);
 await follow(page,5);expect(await progress(page)).toBeGreaterThan(stopped);
});

test('靜止游標不會讓太陽自行走完整段',async({page})=>{
 await range(page,'duration',16);await page.locator('#start').click();await hover(page);await page.clock.runFor(1800);const stopped=await progress(page);expect(stopped).toBeGreaterThan(0);expect(stopped).toBeLessThan(.15);await page.clock.runFor(1800);expect(await progress(page)).toBe(stopped);
});

test('太陽到右側立即消失，月亮同時在左側出現並等待新跟望',async({page})=>{
 await range(page,'duration',16);await page.locator('#start').click();await traverse(page);
 await expect(page.locator('#sun')).toBeHidden();await expect(page.locator('#moon')).toBeVisible();await expect(page.locator('body')).toHaveAttribute('data-celestial','moon');await expect(page.locator('body')).toHaveAttribute('data-phase','0.000000');
 const b=await page.locator('#runner').boundingBox(),f=await page.locator('#field').boundingBox();expect((b.x+b.width/2-f.x)/f.width).toBeCloseTo(.15,2);expect(await page.locator('#field').evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgb(8, 29, 56)');
 await page.clock.runFor(2000);await expect(page.locator('body')).toHaveAttribute('data-phase','0.000000');
 await follow(page,5);expect(Number(await page.locator('body').getAttribute('data-phase'))).toBeGreaterThan(0);
 await page.mouse.move(5,5);const stopped=await progress(page);await page.clock.runFor(1000);expect(await progress(page)).toBe(stopped);
});

test('日間與夜間原創音樂切換，老師暫停及靜音會停止',async({page})=>{
 await instrumentAudio(page);await range(page,'duration',16);await page.locator('#start').click();await expect(page.locator('body')).toHaveAttribute('data-music','sun');
 await traverse(page);await expect(page.locator('body')).toHaveAttribute('data-music','moon');
 const starts=await page.evaluate(()=>window.musicStarts);expect(starts).toHaveLength(2);expect(starts[0].duration).toBeCloseTo(17.7778,2);expect(starts[1].duration).toBeCloseTo(30,2);expect(starts.every(s=>s.loop)).toBe(true);expect(await page.evaluate(()=>window.musicStops)).toBe(1);
 await page.locator('#sound').uncheck();await expect(page.locator('body')).toHaveAttribute('data-music','off');await page.locator('#sound').check();await expect(page.locator('body')).toHaveAttribute('data-music','moon');
 await page.locator('#start').click();await expect(page.locator('body')).toHaveAttribute('data-music','off');
});

test('月亮完成後停下，只慶祝一次；重玩回日間',async({page})=>{
 await instrumentAudio(page);await range(page,'duration',16);await page.locator('#start').click();await traverse(page);await traverse(page);
 await expect(page.locator('body')).toHaveAttribute('data-state','complete');await expect(page.locator('#celebration')).toBeVisible();await expect(page.locator('body')).toHaveAttribute('data-music','off');expect(await progress(page)).toBe(1);expect(await page.evaluate(()=>window.rewardNotes.length)).toBe(4);
 await page.clock.runFor(1000);await hover(page);await page.clock.runFor(1000);expect(await page.evaluate(()=>window.rewardNotes.length)).toBe(4);expect(await progress(page)).toBe(1);
 await page.locator('#start').click();await expect(page.locator('body')).toHaveAttribute('data-celestial','sun');await expect(page.locator('#moon')).toBeHidden();expect(await progress(page)).toBe(0);
});

test('兩組日月有四段，每次換目標均等待重新跟望',async({page})=>{
 await range(page,'duration',16);await page.locator('#rounds').selectOption('2');await page.locator('#start').click();
 for(let i=0;i<4;i++){await expect(page.locator('body')).toHaveAttribute('data-celestial',i%2?'moon':'sun');await traverse(page);if(i<3){await expect(page.locator('body')).toHaveAttribute('data-phase','0.000000');const p=await progress(page);await page.clock.runFor(400);expect(await progress(page)).toBe(p);}}
 await expect(page.locator('body')).toHaveAttribute('data-state','complete');await expect(page.locator('#counter')).toHaveText('2 / 2 組');
});

test('老師暫停、回日間、設定保存及鍵盤操作',async({page})=>{
 await range(page,'duration',64);await range(page,'size',16);await range(page,'volume',15);await page.locator('#guide').check();await page.locator('#sound').uncheck();await page.reload();await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('#duration')).toHaveValue('64');await expect(page.locator('#guide-layer')).toBeVisible();await expect(page.locator('#size')).toHaveValue('16');
 await page.locator('body').click({position:{x:5,y:5}});await page.keyboard.press('Space');await follow(page,4);expect(await progress(page)).toBeGreaterThan(0);await page.keyboard.press('Space');const p=await progress(page);await hover(page);await page.clock.runFor(1000);expect(await progress(page)).toBe(p);await page.keyboard.press('R');expect(await progress(page)).toBe(0);await expect(page.locator('body')).toHaveAttribute('data-celestial','sun');
});

test('專注與不同螢幕的目標不被裁切，天空保持簡潔',async({page})=>{
 await range(page,'size',16);await page.locator('#focus').click();await expect(page.locator('#panel')).toBeHidden();
 for(const size of [{width:390,height:844},{width:1024,height:768},{width:1920,height:1080}]){await page.setViewportSize(size);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const b=await page.locator('#runner').boundingBox();expect(b.x).toBeGreaterThanOrEqual(0);expect(b.x+b.width).toBeLessThanOrEqual(size.width);}
 await page.setViewportSize({width:1440,height:1000});await page.locator('#focus').click();await page.locator('#settings').click();await page.screenshot({path:`/tmp/day-night-${test.info().project.name}-day.png`,fullPage:true});
 await range(page,'duration',16);await page.locator('#start').click();await traverse(page);await page.screenshot({path:`/tmp/day-night-${test.info().project.name}-night.png`,fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:`/tmp/day-night-${test.info().project.name}-mobile.png`,fullPage:true});
});

test('設定損壞或無效數值仍可開始',async({page})=>{
 await page.evaluate(()=>localStorage.setItem('fox-day-night-settings-v1','{broken'));await page.reload();await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('#duration')).toHaveValue('40');await page.evaluate(()=>localStorage.setItem('fox-day-night-settings-v1',JSON.stringify({duration:0,size:99,rounds:88,sound:'yes'})));await page.reload();await expect(page.locator('#duration')).toHaveValue('16');await expect(page.locator('#size')).toHaveValue('16');await expect(page.locator('#rounds')).toHaveValue('3');
});

test('圖片載入失敗不能開始，音樂載入失敗仍可追視',async({page})=>{
 await page.route('**/assets/hong-kong.png',route=>route.abort());await page.reload();await expect(page.locator('#load-error')).toBeVisible();await expect(page.locator('#start')).toBeDisabled();await page.unroute('**/assets/hong-kong.png');await page.route('**/assets/daytime.wav',route=>route.abort());await page.reload();await expect(page.locator('#start')).toBeEnabled();await expect(page.locator('#soundnotice')).toBeVisible();await page.locator('#start').click();await follow(page,4);expect(await progress(page)).toBeGreaterThan(0);
});

test('離線單檔包含香港場景、太陽月亮及兩段音樂',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('file://'+path.join(__dirname,'香港日月追視_單檔版.html'));await expect(page.locator('#start')).toBeEnabled();expect(await page.locator('#city').evaluate(im=>im.src.startsWith('data:image/png;')&&im.naturalWidth>0)).toBe(true);expect(await page.locator('#music-sun').getAttribute('src')).toContain('data:audio/wav;');await instrumentAudio(page);await range(page,'duration',16);await page.locator('#start').click();await traverse(page);await expect(page.locator('#moon')).toBeVisible();await expect(page.locator('body')).toHaveAttribute('data-music','moon');expect(await page.evaluate(()=>window.musicStarts)).toHaveLength(2);expect(errors).toEqual([]);
});
