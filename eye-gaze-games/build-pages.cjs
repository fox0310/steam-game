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
const vehicles='eye-gaze-games/vehicles';
const dayNight='eye-gaze-games/day-night';
for(const relative of ['eye-gaze-games/index.html',...['index.html','styles.css','app.js','track.mjs','assets/stadium.png','assets/runner.png'].map(name=>game+'/'+name),...['index.html','styles.css','app.js','track.mjs','assets/oval-road.svg','assets/taxi.png','assets/truck.png','assets/schoolbus.png'].map(name=>vehicles+'/'+name),...['index.html','styles.css','app.js','track.mjs','assets/hong-kong.png','assets/sun.svg','assets/moon.svg','assets/daytime.wav','assets/nighttime.wav'].map(name=>dayNight+'/'+name)]){
  const output=path.join(target,relative);fs.mkdirSync(path.dirname(output),{recursive:true});fs.copyFileSync(path.join(root,relative),output);
}
fs.writeFileSync(path.join(target,'.nojekyll'),'');
console.log('Pages output:',target);
