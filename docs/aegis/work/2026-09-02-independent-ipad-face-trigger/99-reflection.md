# Reflection

## Outcome

完成獨立靜態 PWA：同一 QR Code 進入，每部 iPad 只保留本機設定及觸發狀態；沒有裝置編號、同步或影像上傳。

## Decisions

- 觸發規則由純狀態機擁有，瀏覽器 controller 只接收人臉 boolean 及時間。
- MediaPipe Face Mesh 固定版本並完整本機化，離線不依賴 CDN。
- 相機使用原生 `getUserMedia`，移除會自行彈出錯誤的 helper。
- 四段語音固定 `zh-HK`；找不到粵語聲音時不回退普通話。
- GitHub Pages artifact 只含 `face-trigger/`，不影響現有三個遊戲。

## Verification

- Node self-check 12/12。
- Playwright 5/5：QR、五選項、本機持久化、iPad 直橫向、相機拒絕降級、離線重載。
- Workflow YAML、JavaScript 語法、離線資產清單及 diff 檢查通過。
- 瀏覽器人工核對 QR modal、固定網址及「可離線」狀態。

## Remaining hardware acceptance

需在實體 iPad Safari 核對相機權限、人臉穩定度、已下載的粵語系統聲音及加入主畫面行為。這些不是桌面模擬可證實的項目。
