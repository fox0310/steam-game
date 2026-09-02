# Task Intent

- Requested outcome: 建立同一 QR Code、五部 iPad 各自獨立運行的人臉觸發 PWA。
- Scope: `face-trigger/`、相關測試、Pages workflow、package scripts、README。
- Non-goals: 後端、同步、帳戶、普通話、影像保存、修改現有遊戲。
- Risk hints: iPad Safari 相機權限、粵語 voice、MediaPipe vendor、離線 cache。
- Baseline refs: 已批准設計規格、實作計劃、2026-09-02 baseline、目前 `main`。
- Baseline usage: required/acknowledged/cited refs 完整；missing refs 無；decision `continue`。
- Impact: 新增可獨立退役的靜態 app，不改現有 runtime。

## Execution Readiness View

- Intent lock: 同一 QR、五部 iPad 獨立運行。
- Scope fence: 無後端、同步、裝置 ID、普通話或影像上傳。
- Owner constraint: `trigger-state.js` 擁有觸發規則。
- Compatibility: 現有三個遊戲不變。
- Verification: self-check、Playwright、離線檢查、實體 iPad 清單。
- Stop: done、blocked、needs-verification 或 scope-exceeded。
