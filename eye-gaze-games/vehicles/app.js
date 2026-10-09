import { trackPoint, paths, course } from './track.mjs';
// Use the media playback session on iPad; older browsers keep their default.
try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
const $=id=>document.getElementById(id);
const routeNames={full:'全圓追視',upper:'上半圓追視',lower:'下半圓追視'};
const vehicles={taxi:{name:'的士',facing:-1},truck:{name:'貨車',facing:1},schoolbus:{name:'黃色校巴',facing:1}};
const defaults={vehicle:'taxi',route:'full',duration:40,size:14,laps:1,direction:'forward',guide:false,sound:true,volume:30};
const storageKey='fox-vehicles-settings-v1';
let settings={...defaults};
try {
  const stored=JSON.parse(localStorage.getItem(storageKey)||'null');
  if(stored && typeof stored==='object') {
    for(const [key,min,max] of [['duration',16,80],['size',10,22],['laps',1,3],['volume',0,70]])
      if(typeof stored[key]==='number' && Number.isFinite(stored[key])) settings[key]=Math.max(min,Math.min(max,Math.round(stored[key])));
    if(Object.hasOwn(vehicles,stored.vehicle)) settings.vehicle=stored.vehicle;
    if(Object.hasOwn(routeNames,stored.route)) settings.route=stored.route;
    if(['forward','reverse'].includes(stored.direction)) settings.direction=stored.direction;
    for(const key of ['guide','sound']) if(typeof stored[key]==='boolean') settings[key]=stored[key];
  }
} catch { /* Settings storage is optional. */ }
let assetRequest=0;
let armed=false,finished=false,loaded=false,elapsed=0,lastTime=0,moving=false,stepTime=0;
let pointer=null,point=trackPoint(settings.route,0,settings.direction==='reverse');
let context=null,gain=null,voices=new Set();
function save(){try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch{}}
function silence(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
async function enableAudio(){
  if(!settings.sound) return;
  try {
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio) throw new Error('Audio unavailable');
    if(!context){context=new Audio();gain=context.createGain();gain.connect(context.destination);}
    gain.gain.value=settings.volume/100;
    await context.resume();
    $('soundnotice').hidden=context.state==='running';
    if(context.state!=='running') $('soundnotice').textContent='聲音未啟用，請再按一次準備開始。';
  } catch {$('soundnotice').hidden=false;$('soundnotice').textContent='這個瀏覽器未能啟用音效，遊戲仍可繼續。';}
}
function tone(freq,when,length,level,type='sine'){
  if(!settings.sound||!context||context.state!=='running'||!gain) return;
  const osc=context.createOscillator(),envelope=context.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,when);
  envelope.gain.setValueAtTime(0,when);envelope.gain.linearRampToValueAtTime(level,when+0.008);
  envelope.gain.exponentialRampToValueAtTime(0.001,when+length);
  osc.connect(envelope);envelope.connect(gain);voices.add(osc);
  osc.onended=()=>{voices.delete(osc);osc.disconnect();envelope.disconnect();};
  osc.start(when);osc.stop(when+length+0.02);
}
function motorPulse(){if(context) tone(stepTime%2 ? 110 : 85,context.currentTime,0.11,0.14,'triangle');}
function celebrate(){if(context) [523.25,659.25,783.99,1046.5].forEach((note,i)=>tone(note,context.currentTime+i*0.16,i===3?0.65:0.19,0.18));}
function units(){return settings.route==='full'?'圈':'段';}
function currentProgress(){return Math.min(elapsed/(settings.duration*settings.laps),1);}
function render(){
  const traversals=elapsed/settings.duration;
  const phase=finished ? 1 : traversals%1;
  const segment=finished ? settings.laps-1 : Math.floor(traversals);
  const reverse=(settings.direction==='reverse') !== (settings.route!=='full' && segment%2===1);
  point=trackPoint(settings.route,phase,reverse);
  $('runner').style.left=(point.x/course.width*100)+'%';
  $('runner').style.top=(point.y/course.height*100)+'%';
  const nearby=trackPoint(settings.route,Math.min(1,phase+0.001),reverse);
  const previous=trackPoint(settings.route,Math.max(0,phase-0.001),reverse);
  if(Math.abs(nearby.x-previous.x)>0.00001) $('portrait').style.setProperty('--facing',String((nearby.x>previous.x?1:-1)*vehicles[settings.vehicle].facing));
  $('portrait').style.setProperty('--bob','0px');
  $('progress').value=currentProgress();
  $('counter').textContent=`${finished?settings.laps:Math.min(Math.floor(traversals),settings.laps)} / ${settings.laps} ${units()}`;
  document.body.dataset.progress=currentProgress().toFixed(6);
  document.body.dataset.phase=phase.toFixed(6);
}
function pointerOnRunner(){
  if(!pointer) return false;
  const rect=$('runner').getBoundingClientRect();
  return pointer.x>=rect.left&&pointer.x<=rect.right&&pointer.y>=rect.top&&pointer.y<=rect.bottom;
}
function updateStatus(){
  const state=finished?'complete':!armed?'idle':moving?'running':'waiting';
  const changed=document.body.dataset.state!==state;
  document.body.dataset.state=state;
  if(!changed) return;
  $('status').textContent=finished?'完成了！可以休息，或再行一次。':!armed?'準備好，先由老師按開始。':moving?'跟望中，交通工具正在行駛。':'望住交通工具便會移動，離開即停。';
  $('start').innerHTML=finished?'再行一次':armed?'<span aria-hidden="true">Ⅱ</span> 暫停':'<span aria-hidden="true">▶</span> 準備開始';
  $('celebration').hidden=!finished;
}
function pause(){armed=false;moving=false;pointer=null;silence();updateStatus();render();}
function reset(){pause();elapsed=0;finished=false;stepTime=0;updateStatus();render();}
async function toggle(){
  if(!loaded) return;
  if(armed){pause();return;}
  if(finished) reset();
  // The teacher's click/key press unlocks audio before eye-gaze hover starts.
  enableAudio();
  armed=true;lastTime=performance.now();updateStatus();
}
function syncSettings(){
  for(const key of ['duration','size','laps','volume']) $(key).value=settings[key];
  $('direction').value=settings.direction;
  for(const key of ['guide','sound']) $(key).checked=settings[key];
  document.querySelectorAll('button[data-vehicle]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.vehicle===settings.vehicle?'true':'false'));
  $('portrait').alt=vehicles[settings.vehicle].name;
  $('runner').setAttribute('aria-label','跟隨這架'+vehicles[settings.vehicle].name);
  document.body.dataset.vehicle=settings.vehicle;
  document.querySelectorAll('[data-route]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.route===settings.route?'true':'false'));
  $('route-label').textContent=routeNames[settings.route];
  $('route-path').setAttribute('d',paths[settings.route]);$('guide-layer').toggleAttribute('hidden',!settings.guide);
  document.documentElement.style.setProperty('--runner-size',settings.size+'%');
  $('speedout').textContent=(settings.duration>=40?'慢速':settings.duration>=28?'中速':'較快')+' · '+settings.duration+' 秒';
  $('sizeout').textContent=settings.size<14?'較小':settings.size>16?'較大':'標準';
  $('volumeout').textContent=settings.volume+'%';
  if(gain) gain.gain.value=settings.volume/100;
  render();
}
function frame(now){
  const dt=lastTime?Math.min(Math.max((now-lastTime)/1000,0),0.06):0;lastTime=now;
  moving=armed&&!finished&&loaded&&pointerOnRunner();
  if(moving){
    elapsed+=dt;
    if(elapsed>=settings.duration*settings.laps){elapsed=settings.duration*settings.laps;finished=true;armed=false;moving=false;silence();celebrate();}
    else if(elapsed>=stepTime*0.32){motorPulse();stepTime=Math.floor(elapsed/0.32)+1;}
    render();
    // Recheck the moving hit area even if the operating system sends no new pointer event.
    if(!finished&&!pointerOnRunner()) moving=false;
  }
  if(!moving&&!finished) silence();
  updateStatus();requestAnimationFrame(frame);
}
$('start').addEventListener('click',toggle);
$('reset').addEventListener('click',reset);
$('scene').addEventListener('pointermove',event=>{if(event.pointerType!=='touch')pointer={x:event.clientX,y:event.clientY};});
$('scene').addEventListener('pointerleave',()=>{pointer=null;moving=false;silence();updateStatus();});
$('scene').addEventListener('pointercancel',()=>{pointer=null;moving=false;silence();updateStatus();});
window.addEventListener('blur',()=>{if(armed)pause();});
window.addEventListener('resize',()=>{pointer=null;moving=false;silence();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&armed)pause();});
for(const button of document.querySelectorAll('button[data-vehicle]')) button.addEventListener('click',()=>{settings.vehicle=button.dataset.vehicle;reset();syncSettings();save();loadImages();});
for(const button of document.querySelectorAll('[data-route]')) button.addEventListener('click',()=>{settings.route=button.dataset.route;reset();syncSettings();save();});
for(const key of ['duration','size','volume']) $(key).addEventListener('input',()=>{settings[key]=Number($(key).value);if(key==='duration')reset();syncSettings();save();});
for(const key of ['direction','laps']) $(key).addEventListener('change',()=>{settings[key]=key==='laps'?Number($(key).value):$(key).value;reset();syncSettings();save();});
for(const key of ['guide','sound']) $(key).addEventListener('change',()=>{settings[key]=$(key).checked;if(key==='sound'){if(settings.sound)enableAudio();else silence();}syncSettings();save();});
$('focus').addEventListener('click',()=>{document.body.classList.toggle('focus');document.body.classList.add('panel-closed');$('focus').setAttribute('aria-pressed',document.body.classList.contains('focus')?'true':'false');$('settings').setAttribute('aria-expanded','false');pointer=null;});
$('settings').addEventListener('click',()=>{pause();if(document.body.classList.contains('focus'))document.body.classList.remove('focus');document.body.classList.toggle('panel-closed');$('focus').setAttribute('aria-pressed','false');$('settings').setAttribute('aria-expanded',document.body.classList.contains('panel-closed')?'false':'true');});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('status').textContent='此瀏覽器未能全螢幕，可使用專注畫面。';}});
document.addEventListener('keydown',event=>{
  if(event.target.closest('input,select,textarea,button')||event.altKey||event.ctrlKey||event.metaKey)return;
  if(event.code==='Space'){event.preventDefault();if(!event.repeat)toggle();}
  if(event.key==='r'||event.key==='R')reset();
  if(event.key==='Escape'){document.body.classList.remove('focus');$('focus').setAttribute('aria-pressed','false');}
});
async function loadImages(){
  const request=++assetRequest;loaded=false;$('start').disabled=true;$('load-error').hidden=true;
  $('portrait').src=document.querySelector('button[data-vehicle="'+settings.vehicle+'"] img').src;
  try{await Promise.all(['stadium','portrait'].map(id=>$(id).decode()));if(request!==assetRequest)return;loaded=true;$('start').disabled=false;}
  catch{if(request!==assetRequest)return;$('load-error').hidden=false;loaded=false;$('start').disabled=true;}
}
syncSettings();updateStatus();loadImages();requestAnimationFrame(frame);
