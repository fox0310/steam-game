# 圖卡及粵語素材

- 八張 SVG 由本專案直接繪製，背景透明，以簡單圖案配合繁體字；沒有使用外部圖庫。
- `audio/` 共 18 段 mono PCM 16-bit、22050 Hz WAV。
- 詞語、整句、情境及求助文字見 `audio-texts.json`；網址對照見 `audio-map.json`。
- 音檔使用 macOS 內置 Sinji 粵語聲音（`zh_HK`），語速 145。生成指令為 `/usr/bin/say`，再由 `/usr/bin/afconvert` 轉為 WAV。
- 已生成的音檔直接隨網頁播放；不呼叫 SpeechSynthesis，不要求 iPad 安裝特定聲音。

在已安裝 Sinji 的 Mac 重新生成：

```bash
python3 eye-gaze-games/sentence-cards/assets/make-audio.py
npm run build:sentence-cards
```

生成程式、測試及本說明不會發佈到 Pages 遊戲目錄。正式網站只發佈 HTML、CSS、程式、八張 SVG 及 18 段 WAV。
