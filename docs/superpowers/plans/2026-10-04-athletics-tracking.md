# 運動場追視實作計畫

> 使用 Superpowers executing-plans 在本對話實作；FOX 已指示開始製作。測試後提供可開啟的結果供老師試用。

**目標：** 完成全圈、上半圈、下半圈的運動場追視網站。
**架構：** 純函式 trackPoint(mode, phase, reverse) 回傳場地座標。app.js 以 requestAnimationFrame 更新人物；老師設定與學生畫面使用 DOM。
**技術：** 原生 HTML、CSS、JavaScript，既有 Playwright，Node 打包。
**設計：** ../specs/2026-10-04-athletics-tracking-design.md

## 限制及檢查

- 保留原素材和原有未提交變更，不新增依賴。
- 無眼動成績或眼動資料蒐集，移動只屬教材展示。
- 注意半圈不跳躍、游標離開立即停止、鞋步聲與慶祝聲、設定損壞、縮窄畫面、失焦暫停、單檔離線開啟。

## 任務

- [x] 路線：先寫 Node self-check.mjs，驗證半圈位於正確半邊與正確終點、全圈接縫連續及反方向；再實作 track.mjs。
- [x] 畫面：建立 athletics/index.html、styles.css、app.js；三路線、老師調整及專注畫面。
- [x] 交付：建立 build.cjs，產出單檔 HTML；建立 build-pages.cjs，保留鏡頭工具根目錄並打包遊戲到子路徑。
- [x] 驗證：Playwright 桌面 Chrome／WebKit／平板／手機測試及截圖；核對整體實作。

## 決定

- 按 FOX 後續要求：半圈到達另一端後完成，不再自動往返；背景為橢圓跑道，所以全圈沿跑道輪廓而非畫一個與跑道分離的正圓。
- 第一版完成後，FOX 已授權推送 GitHub 並公開部署。

## 驗證紀錄

- Node 路線檢查通過。
- Chrome／WebKit 24 項瀏覽器測試通過，含真實游標事件、半圈折返、跑步／慶祝音效排程、單檔 file 開啟、設定及載圖失敗。
- 桌面／窄螢幕截圖已檢查。首輪發現 SVG hidden 屬性未同步，改用 toggleAttribute 後全數通過。
- Superpowers 要求的獨立唯讀審查完成，未發現重大問題。
- Tobii／TD Control 實機與聲量須老師試用。
- 上載前重新驗證：24 項瀏覽器測試通過；鏡頭工具部署檢查改為實際打包並比對原檔，確認根目錄與眼動遊戲子路徑均完整。
