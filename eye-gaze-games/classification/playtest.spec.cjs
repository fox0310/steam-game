const {test,expect}=require('@playwright/test');
const path=require('node:path');
async function freeze(page){await page.clock.install({time:new Date('2026-10-06T00:00:00Z')});await page.clock.pauseAt(new Date('2026-10-06T00:00:01Z'));}
async function start(page){await page.locator('#start').click();await expect(page.locator('body')).toHaveAttribute('data-running','true');}
async function target(page,value){await page.locator('#settings').click();await page.locator('#target').selectOption(value);await page.locator('#close-settings').click();}
async function find(page,id){for(let n=0;n<10;n++){if(await page.locator('body').getAttribute('data-item')===id)return;await page.clock.fastForward(5000);}throw Error('Image missing: '+id);}
async function audible(page,key){await expect(page.locator('body')).toHaveAttribute('data-voice',key);await expect.poll(()=>page.locator('#speech').evaluate(a=>a.readyState>=2&&!a.paused&&a.currentTime>0)).toBe(true);}
async function endVoice(page){await page.clock.resume();await expect(page.locator('body')).toHaveAttribute('data-phase','playing',{timeout:15000});await page.clock.pauseAt(new Date(await page.evaluate(()=>Date.now()+100)));}
test.beforeEach(async({page})=>{await page.goto('/eye-gaze-games/classification/');await expect(page.locator('#start')).toBeEnabled();});
test('開始後圖片恰好每五秒更換，均衡循環三類圖片',async({page})=>{
 await freeze(page);await start(page);const first=await page.locator('body').getAttribute('data-item');
 await page.clock.fastForward(4999);await expect(page.locator('body')).toHaveAttribute('data-item',first);await page.clock.fastForward(1);
 expect(await page.locator('body').getAttribute('data-item')).not.toBe(first);
 const seen=new Set([first]);const categories=new Set();for(let i=0;i<8;i++){seen.add(await page.locator('body').getAttribute('data-item'));categories.add(await page.locator('body').getAttribute('data-category'));await page.clock.fastForward(5000);}
 expect(seen.size).toBe(9);expect([...categories].sort()).toEqual(['animal','object','plant']);await expect(page.locator('body')).toHaveAttribute('data-item',first);
});
for(const [category,item,name,feature] of [['animal','cat','貓','刺激'],['plant','flower','花朵','成長'],['object','toy','玩具車','不會成長']])test(category+' 目標用空白鍵答對，按圖片播放辨認特徵及音效',async({page})=>{
 await freeze(page);await target(page,category);await start(page);await find(page,item);await page.keyboard.press('Space');
 await expect(page.locator('body')).toHaveAttribute('data-phase','feedback');await expect(page.locator('#feedback')).toHaveAttribute('data-result','correct');await expect(page.locator('#feedback-title')).toContainText(name);await expect(page.locator('#feedback-feature')).toContainText(feature);await audible(page,'correct-'+item);
});
for(const [goal,item,category,name] of [['plant','cat','動物','貓'],['animal','flower','植物','花朵'],['animal','chair','死物','椅子']])test(item+' 答錯說明真正類別及特徵，鼓勵下一張再試',async({page})=>{
 await freeze(page);await target(page,goal);await start(page);await find(page,item);await page.locator('#answer').click();await expect(page.locator('#feedback')).toHaveAttribute('data-result','wrong');await expect(page.locator('#feedback-title')).toContainText(name+'是'+category);await expect(page.locator('#feedback-feature')).not.toBeEmpty();await expect(page.locator('#feedback-encourage')).toContainText('再試');await audible(page,'wrong-'+item);
});
test('答題停留同一圖直到完整講解結束，再恢復五秒換圖',async({page})=>{
 await freeze(page);await start(page);await find(page,'cat');await page.keyboard.press('Space');await audible(page,'correct-cat');
 await page.clock.fastForward(20000);await expect(page.locator('body')).toHaveAttribute('data-item','cat');await expect(page.locator('#answer')).toBeDisabled();await expect(page.locator('#speech')).toHaveJSProperty('paused',false);
 await endVoice(page);const next=await page.locator('body').getAttribute('data-item');expect(next).not.toBe('cat');await page.clock.fastForward(4000);await expect(page.locator('body')).toHaveAttribute('data-item',next);await page.clock.fastForward(1000);expect(await page.locator('body').getAttribute('data-item')).not.toBe(next);
 await expect(page.locator('#feedback-title')).toContainText('貓是動物');
});
test('按住拍掣不會重複答題，放開後下一張才接受新按下',async({page})=>{
 await freeze(page);await start(page);await page.keyboard.down('Space');await expect(page.locator('body')).toHaveAttribute('data-phase','feedback');
 const key=await page.locator('body').getAttribute('data-voice');await audible(page,key);await endVoice(page);await page.keyboard.down('Space');await expect(page.locator('body')).toHaveAttribute('data-phase','playing');await page.keyboard.up('Space');await page.keyboard.press('Space');await expect(page.locator('body')).toHaveAttribute('data-phase','feedback');
});
test('暫停不換圖亦不接受答案，繼續後完整五秒',async({page})=>{
 await freeze(page);await start(page);const first=await page.locator('body').getAttribute('data-item');await page.locator('#start').click();await page.locator('#stage').focus();await page.keyboard.press('Space');await page.clock.fastForward(40000);await expect(page.locator('body')).toHaveAttribute('data-item',first);await expect(page.locator('#feedback')).toBeHidden();
 await start(page);await page.clock.fastForward(4999);await expect(page.locator('body')).toHaveAttribute('data-item',first);await page.clock.fastForward(1);expect(await page.locator('body').getAttribute('data-item')).not.toBe(first);
});
test('老師設定隔離空白鍵，保存目標與音量，損壞設定回預設',async({page})=>{
 await start(page);await page.locator('#settings').click();await expect(page.locator('body')).toHaveAttribute('data-running','false');await page.locator('#target').selectOption('plant');await page.locator('#sound').uncheck();await page.locator('#volume').evaluate(el=>{el.value='30';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.locator('#sound').focus();await page.keyboard.press('Space');await expect(page.locator('#feedback')).toBeHidden();await page.locator('#sound').uncheck();await page.reload();await expect(page.locator('body')).toHaveAttribute('data-target','plant');await page.locator('#settings').click();await expect(page.locator('#volume')).toHaveValue('30');await expect(page.locator('#sound')).not.toBeChecked();
 await page.evaluate(()=>localStorage.setItem('fox-classification-settings-v1','{broken'));await page.reload();await expect(page.locator('body')).toHaveAttribute('data-target','animal');
});
test('靜音仍展示完整特徵七秒，然後換下一張',async({page})=>{
 await freeze(page);await page.locator('#settings').click();await page.locator('#sound').uncheck();await page.locator('#close-settings').click();await start(page);const first=await page.locator('body').getAttribute('data-item');await page.keyboard.press('Space');await expect(page.locator('body')).toHaveAttribute('data-voice','off');await expect(page.locator('#feedback')).toBeVisible();await page.clock.fastForward(6999);await expect(page.locator('body')).toHaveAttribute('data-item',first);await page.clock.fastForward(1);await expect(page.locator('body')).toHaveAttribute('data-phase','playing');expect(await page.locator('body').getAttribute('data-item')).not.toBe(first);
});
test('21 段音檔含各圖片的正誤講解，可解碼且答對有獎勵尾音',async({page})=>{
 const result=await page.evaluate(async()=>{
  const clips=JSON.parse(document.getElementById('audio-assets').textContent),ctx=new (window.AudioContext||window.webkitAudioContext)(),durations={};
  try{for(const [key,url] of Object.entries(clips)){const r=await fetch(url);if(!r.ok)throw Error(url);const b=await ctx.decodeAudioData(await r.arrayBuffer());durations[key]=b.duration;const samples=b.getChannelData(0);if(!samples.some(x=>Math.abs(x)>.01))throw Error('Silent '+key);if(key.startsWith('correct-')){const tail=samples.slice(-Math.floor(b.sampleRate*.42));if(!tail.some(x=>Math.abs(x)>.1))throw Error('Missing reward '+key);}}return durations;}finally{await ctx.close();}
 });expect(Object.keys(result).length).toBe(21);for(const item of ['cat','dog','bird','flower','tree','cactus','toy','ball','chair']){expect(result['correct-'+item]).toBeGreaterThan(5);expect(result['wrong-'+item]).toBeGreaterThan(5);}
});
test('音檔失敗保留圖片特徵，老師可繼續；缺圖禁止開始',async({page})=>{
 await freeze(page);await page.route('**/audio/correct-cat.wav',r=>r.abort());await start(page);await find(page,'cat');await page.keyboard.press('Space');await expect(page.locator('#audio-notice')).toBeVisible();await expect(page.locator('#continue')).toBeVisible();await page.clock.fastForward(30000);await expect(page.locator('body')).toHaveAttribute('data-item','cat');await expect(page.locator('#feedback-feature')).toContainText('成長');await page.locator('#continue').click();await expect(page.locator('body')).toHaveAttribute('data-phase','playing');
 await page.clock.resume();await page.route('**/assets/flower.svg',r=>r.abort());await page.reload();await expect(page.locator('#start')).toBeDisabled();await expect(page.locator('#status')).toContainText('圖片未能載入');
});
test('設定及離開視窗中止講解，不會自行恢復',async({page})=>{
 await freeze(page);await start(page);await page.keyboard.press('Space');const key=await page.locator('body').getAttribute('data-voice');await audible(page,key);await page.locator('#settings').click();await expect(page.locator('body')).toHaveAttribute('data-voice','off');await page.clock.fastForward(30000);await expect(page.locator('body')).toHaveAttribute('data-phase','paused');await page.locator('#close-settings').click();await start(page);await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.clock.fastForward(30000);await expect(page.locator('body')).toHaveAttribute('data-running','false');
});
test('橫直向及手機圖片清楚、觸控夠大，沒有橫向溢出',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await freeze(page);
 for(const viewport of [{width:1280,height:800},{width:768,height:1024},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(viewport);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const b=await page.locator('#picture').boundingBox();expect(b.height).toBeGreaterThanOrEqual(250);const a=await page.locator('#answer').boundingBox();expect(a.height).toBeGreaterThanOrEqual(72);
  await page.screenshot({path:'/tmp/classification-'+test.info().project.name.replaceAll(' ','-')+'-'+viewport.width+'.png',fullPage:true});
 }
 await page.locator('#focus').click();await expect(page.locator('body')).toHaveClass('focus');await start(page);await page.locator('#answer').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','feedback');expect(errors).toEqual([]);
});
test('單檔版從 file 開啟可用空白鍵回答及播放內置粵語',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('file://'+path.join(__dirname,'分類配對_單檔版.html'));await expect(page.locator('#start')).toBeEnabled();await start(page);const item=await page.locator('body').getAttribute('data-item'),category=await page.locator('body').getAttribute('data-category');await page.keyboard.press('Space');await audible(page,(category==='animal'?'correct-':'wrong-')+item);expect(await page.locator('#speech').getAttribute('src')).toContain('data:audio/wav;');expect(await page.locator('#picture').getAttribute('src')).toContain('data:image/svg+xml;');expect(errors).toEqual([]);
});
test('已開始播放後的媒體錯誤亦顯示繼續按鈕，不困在講解',async({page})=>{
 await freeze(page);await start(page);await page.keyboard.press('Space');const key=await page.locator('body').getAttribute('data-voice');await audible(page,key);
 // The native media error can happen after play() has already fulfilled.
 await page.locator('#speech').evaluate(a=>a.dispatchEvent(new Event('error')));
 await expect(page.locator('#audio-notice')).toBeVisible();await expect(page.locator('#continue')).toBeVisible();await expect(page.locator('body')).toHaveAttribute('data-voice','off');await page.locator('#continue').click();await expect(page.locator('body')).toHaveAttribute('data-phase','playing');
});
test('當前圖片失敗只提示一次，不會無限重試同一圖片',async({page})=>{
 await page.addInitScript(()=>{Math.random=()=>0;});let requests=0;await page.route('**/assets/dog.svg',r=>{requests++;return r.abort();});
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('body')).toHaveAttribute('data-item','dog');await expect(page.locator('#status')).toContainText('圖片未能載入');await page.waitForTimeout(200);expect(requests).toBeLessThanOrEqual(2);await expect(page.locator('#start')).toBeDisabled();
});
