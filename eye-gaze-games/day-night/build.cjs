const fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const data=name=>{const mime=name.endsWith('.wav')?'audio/wav':name.endsWith('.svg')?'image/svg+xml':'image/png';return 'data:'+mime+';base64,'+fs.readFileSync(path.join(__dirname,'assets',name)).toString('base64');};
const shared=fs.readFileSync(path.join(__dirname,'../athletics/styles.css'),'utf8');
let html=read('index.html').replace('<link rel="stylesheet" href="./styles.css">',()=>'<style>'+shared+'\n'+read('styles.css').replace(/^@import[^\n]*\n/,'')+'</style>');
for(const name of ['hong-kong.png','sun.svg','moon.svg','daytime.wav','nighttime.wav'])html=html.replaceAll('./assets/'+name,()=>data(name));
const code=read('track.mjs').replace(/^export /gm,'')+'\n'+read('app.js').replace(/^import .*\n/,'');
html=html.replace('<script type="module" src="./app.js"></script>',()=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>');
const target=path.join(__dirname,'香港日月追視_單檔版.html');fs.writeFileSync(target,html);console.log('Built standalone HTML:',target);
