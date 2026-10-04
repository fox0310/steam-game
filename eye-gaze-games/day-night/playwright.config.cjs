const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:__dirname,testMatch:'playtest.spec.cjs',outputDir:'/tmp/day-night-playtest',timeout:60000,workers:2,
 webServer:{command:'python3 -m http.server 5220 --bind 127.0.0.1',cwd:require('node:path').resolve(__dirname,'../..'),url:'http://127.0.0.1:5220/eye-gaze-games/day-night/',reuseExistingServer:true},
 use:{baseURL:'http://127.0.0.1:5220'},
 projects:[{name:'Chrome',use:{browserName:'chromium',viewport:{width:1440,height:1000}}},{name:'Safari',use:{browserName:'webkit',viewport:{width:1366,height:1024}}}]
});
