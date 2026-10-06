"""Bundle Cantonese voice clips with the installed macOS Sinji voice."""
from pathlib import Path
import subprocess, tempfile, json, wave
root=Path(__file__).parent
texts={
 'self':'我','want':'想','go':'去','drink':'飲水','toilet':'廁所','need':'需要','help':'幫忙','rest':'休息',
 'ask-help':'請幫我。',
 'sentence-water':'我想飲水。','sentence-toilet':'我想去廁所。','sentence-rest':'我想休息。','sentence-help':'我需要幫忙。',
 'prompt-water':'口渴了，想飲水。請用圖字卡告訴老師。',
 'prompt-toilet':'想去廁所，怎樣告訴老師？',
 'prompt-rest':'有點累了，想休息。請用圖字卡告訴老師。',
 'prompt-help':'遇到困難，需要成人幫忙。請用圖字卡告訴老師。',
 'retry':'再看看圖字卡的次序。你可以改一改，或者按請幫我。'
}
assets={}
with tempfile.TemporaryDirectory(prefix='sentence-cantonese-') as temp:
 for key,text in texts.items():
  aiff=Path(temp)/(key+'.aiff');target=root/'audio'/(key+'.wav')
  subprocess.run(['/usr/bin/say','-v','Sinji','-r','145','-o',str(aiff),text],check=True)
  subprocess.run(['/usr/bin/afconvert','-f','WAVE','-d','LEI16@22050',str(aiff),str(target)],check=True)
  with wave.open(str(target),'rb') as f:
   assert f.getnframes()>0 and f.getframerate()==22050
  assets[key]='./assets/audio/'+key+'.wav'
(root/'audio-texts.json').write_text(json.dumps(texts,ensure_ascii=False,indent=2)+'\n')
(root/'audio-map.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
print('Created',len(assets),'bundled Cantonese PCM WAV clips (Sinji zh_HK).')
