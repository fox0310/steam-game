# iPad 聲音檢查

五款遊戲的音樂、音效及粵語在支援 Audio Session API 的瀏覽器使用 `playback` 模式；其他瀏覽器保留原有播放方式。由老師觸控開始或聲音按鈕啟動，沒有自動播聲，也不改動已選靜音／音量設定。

## 課堂操作

1. 用 Safari 開啟原有 HTTPS 遊戲網址，重新整理。
2. 在 iPad 控制中心關閉「靜音」、調高媒體音量，確認聲音沒有輸出到其他藍牙裝置。
3. 「老師設定」開啟聲音，音量大於零；老師親手按「開始」或「聽情境／聽目標」。第一、二款只在追視移動及完成時有音效，第三款開始後有背景音樂，第四、五款選卡／作答時有粵語。
4. 若仍無聲，記下遊戲名稱、iPadOS 版本、瀏覽器、其他影片是否有聲及畫面錯誤提示。

Safari 引擎的桌面 iPad 模擬可驗證播放程式，無法驗證實機喇叭、靜音開關及音訊輸出。實際裝置需由 FOX 再試。

## 驗證

`npx playwright test --config eye-gaze-games/audio-playtest.config.cjs --reporter=line`

30 項 Chrome／iPad WebKit 測試：五款實際聲音啟動、支援時指定 playback、API 缺少或拋錯時仍可播放。既有音樂、語音及單檔測試另行執行。

來源：[W3C Audio Session 草案](https://w3c.github.io/audio-session/)、[WebKit iOS Web Audio 靜音行為](https://bugs.webkit.org/show_bug.cgi?id=237322)、[Apple 無聲檢查](https://support.apple.com/zh-hk/118432)。本修正處理預設音訊模式的兼容風險，未確認 FOX 實機無聲的唯一原因。
