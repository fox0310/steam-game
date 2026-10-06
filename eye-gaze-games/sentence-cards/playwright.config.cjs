const {defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({
 testDir:__dirname,testMatch:'playtest.spec.cjs',outputDir:'/tmp/sentence-cards-playtest',timeout:45000,workers:2,
 webServer:{command:'python3 -m http.server 5220 --bind 127.0.0.1',cwd:require('node:path').resolve(__dirname,'../..'),url:'http://127.0.0.1:5220/eye-gaze-games/sentence-cards/',reuseExistingServer:true},
 use:{baseURL:'http://127.0.0.1:5220'},
 projects:[
  {name:'Chrome touch',use:{browserName:'chromium',hasTouch:true,viewport:{width:1024,height:768}}},
  {name:'iPad portrait WebKit',use:{...devices['iPad (gen 7)'],browserName:'webkit',viewport:{width:768,height:1024}}},
  {name:'iPad landscape WebKit',use:{...devices['iPad (gen 7) landscape'],browserName:'webkit',viewport:{width:1024,height:768}}}
 ]
});
