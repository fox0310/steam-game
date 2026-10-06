const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
let html=read('index.html').replace('<link rel="stylesheet" href="./styles.css">',()=>'<style>'+read('styles.css')+'</style>');
const files=[...Object.values(JSON.parse(read('assets/audio-map.json'))),...['self','want','go','drink','toilet','need','help','rest'].map(key=>'./assets/'+key+'.svg')];
for(const relative of files){const mime=relative.endsWith('.svg')?'image/svg+xml':'audio/wav';const data='data:'+mime+';base64,'+fs.readFileSync(path.join(__dirname,relative)).toString('base64');html=html.replaceAll(relative,()=>data);}
const code=read('model.mjs').replace(/^export /gm,'')+'\n'+read('app.js').replace(/^import .*\n/,'');
html=html.replace('<script type="module" src="./app.js"></script>',()=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>');
html=html.replace('href="../"','href="https://fox0310.github.io/steam-game/eye-gaze-games/"');
const target=path.join(__dirname,'圖字卡組句_單檔版.html');fs.writeFileSync(target,html);console.log('Built:',target);
