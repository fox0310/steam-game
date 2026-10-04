# 運動場追視

學生使用 Tobii／TD Control 將視線轉成游標。老師先按「準備開始」啟用聲音；游標落在運動員的圓形目標內便立即移動，離開或人物移出游標位置便停止。無點擊及凝視延遲。

## 使用

- 公開網址：[運動場追視](https://fox0310.github.io/steam-game/eye-gaze-games/athletics/)。

- 單檔：雙擊 `運動場追視_單檔版.html`，圖像與程式已嵌入，不需連線或伺服器。
- 網站：執行 `npm run start:eye-gaze`，開啟 `http://127.0.0.1:5220/eye-gaze-games/athletics/`。
- 老師可選全圈／上半圈／下半圈、16–80 秒速度、人物大小、正反方向、1–3 圈／段、路線提示、音量、靜音、專注畫面、全螢幕。
- 半圈走到另一端完成；若選多段，下一段反向走回去，沒有瞬間跳回起點。
- 游標離開時跑步節奏立即停止；完成目標只播放一次慶祝旋律。
- 空白鍵：準備開始／暫停；R：回起點；Esc：離開專注畫面。表單和按鈕保留原生鍵盤操作。
- 切換路線、方向或速度、開啟設定，以及瀏覽器失焦時會暫停。老師再按開始可繼續。

## 眼動操作界線

網站只接收瀏覽器游標位置，沒有直接連接 Tobii 感測器。需要 TD Control 的操作模式能把學生視線持續轉為游標移動；其屏幕 Trace 不保證就是瀏覽器游標。游標停留不能證明學生持續望住，因此實機連續游標、移開停止及舒適度需由老師驗證。活動進度是人物已移動的路程，不是追視準確率。

## 素材

`assets/stadium.png`：FOX 提供的 `田徑運動場_4.png` 副本；含原圖浮水印。
`assets/runner.png`：FOX 提供的 `跑步運動員_1.png` 副本。以白色圓形框呈現，原圖未修剪、去背或改動。
音效：Web Audio 即時合成鞋步節奏及慶祝旋律，沒有外部音檔。

## 建置與驗證

```bash
npm run build:eye-gaze
npm run test:eye-gaze
npm run playtest:eye-gaze
node eye-gaze-games/build-pages.cjs
```

Pages 打包保留鏡頭工具的根目錄，並加入 `/eye-gaze-games/athletics/`。只帶兩張遊戲使用的圖片，不發佈完整50張來源素材。FOX 已授權上載 GitHub；推送 main 後由 GitHub Actions 部署。
