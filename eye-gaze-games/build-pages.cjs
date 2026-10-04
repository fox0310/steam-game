const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const target=process.argv[2]?path.resolve(process.argv[2]):fs.mkdtempSync(path.join(os.tmpdir(),'steam-game-pages-'));
if(fs.existsSync(target)&&fs.readdirSync(target).length) throw new Error('Pages output directory must be empty');
fs.mkdirSync(target,{recursive:true});
// Keep the existing camera app at the root; publish only explicit game files.
fs.cpSync(path.join(root,'face-trigger'),target,{recursive:true,filter:src=>!/(?:playtest\.spec\.js|playwright\.config\.js|self-check\.mjs|server\.cjs|package\.json)$/.test(src)});
const game='eye-gaze-games/athletics';
for(const relative of ['eye-gaze-games/index.html',...['index.html','styles.css','app.js','track.mjs','assets/stadium.png','assets/runner.png'].map(name=>game+'/'+name)]){
  const output=path.join(target,relative);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(path.join(root,relative),output);
}
fs.writeFileSync(path.join(target,'.nojekyll'),'');
console.log('Pages output:',target);
