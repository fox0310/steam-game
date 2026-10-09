import {WORDS,SCENARIOS,scenarioFor,start,act,isCorrect} from './model.mjs';
// Use the media playback session on iPad; older browsers keep their default.
try{if(navigator.audioSession)navigator.audioSession.type='playback';}catch{}
const $=id=>document.getElementById(id),audio=$('speech');
const icons=JSON.parse($('icon-assets').textContent),clips=JSON.parse($('audio-assets').textContent);
const defaults={scenario:'water',size:'standard',hint:false,sound:true,volume:65},storage='fox-sentence-settings-v1';
let settings={...defaults};
try{const saved=JSON.parse(localStorage.getItem(storage)||'null');if(saved&&typeof saved==='object'){
 if(SCENARIOS.some(s=>s.id===saved.scenario))settings.scenario=saved.scenario;
 if(['standard','large'].includes(saved.size))settings.size=saved.size;
 for(const key of ['hint','sound'])if(typeof saved[key]==='boolean')settings[key]=saved[key];
 if(typeof saved.volume==='number'&&Number.isFinite(saved.volume))settings.volume=Math.max(0,Math.min(100,Math.round(saved.volume)));
}}catch{}
let state=start(settings.scenario),bankOrder=[],voiceGeneration=0,feedback='';
function save(){try{localStorage.setItem(storage,JSON.stringify(settings));}catch{}}
function stopSpeech(){voiceGeneration++;audio.pause();audio.removeAttribute('src');audio.load();document.body.dataset.voice='off';}
function speak(key){
 stopSpeech();if(!settings.sound||settings.volume===0||!clips[key])return;
 const generation=voiceGeneration;audio.volume=settings.volume/100;audio.src=clips[key];document.body.dataset.voice=key;
 audio.onended=()=>{if(generation===voiceGeneration)document.body.dataset.voice='off';};
 audio.play().then(()=>{if(generation===voiceGeneration)$('audio-notice').hidden=true;}).catch(()=>{
  if(generation!==voiceGeneration)return;document.body.dataset.voice='off';$('audio-notice').hidden=false;
 });
}
function shuffle(){
 const target=scenarioFor(state.scenario).words;bankOrder=[...target];
 for(let i=bankOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bankOrder[i],bankOrder[j]]=[bankOrder[j],bankOrder[i]];}
 if(bankOrder.every((w,i)=>w===target[i]))bankOrder.push(bankOrder.shift());
}
function card(word,index=null){
 const button=document.createElement('button');button.className='card';button.type='button';button.dataset.word=word;
 button.setAttribute('aria-label',index===null?'選取'+WORDS[word].text:'刪除第'+(index+1)+'張：'+WORDS[word].text);
 if(index!==null){button.dataset.index=index;const order=document.createElement('span');order.className='order';order.textContent=index+1;order.setAttribute('aria-hidden','true');button.append(order);}
 const picture=document.createElement('img');picture.src=icons[word];picture.alt='';picture.draggable=false;
 const text=document.createElement('strong');text.textContent=WORDS[word].text;button.append(picture,text);
 return button;
}
function render(){
 const focused=document.activeElement,focusWord=focused?.closest('#bank .card')?.dataset.word;
 const scenario=scenarioFor(state.scenario);document.body.dataset.phase=state.phase;document.body.dataset.scenario=state.scenario;
 $('context-label').textContent=scenario.label+'情境';$('cue').textContent=scenario.cue;
 const picture=document.createElement('img');picture.src=icons[scenario.icon];picture.alt='';$('context-icon').replaceChildren(picture);
 $('bank').replaceChildren(...bankOrder.map(word=>{const button=card(word);button.disabled=state.phase==='demo'||state.chosen.includes(word);return button;}));
 const sentence=state.chosen.map((word,index)=>card(word,index));
 for(let i=state.chosen.length;i<scenario.words.length;i++){const slot=document.createElement('span');slot.className='slot';slot.textContent=i+1;slot.setAttribute('aria-label','第'+(i+1)+'張圖字卡位置');sentence.push(slot);}
 $('sentence').replaceChildren(...sentence);$('sentence').setAttribute('aria-label','我的句子：'+state.chosen.map(word=>WORDS[word].text).join('，'));
 $('submit').disabled=state.chosen.length===0;$('submit').textContent=state.phase==='complete'?'再說一次':'完成 · 說出句子';
 $('undo').disabled=!state.chosen.length||state.phase==='demo';$('clear').disabled=!state.chosen.length;$('try').hidden=state.phase!=='demo';
 $('status').textContent=feedback||(state.phase==='demo'?'老師示範：聽完句子，再按「自己試一試」。':state.phase==='complete'?'句子完成！可以說話、指讀，或展示給成人。':'按次序選圖字卡。');
 $('example').hidden=!settings.hint;$('example-text').textContent=scenario.words.map(word=>WORDS[word].text).join(' ＋ ');
 if(focusWord){const available=[...$('bank').querySelectorAll('button:not(:disabled)')];(available.find(b=>b.dataset.word===focusWord)||available[0])?.focus({preventScroll:true});}
}
function change(action){const next=act(state,action);if(next===state)return false;state=next;feedback='';render();return true;}
function restart(){stopSpeech();state=start(settings.scenario);feedback='';shuffle();render();}
function syncSettings(){
 $('scenario').value=settings.scenario;$('card-size').value=settings.size;
 for(const key of ['hint','sound'])$(key).checked=settings[key];$('volume').value=settings.volume;$('volume-out').textContent=settings.volume+'%';
 document.body.dataset.size=settings.size;audio.volume=settings.volume/100;
}
$('bank').addEventListener('click',event=>{const button=event.target.closest('button[data-word]');if(button&&!button.disabled&&change({type:'choose',word:button.dataset.word}))speak(button.dataset.word);});
$('sentence').addEventListener('click',event=>{const button=event.target.closest('button[data-index]');if(button){stopSpeech();change({type:'remove',index:Number(button.dataset.index)});}});
$('undo').addEventListener('click',()=>{stopSpeech();change({type:'undo'});});
$('clear').addEventListener('click',restart);$('try').addEventListener('click',restart);
$('submit').addEventListener('click',()=>{
 if(!state.chosen.length)return;
 if(isCorrect(state)){state=act(state,{type:'submit'});feedback='';render();speak('sentence-'+state.scenario);}
 else{feedback='再看看圖字卡的次序。可以退一張、重新排列，或按「請幫我」。';render();speak('retry');}
});
function askForHelp(){feedback='請幫我。可以向成人展示這張求助卡。';render();if($('teacher-dialog').open){$('dialog-help-status').textContent=feedback;$('dialog-help-status').hidden=false;}speak('ask-help');}
$('ask-help').addEventListener('click',askForHelp);$('dialog-help').addEventListener('click',askForHelp);
$('prompt').addEventListener('click',()=>speak('prompt-'+state.scenario));
$('settings').addEventListener('click',()=>{stopSpeech();$('dialog-help-status').hidden=true;$('teacher-dialog').showModal();});
$('close-settings').addEventListener('click',()=>$('teacher-dialog').close());
$('demo').addEventListener('click',()=>{$('teacher-dialog').close();state=act(state,{type:'demo'});feedback='';render();speak('sentence-'+state.scenario);$('try').focus({preventScroll:true});});
$('scenario').addEventListener('change',()=>{settings.scenario=$('scenario').value;save();restart();});
$('card-size').addEventListener('change',()=>{settings.size=$('card-size').value;syncSettings();save();});
$('hint').addEventListener('change',()=>{settings.hint=$('hint').checked;render();save();});
$('sound').addEventListener('change',()=>{settings.sound=$('sound').checked;if(!settings.sound)stopSpeech();save();});
$('volume').addEventListener('input',()=>{settings.volume=Number($('volume').value);syncSettings();save();});
$('focus').addEventListener('click',()=>{document.body.classList.toggle('focus');$('focus').setAttribute('aria-pressed',String(document.body.classList.contains('focus')));});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSpeech();});window.addEventListener('pagehide',stopSpeech);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('teacher-dialog').open){document.body.classList.remove('focus');$('focus').setAttribute('aria-pressed','false');}});
shuffle();syncSettings();render();
