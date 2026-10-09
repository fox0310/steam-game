import {CATEGORIES,FEATURES,ITEMS,INTERVAL,begin,tick,respond,pause,resume,advance,deck} from './model.mjs';
// Use the media playback session on iPad; older browsers keep their default.
try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
const $=id=>document.getElementById(id),audio=$('speech'),icons=JSON.parse($('icon-assets').textContent),clips=JSON.parse($('audio-assets').textContent);
const defaults={target:'animal',sound:true,volume:65},storage='fox-classification-settings-v1';
let settings={...defaults};
try{const saved=JSON.parse(localStorage.getItem(storage)||'null');if(saved&&typeof saved==='object'){
 if(Object.hasOwn(CATEGORIES,saved.target))settings.target=saved.target;
 if(typeof saved.sound==='boolean')settings.sound=saved.sound;
 if(typeof saved.volume==='number'&&Number.isFinite(saved.volume))settings.volume=Math.max(0,Math.min(100,saved.volume));
}}catch{}
let state=pause(begin(settings.target,deck(),performance.now())),phase='ready',timer=0,feedbackTimer=0,voiceGeneration=0,held=false,ready=false;
const preloads=Object.values(icons).map(src=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(true);img.onerror=()=>resolve(false);img.src=src;}));
function save(){try{localStorage.setItem(storage,JSON.stringify(settings));}catch{}}
function clearTimers(){clearTimeout(timer);clearTimeout(feedbackTimer);}
function stopSpeech(){voiceGeneration++;audio.pause();audio.removeAttribute('src');audio.load();document.body.dataset.voice='off';}
function play(key,done){
 stopSpeech();
 if(!settings.sound||settings.volume===0){if(done)feedbackTimer=setTimeout(done,7000);return;}
 const generation=voiceGeneration;audio.src=clips[key];audio.volume=settings.volume/100;document.body.dataset.voice=key;
 audio.onended=()=>{if(generation===voiceGeneration){document.body.dataset.voice='off';done?.();}};
 function failed(){
  if(generation!==voiceGeneration)return;
  audio.pause();document.body.dataset.voice='off';$('audio-notice').hidden=false;
  if(done&&phase==='feedback'){$('continue').hidden=false;$('status').textContent='請看辨認特徵，再按「繼續看圖片」。';$('status').hidden=false;}
 }
 audio.onerror=failed;
 audio.play().then(()=>{if(generation===voiceGeneration)$('audio-notice').hidden=true;}).catch(failed);
}
function sync(){
 $('target').value=settings.target;$('sound').checked=settings.sound;$('volume').value=settings.volume;$('volume-out').textContent=settings.volume+'%';
 audio.volume=settings.volume/100;
}
function render(){
 const item=ITEMS.find(x=>x.id===state.order[state.index]);
 document.body.dataset.running=String(state.running);document.body.dataset.phase=phase;document.body.dataset.item=item.id;document.body.dataset.category=item.category;document.body.dataset.target=state.target;
 $('target-name').textContent=CATEGORIES[state.target];if($('picture').getAttribute('src')!==icons[item.id])$('picture').src=icons[item.id];$('picture').alt=item.name;$('item-name').textContent=item.name;
 $('answer').disabled=!ready||!state.running||state.answered;$('answer').textContent=phase==='feedback'?'正在講解…':'這是目標 · 空白鍵';
 $('start').disabled=!ready;$('restart').disabled=!ready;$('start').textContent=phase==='ready'?'開始遊戲':'繼續遊戲';
 $('status').textContent=!ready?'圖片準備中…':phase==='feedback'||state.running?'':phase==='ready'?'請老師按「老師設定」開始。':'已暫停，請老師按「老師設定」繼續。';
 $('status').hidden=phase==='feedback'||state.running;
 $('continue').hidden=true;
 const f=state.feedback;$('feedback').hidden=!f;
 if(f){$('feedback').dataset.result=f.correct?'correct':'wrong';$('feedback-title').textContent=(f.correct?'答對了！':'再看看：')+f.name+'是'+CATEGORIES[f.category];$('feedback-feature').textContent=f.features;$('feedback-encourage').textContent=f.correct?'做得好！':'下一張再試一次。';}
}
function schedule(){
 clearTimeout(timer);if(!state.running)return;
 timer=setTimeout(()=>{const next=tick(state,performance.now());if(next!==state){state=next;render();}schedule();},Math.max(1,state.deadline-performance.now()));
}
function halt(){clearTimers();stopSpeech();state=pause(state);phase=ready?'paused':'ready';held=false;render();}
function finishFeedback(){
 if(phase!=='feedback'||document.hidden||$('teacher-dialog').open)return;
 clearTimers();state=advance(state,performance.now());phase='playing';render();schedule();
}
function answer(){
 if(!ready||$('teacher-dialog').open||!state.running||state.answered)return;
 const next=respond(state);if(next===state)return;
 state=pause(next);phase='feedback';clearTimers();render();play((state.feedback.correct?'correct-':'wrong-')+state.feedback.item,finishFeedback);
}
function startOrPause(){
 if(!ready)return;
 stopSpeech();$('teacher-dialog').close();
 if(state.running||phase==='feedback'){halt();return;}
 state=state.answered?advance(state,performance.now()):resume(state,performance.now());phase='playing';render();schedule();$('stage').focus({preventScroll:true});
}
function restart(){
 clearTimers();stopSpeech();state=pause(begin(settings.target,deck(),performance.now()));phase='ready';render();
}
$('answer').addEventListener('click',answer);
$('start').addEventListener('click',startOrPause);
$('restart').addEventListener('click',restart);
$('prompt').addEventListener('click',()=>{if(phase==='feedback')return;play('prompt-'+settings.target);});
$('continue').addEventListener('click',()=>{stopSpeech();finishFeedback();});
$('settings').addEventListener('click',()=>{halt();$('teacher-dialog').showModal();});
$('close-settings').addEventListener('click',()=>{$('teacher-dialog').close();$('stage').focus({preventScroll:true});});
$('target').addEventListener('change',()=>{settings.target=$('target').value;save();restart();});
$('sound').addEventListener('change',()=>{settings.sound=$('sound').checked;if(!settings.sound)stopSpeech();save();});
$('volume').addEventListener('input',()=>{settings.volume=Number($('volume').value);audio.volume=settings.volume/100;$('volume-out').textContent=settings.volume+'%';if(settings.volume===0)stopSpeech();save();});
function isSpace(event){return event.code==='Space'||event.key===' '||event.key==='Spacebar';}
function acceptsSpace(event){
 if($('teacher-dialog').open)return false;
 const control=event.target.closest?.('button,input,select,textarea,a,[contenteditable]');
 return !control||control.id==='answer';
}
document.addEventListener('keydown',event=>{
 if(!isSpace(event)||!acceptsSpace(event))return;
 event.preventDefault();if(event.repeat||held)return;held=true;answer();
});
document.addEventListener('keyup',event=>{if(isSpace(event)){held=false;if(acceptsSpace(event))event.preventDefault();}});
window.addEventListener('blur',()=>{if(state.running||phase==='feedback')halt();else held=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden)halt();});window.addEventListener('pagehide',halt);
$('picture').addEventListener('error',()=>{ready=false;halt();$('status').textContent='圖片未能載入，請重新載入網頁。';});
sync();render();
Promise.all(preloads).then(results=>{ready=results.every(Boolean);render();if(!ready)$('status').textContent='圖片未能載入，請重新載入網頁。';});
