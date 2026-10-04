const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');
const image=name=>'data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'assets',name)).toString('base64');
let html=read('index.html')
  .replace('<link rel="stylesheet" href="./styles.css">',()=>'<style>'+read('styles.css')+'</style>')
  .replace('./assets/stadium.png',()=>image('stadium.png'))
  .replace('./assets/runner.png',()=>image('runner.png'));
const code=read('track.mjs').replace(/^export /gm,'')+'\n'+read('app.js').replace(/^import .*\n/,'');
html=html.replace('<script type="module" src="./app.js"></script>',()=>'<script>'+code.replace(/<\/script/gi,'<\\/script')+'</script>');
const target=path.join(__dirname,'運動場追視_單檔版.html');
fs.writeFileSync(target,html);
console.log('Built standalone HTML:',target);
