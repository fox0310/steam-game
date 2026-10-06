"""Original lesson script, bundled macOS Sinji Cantonese and a synthesized reward."""
from pathlib import Path
import json,subprocess,tempfile,wave,math,struct
root=Path(__file__).parent
items=[('cat','貓','animal'),('dog','狗','animal'),('bird','小鳥','animal'),('flower','花朵','plant'),('tree','樹木','plant'),('cactus','仙人掌','plant'),('toy','玩具車','object'),('ball','皮球','object'),('chair','椅子','object')]
categories={'animal':'動物','plant':'植物','object':'死物'}
features={'animal':'會成長、活動同叫，聽到聲音會有反應。','plant':'會成長，但唔會好似動物咁走動或者叫。','object':'唔會成長，亦唔會自己活動或者回應呼喚。'}
texts={**{'prompt-'+key:'請找'+label+'。見到'+label+'，就按空白鍵。' for key,label in categories.items()}}
for item,name,category in items:
 for result in ['correct','wrong']:
  texts[result+'-'+item]=('答對了！' if result=='correct' else '')+name+'係'+categories[category]+'，'+features[category]+('' if result=='correct' else '再試一次。')
(root/'audio').mkdir(exist_ok=True)
manifest={}
with tempfile.TemporaryDirectory(prefix='classification-voice-') as temp:
 for key,text in texts.items():
  aiff=Path(temp)/(key+'.aiff');target=root/'audio'/(key+'.wav')
  subprocess.run(['/usr/bin/say','-v','Sinji','-r','175','-o',str(aiff),text],check=True)
  subprocess.run(['/usr/bin/afconvert','-f','WAVE','-d','LEI16@22050',str(aiff),str(target)],check=True)
  with wave.open(str(target),'rb') as f:
   assert f.getnframes()>0
   frames=f.readframes(f.getnframes());rate=f.getframerate()
  if key.startswith('correct-'):
   # Append a short, original three-note reward, after the complete explanation.
   samples=[]
   for frequency in [659.25,783.99,1046.5]:
    length=int(rate*.14)
    for n in range(length):
     t=n/rate;envelope=math.sin(math.pi*n/length)**2
     samples.append(int(6500*envelope*math.sin(2*math.pi*frequency*t)))
   with wave.open(str(target),'wb') as f:
    f.setparams((1,2,rate,0,'NONE','not compressed'));f.writeframes(frames+struct.pack('<'+'h'*len(samples),*samples))
  with wave.open(str(target),'rb') as f:print(key,round(f.getnframes()/f.getframerate(),2),'s')
  manifest[key]='./assets/audio/'+key+'.wav'
(root/'audio-texts.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2)+'\n')
(root/'audio-map.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
