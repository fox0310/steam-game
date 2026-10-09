import {arcPoint,course} from './track.mjs';
// Use the media playback session on iPad; older browsers keep their default.
try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
const $=id=>document.getElementById(id);
const defaults={duration:40,size:10,rounds:1,guide:false,sound:true,volume:25};
const storageKey='fox-day-night-settings-v1';let settings={...defaults};
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved&&typeof saved==='object'){
 for(const [key,min,max] of [['duration',16,80],['size',8,16],['rounds',1,3],['volume',0,70]])if(typeof saved[key]==='number'&&Number.isFinite(saved[key]))settings[key]=Math.max(min,Math.min(max,Math.round(saved[key])));
 for(const key of ['guide','sound'])if(typeof saved[key]==='boolean')settings[key]=saved[key];
}}catch{}
let loaded=false,armed=false,finished=false,moving=false,elapsed=0,segment=0,lastTime=0,pointer=null;
let context=null,gain=null,buffers={},musicSource=null,musicOffset=0,musicStarted=0,musicPhase=null,voices=new Set();
const celestial=()=>segment%2?'moon':'sun';
const name=()=>celestial()==='sun'?'太陽':'月亮';
const save=()=>{try{localStorage.setItem(storageKey,JSON.stringify(settings));}catch{}};
function stopMusic(reset=false){
 if(musicSource){musicOffset=(musicOffset+context.currentTime-musicStarted)%musicSource.buffer.duration;try{musicSource.stop();}catch{}musicSource.disconnect();musicSource=null;}
 if(reset)musicOffset=0;document.body.dataset.music='off';
}
function silenceCues(){for(const voice of voices){try{voice.stop();}catch{}}voices.clear();}
function playMusic(){
 if(!context||context.state!=='running'||!armed||finished||!settings.sound||!buffers[celestial()])return;
 if(musicSource&&musicPhase===celestial())return;
 if(musicPhase!==celestial())stopMusic(true);
 musicPhase=celestial();musicSource=context.createBufferSource();musicSource.buffer=buffers[musicPhase];musicSource.loop=true;musicSource.connect(gain);
 musicStarted=context.currentTime;musicSource.start(0,musicOffset);document.body.dataset.music=musicPhase;
}
async function enableAudio(){
 if(!settings.sound||!context)return;
 try{await context.resume();playMusic();}
 catch{$('soundnotice').hidden=false;$('soundnotice').textContent='音樂未能啟用，請由老師再按一次開始。';}
}
function celebrate(){
 if(!settings.sound||!context||context.state!=='running')return;
 [523.25,659.25,783.99,1046.5].forEach((frequency,i)=>{
  const osc=context.createOscillator(),envelope=context.createGain(),when=context.currentTime+i*.16;
  osc.frequency.setValueAtTime(frequency,when);envelope.gain.setValueAtTime(0,when);envelope.gain.linearRampToValueAtTime(.16,when+.01);envelope.gain.exponentialRampToValueAtTime(.001,when+(i===3?.65:.19));
  osc.connect(envelope);envelope.connect(gain);voices.add(osc);osc.onended=()=>{voices.delete(osc);osc.disconnect();envelope.disconnect();};osc.start(when);osc.stop(when+.8);
 });
}
function progress(){return finished?1:(segment+elapsed/settings.duration)/(settings.rounds*2);}
function render(){
 const phase=Math.min(elapsed/settings.duration,1),point=arcPoint(phase),orb=celestial();
 $('runner').style.left=point.x/course.width*100+'%';$('runner').style.top=point.y/course.height*100+'%';
 $('sun').hidden=orb!=='sun';$('moon').hidden=orb!=='moon';$('runner').setAttribute('aria-label','跟望'+name());
 document.body.dataset.celestial=orb;document.body.dataset.phase=phase.toFixed(6);document.body.dataset.progress=progress().toFixed(6);document.body.dataset.segment=segment;
 $('progress').value=progress();$('counter').textContent=(finished?settings.rounds:Math.floor(segment/2))+' / '+settings.rounds+' 組';
 $('phase-label').textContent=orb==='sun'?'日間 · 太陽':'夜晚 · 月亮';$('music-label').textContent=orb==='sun'?'日間 · 歡樂音樂':'夜間 · 柔和音樂';
 $('instruction').textContent=orb==='sun'?'望住太陽，從左邊出發。':'月亮在左邊，望住月亮再出發。';
}
let statusKey='';
function updateStatus(){
 const state=finished?'complete':!armed?'idle':moving?'running':'waiting',key=state+':'+segment;
 document.body.dataset.state=state;if(key===statusKey)return;statusKey=key;
 $('status').textContent=finished?'完成了！休息一下，再追視日月。':!armed?'準備好，先由老師按開始。':moving?'跟望中，'+name()+'正在移動。':elapsed===0?name()+'在左邊，望住便會移動。':'望住'+name()+'便會移動，離開即停。';
 $('start').textContent=finished?'再玩一次':armed?'Ⅱ 暫停':'▶ 準備開始';$('celebration').hidden=!finished;
}
function pause(){armed=false;moving=false;pointer=null;stopMusic();silenceCues();updateStatus();}
function reset(){pause();elapsed=0;segment=0;finished=false;musicPhase=null;stopMusic(true);render();updateStatus();}
function toggle(){if(!loaded)return;if(armed){pause();return;}if(finished)reset();armed=true;lastTime=performance.now();enableAudio();updateStatus();}
function pointerOnTarget(){
 if(!pointer)return false;const r=$('runner').getBoundingClientRect();
 return Math.hypot(pointer.x-r.left-r.width/2,pointer.y-r.top-r.height/2)<=Math.min(r.width,r.height)/2;
}
function advance(){
 stopMusic(true);moving=false;pointer=null;
 if(segment+1>=settings.rounds*2){finished=true;armed=false;elapsed=settings.duration;celebrate();}
 else{segment++;elapsed=0;playMusic();}
 render();updateStatus();
}
function frame(now){
 const dt=lastTime?Math.min(Math.max((now-lastTime)/1000,0),.06):0;lastTime=now;
 moving=armed&&!finished&&loaded&&pointerOnTarget();
 if(moving){elapsed+=dt;if(elapsed>=settings.duration)advance();else{render();if(!pointerOnTarget())moving=false;}}
 updateStatus();requestAnimationFrame(frame);
}
function syncSettings(){
 for(const key of ['duration','size','rounds','volume'])$(key).value=settings[key];for(const key of ['guide','sound'])$(key).checked=settings[key];
 document.documentElement.style.setProperty('--runner-size',settings.size+'%');$('guide-layer').toggleAttribute('hidden',!settings.guide);
 $('speedout').textContent=(settings.duration>=40?'慢速':settings.duration>=28?'中速':'較快')+' · '+settings.duration+' 秒';$('sizeout').textContent=settings.size<10?'較小':settings.size>12?'較大':'標準';$('volumeout').textContent=settings.volume+'%';
 if(gain)gain.gain.value=settings.volume/100;render();
}
$('start').addEventListener('click',toggle);$('reset').addEventListener('click',reset);
$('scene').addEventListener('pointermove',event=>{if(event.pointerType!=='touch')pointer={x:event.clientX,y:event.clientY};});
for(const event of ['pointerleave','pointercancel'])$('scene').addEventListener(event,()=>{pointer=null;moving=false;updateStatus();});
window.addEventListener('blur',()=>{if(armed)pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&armed)pause();});window.addEventListener('resize',()=>{pointer=null;moving=false;updateStatus();});
for(const key of ['duration','size','volume'])$(key).addEventListener('input',()=>{settings[key]=Number($(key).value);if(key==='duration')reset();syncSettings();save();});
$('rounds').addEventListener('change',()=>{settings.rounds=Number($('rounds').value);reset();syncSettings();save();});
for(const key of ['guide','sound'])$(key).addEventListener('change',()=>{settings[key]=$(key).checked;if(key==='sound'){if(settings.sound)enableAudio();else{stopMusic();silenceCues();}}syncSettings();save();});
$('focus').addEventListener('click',()=>{document.body.classList.toggle('focus');document.body.classList.add('panel-closed');$('focus').setAttribute('aria-pressed',String(document.body.classList.contains('focus')));$('settings').setAttribute('aria-expanded','false');pointer=null;moving=false;updateStatus();});
$('settings').addEventListener('click',()=>{pause();document.body.classList.remove('focus');document.body.classList.toggle('panel-closed');$('focus').setAttribute('aria-pressed','false');$('settings').setAttribute('aria-expanded',String(!document.body.classList.contains('panel-closed')));});
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('status').textContent='此瀏覽器未能全螢幕，可使用專注畫面。';}});
document.addEventListener('keydown',event=>{if(event.target.closest('input,select,textarea,button')||event.altKey||event.ctrlKey||event.metaKey)return;if(event.code==='Space'){event.preventDefault();if(!event.repeat)toggle();}if(event.key==='r'||event.key==='R')reset();if(event.key==='Escape'){document.body.classList.remove('focus');$('focus').setAttribute('aria-pressed','false');}});
async function loadAssets(){
 const images=Promise.all(['city','sun','moon'].map(id=>$(id).decode()));
 const sounds=(async()=>{try{
  const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio unavailable');context=new Audio();gain=context.createGain();gain.gain.value=settings.volume/100;gain.connect(context.destination);
  await Promise.all(['sun','moon'].map(async orb=>{const response=await fetch($('music-'+orb).src);if(!response.ok)throw new Error('Audio load failed');buffers[orb]=await context.decodeAudioData(await response.arrayBuffer());}));
 }catch{$('soundnotice').hidden=false;$('soundnotice').textContent='音樂無法載入，遊戲仍可進行。';}})();
 try{await Promise.all([images,sounds]);loaded=true;$('start').disabled=false;}catch{$('load-error').hidden=false;$('start').disabled=true;}
}
syncSettings();updateStatus();loadAssets();requestAnimationFrame(frame);
