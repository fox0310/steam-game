const {test,expect}=require('@playwright/test');
test('iPad 點選圖字卡能組句，選過的卡不重複加入',async({page})=>{
 await page.goto('/eye-gaze-games/sentence-cards/');
 await expect(page.locator('#bank button')).toHaveCount(3);
 for(const word of ['self','want','drink'])await page.locator('#bank [data-word="'+word+'"]').tap();
 await expect(page.locator('#sentence strong')).toHaveText(['我','想','飲水']);
 await expect(page.locator('#bank [data-word="drink"]')).toBeDisabled();
 await page.locator('#submit').tap();
 await expect(page.locator('body')).toHaveAttribute('data-phase','complete');
});
const path=require('node:path');
const targets={water:['self','want','drink'],toilet:['self','want','go','toilet'],rest:['self','want','rest'],help:['self','need','help']};
async function openTeacher(page){await page.locator('#settings').tap();await expect(page.locator('#teacher-dialog')).toBeVisible();}
async function context(page,id){await openTeacher(page);await page.locator('#scenario').selectOption(id);await page.locator('#close-settings').tap();}
async function choose(page,words){for(const word of words)await page.locator('#bank [data-word="'+word+'"]').tap();}
async function audible(page,key){await expect(page.locator('body')).toHaveAttribute('data-voice',key);await expect.poll(()=>page.locator('#speech').evaluate(a=>a.readyState>=2&&!a.paused&&a.currentTime>0)).toBe(true);}
test.beforeEach(async({page})=>{await page.goto('/eye-gaze-games/sentence-cards/');await expect(page.locator('#bank button')).toHaveCount(3);});
for(const id of ['toilet','rest','help'])test(id+' 情境可點選完成並播放整句粵語',async({page})=>{
 await context(page,id);await expect(page.locator('#sentence .slot')).toHaveCount(targets[id].length);await choose(page,targets[id]);await page.locator('#submit').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','complete');await audible(page,'sentence-'+id);
});
test('錯序仍可求助，不會清除學生已排列的句子',async({page})=>{
 await choose(page,['drink','self','want']);await page.locator('#submit').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','practice');await expect(page.locator('#status')).toContainText('次序');await page.locator('#ask-help').tap();await audible(page,'ask-help');await expect(page.locator('#sentence strong')).toHaveText(['飲水','我','想']);await expect(page.locator('#status')).toContainText('請幫我');
});
test('選中句卡可刪除，退一張及重新排列均可操作',async({page})=>{
 await choose(page,['want','self','drink']);await page.locator('#sentence [data-index="0"]').tap();await expect(page.locator('#sentence strong')).toHaveText(['我','飲水']);await page.locator('#undo').tap();await expect(page.locator('#sentence strong')).toHaveText(['我']);await choose(page,['want','drink']);await page.locator('#submit').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','complete');await page.locator('#clear').tap();await expect(page.locator('#sentence button')).toHaveCount(0);await expect(page.locator('#submit')).toBeDisabled();
});
test('老師示範後學生可自行練習，提示可以開關',async({page})=>{
 await openTeacher(page);await page.locator('#hint').check();await page.locator('#demo').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','demo');await expect(page.locator('#example')).toBeVisible();await expect(page.locator('#sentence strong')).toHaveText(['我','想','飲水']);await audible(page,'sentence-water');await page.locator('#try').tap();await expect(page.locator('#sentence button')).toHaveCount(0);await choose(page,targets.water);await page.locator('#submit').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','complete');
});
test('老師設定獨立保存，損壞設定有預設值',async({page})=>{
 await openTeacher(page);await page.locator('#scenario').selectOption('toilet');await page.locator('#card-size').selectOption('large');await page.locator('#sound').uncheck();await page.locator('#volume').evaluate(el=>{el.value='30';el.dispatchEvent(new Event('input',{bubbles:true}));});await page.reload();await expect(page.locator('body')).toHaveAttribute('data-scenario','toilet');await expect(page.locator('body')).toHaveAttribute('data-size','large');await page.locator('#ask-help').tap();await expect(page.locator('body')).toHaveAttribute('data-voice','off');await page.evaluate(()=>localStorage.setItem('fox-sentence-settings-v1','{bad'));await page.reload();await expect(page.locator('body')).toHaveAttribute('data-scenario','water');await expect(page.locator('body')).toHaveAttribute('data-size','standard');
});
test('切情境或靜音會停止舊聲音；再啟用不自動播放',async({page})=>{
 await page.locator('#prompt').tap();await audible(page,'prompt-water');await openTeacher(page);await expect(page.locator('body')).toHaveAttribute('data-voice','off');await page.locator('#sound').uncheck();await page.locator('#scenario').selectOption('rest');await page.locator('#close-settings').tap();await choose(page,targets.rest);await page.locator('#submit').tap();await expect(page.locator('body')).toHaveAttribute('data-voice','off');await expect(page.locator('#speech')).not.toHaveAttribute('src',/wav/);await openTeacher(page);await page.locator('#sound').check();await page.locator('#close-settings').tap();await expect(page.locator('body')).toHaveAttribute('data-voice','off');await page.locator('#submit').tap();await audible(page,'sentence-rest');
});
test('18 段內置音檔可解碼，快速換詞不留舊錯誤',async({page})=>{
 const count=await page.evaluate(async()=>{const clips=JSON.parse(document.getElementById('audio-assets').textContent),ctx=new (window.AudioContext||window.webkitAudioContext)();try{for(const url of Object.values(clips)){const response=await fetch(url);if(!response.ok)throw Error('Missing clip');const buffer=await ctx.decodeAudioData(await response.arrayBuffer());if(buffer.duration<=.1)throw Error('Empty clip');}return Object.keys(clips).length;}finally{await ctx.close();}});expect(count).toBe(18);
 await page.route('**/audio/self.wav',route=>route.abort());await choose(page,['self','want','drink']);await page.locator('#ask-help').tap();await audible(page,'ask-help');await expect(page.locator('#audio-notice')).toBeHidden();
});
test('iPad 圖卡夠大、沒有橫向溢出，求助一直可見',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await context(page,'toilet');
 for(const viewport of [{width:768,height:1024},{width:1024,height:768},{width:390,height:844}]){await page.setViewportSize(viewport);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);for(const card of await page.locator('#bank button').all()){const b=await card.boundingBox();expect(b.width).toBeGreaterThanOrEqual(120);expect(b.height).toBeGreaterThanOrEqual(150);}await page.locator('#bank button').last().scrollIntoViewIfNeeded();await expect(page.locator('#ask-help')).toBeInViewport();await page.screenshot({path:'/tmp/sentence-'+test.info().project.name.replaceAll(' ','-')+'-'+viewport.width+'.png',fullPage:true});}
 await page.locator('#focus').tap();await expect(page.locator('body')).toHaveClass('focus');await expect(page.locator('#ask-help')).toBeInViewport();expect(errors).toEqual([]);
});
test('音檔或圖片失敗，文字句卡及求助仍可展示',async({page})=>{
 await page.route('**/assets/drink.svg',route=>route.abort());await page.route('**/audio/sentence-water.wav',route=>route.abort());await page.reload();await choose(page,targets.water);await page.locator('#submit').tap();await expect(page.locator('body')).toHaveAttribute('data-phase','complete');await expect(page.locator('#audio-notice')).toBeVisible();await expect(page.locator('#sentence strong')).toHaveText(['我','想','飲水']);await page.locator('#ask-help').tap();await audible(page,'ask-help');await expect(page.locator('#audio-notice')).toBeHidden();
});
test('單檔版內嵌圖片與粵語，從 file 開啟可完成組句',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('file://'+path.join(__dirname,'圖字卡組句_單檔版.html'));await expect(page.locator('#bank button')).toHaveCount(3);expect(await page.locator('#bank img').first().evaluate(im=>im.src.startsWith('data:image/svg+xml;'))).toBe(true);await choose(page,targets.water);await page.locator('#submit').tap();await audible(page,'sentence-water');expect(await page.locator('#speech').getAttribute('src')).toContain('data:audio/wav;');expect(errors).toEqual([]);
});
test('特大圖字卡在 iPad 直向也會放大圖片',async({page})=>{
 await page.setViewportSize({width:768,height:1024});const before=await page.locator('#bank img').first().boundingBox();await openTeacher(page);await page.locator('#card-size').selectOption('large');await page.locator('#close-settings').tap();const after=await page.locator('#bank img').first().boundingBox();expect(after.height).toBeGreaterThan(before.height);expect((await page.locator('#bank button').first().boundingBox()).height).toBeGreaterThanOrEqual(216);
});
test('老師設定畫面內也可求助，保留已選句卡',async({page})=>{
 await choose(page,['self']);await openTeacher(page);await page.locator('#dialog-help').tap();await audible(page,'ask-help');await expect(page.locator('#dialog-help-status')).toContainText('請幫我');await page.locator('#close-settings').tap();await expect(page.locator('#sentence strong')).toHaveText(['我']);
});
