# 素材來源

- 九張透明 SVG 由本專案原創繪製：貓、狗、小鳥、花朵、樹木、仙人掌、玩具車、皮球及椅子。沒有外部圖片庫或浮水印。
- 21 段內置粵語 WAV 使用 macOS Sinji（zh_HK）、語速 175，經 say 與 afconvert 生成 PCM 16-bit、22050 Hz mono；逐字稿見 audio-texts.json，對照表見 audio-map.json。
- 九段答對講解各自附加 0.42 秒原創三音獎勵（E5、G5、C6），用 Python 標準庫合成，音檔無削波。
- 辨認特徵由 FOX 教學目標改寫；植物會回應光與觸碰的補充依 README 中 RHS／Kew 來源核對，不宣稱植物沒有反應。
- 重新生成：python3 eye-gaze-games/classification/assets/make-audio.py，然後 npm run build:classification。
- Pages 只發佈 HTML／CSS／程式、九張 SVG 及 21 段 WAV；生成程式、README 及測試不發佈到遊戲目錄。
