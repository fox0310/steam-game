const {test,expect}=require('@playwright/test');
for(const game of ['athletics','vehicles','day-night','sentence-cards','classification']){
 async function activate(page){
  if(game==='sentence-cards')await page.locator('#prompt').tap();
  else if(game==='classification'){await page.locator('#settings').tap();await page.locator('#prompt').tap();}
  else{await expect(page.locator('#start')).toBeEnabled();await page.locator('#start').tap();}
  if(['sentence-cards','classification'].includes(game))await expect.poll(()=>page.locator('#speech').evaluate(a=>!a.paused&&a.currentTime>0)).toBe(true);
  else await expect.poll(()=>page.evaluate(()=>window.audioContexts.some(c=>c.state==='running'))).toBe(true);
  if(['athletics','vehicles'].includes(game)){const box=await page.locator('#runner').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);}
  if(['athletics','vehicles','day-night'].includes(game))await expect.poll(()=>page.evaluate(()=>window.soundStarts)).toBeGreaterThan(0);
  if(game==='day-night')await expect(page.locator('body')).toHaveAttribute('data-music','sun');
 }
 for(const mode of ['supported','absent','throws'])test(game+' audio session '+mode,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(mode=>{
   window.audioContexts=[];window.soundStarts=0;const A=window.AudioContext||window.webkitAudioContext,original=A.prototype.resume;
   for(const name of ['createOscillator','createBufferSource']){const create=A.prototype[name];A.prototype[name]=function(...args){const node=create.apply(this,args),start=node.start.bind(node);node.start=(...args)=>{window.soundStarts++;return start(...args);};return node;};}
   A.prototype.resume=function(...args){if(!window.audioContexts.includes(this))window.audioContexts.push(this);return original.apply(this,args);};
   if(mode==='absent')Object.defineProperty(navigator,'audioSession',{value:undefined});
   if(mode==='throws')Object.defineProperty(navigator,'audioSession',{value:{set type(v){throw new Error('Session unsupported');}}});
  },mode);
  await page.goto('/eye-gaze-games/'+game+'/');
  if(mode==='supported')await expect.poll(()=>page.evaluate(()=>navigator.audioSession?.type??'unsupported')).toBe(test.info().project.name==='iPad WebKit'?'playback':'unsupported');
  await activate(page);expect(errors).toEqual([]);
 });
}
