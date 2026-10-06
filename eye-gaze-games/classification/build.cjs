const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
let html=read('index.html').replace('<link rel="stylesheet" href="./styles.css">',()=>'<style>'+read('styles.css')+'</style>');
const files=[...Object.values(JSON.parse(read('assets/audio-map.json'))),...['cat','dog','bird','flower','tree','cactus','toy','ball','chair'].map(key=>'./assets/'+key+'.svg')];
for(const file of files){const mime=file.endsWith('.svg')?'image/svg+xml':'audio/wav';const data='data:'+mime+';base64,'+fs.readFileSync(path.join(__dirname,file)).toString('base64');html=html.replaceAll(file,()=>data);}
const code=read('model.mjs').replace(/^export /gm,'')+'\n'+read('app.js').replace(/^import .*\n/,'');
html=html.replace('<script type="module" src="./app.js"></script>',()=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>').replace('href="../"','href="https://fox0310.github.io/steam-game/eye-gaze-games/"');
const target=path.join(__dirname,'分類配對_單檔版.html');fs.writeFileSync(target,html);console.log('Built:',target);
