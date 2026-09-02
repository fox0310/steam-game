# 五部 iPad 獨立人臉觸發 PWA 實作計劃

## Goal

依已批准規格建立可由同一 QR Code 開啟、五部 iPad 各自獨立運行的 GitHub Pages PWA。

## Architecture

`face-trigger/` 是獨立靜態 app。`trigger-state.js` 擁有可測試觸發狀態；`app.js` 協調 DOM、相機、MediaPipe、音訊與本機設定；Service Worker 擁有離線快取。GitHub Pages workflow 只發佈此目錄。

## Tech Stack

- 原生 HTML、CSS、ES modules、Web Audio、Web Speech、Service Worker。
- `@mediapipe/face_mesh@0.4.1633559619`。
- `qrcodejs@1.0.0`。
- Node self-check 與現有 `@playwright/test`。

## Baseline/Authority Refs

- `docs/superpowers/specs/2026-09-02-independent-ipad-face-trigger-design.md`
- `docs/aegis/baseline/2026-09-02-initial-baseline.md`
- `/Users/kille/.codex/USER.md`

## Compatibility Boundary

- 不改 root、fishing 或 rocket 遊戲 runtime。
- Pages artifact 只包含 `face-trigger/`。
- Safari 需 HTTPS；localhost 只供桌面檢查。
- 相機影像只在 client 記憶體處理。

## TDD Route

- Mode: auto
- Decision: strict
- Strict authority: recorded auto decision
- Strict signals: 觸發行為、持久化、權限及離線更新均有回歸風險
- Light eligibility: 不符合；涉及多個瀏覽器 API 與持久狀態
- TDD-fit exception: 硬件相機及 iPad 系統語音需實機驗收
- Test posture: strict RED test；硬件部分另作人工驗收
- Reason: 狀態機與設定可純函式測試，先鎖定規則可減少重複觸發風險
- Verification: `npm run test:face-trigger`、`npm run playtest:face-trigger`

## Scope Checks

### Aegis Visibility

鎖定觸發狀態、離線發佈與實體 iPad 驗收邊界，避免把桌面模擬當成硬件證據。

### BaselineUsageDraft

- Required baseline refs: 已批准規格、package scripts、現有遊戲目錄邊界
- Delivered context refs: 設計規格及 2026-09-02 baseline
- Acknowledged before plan refs: 全部
- Cited in plan refs: 全部
- Missing refs: 無
- Decision: continue

### Requirement Ready Check

- Requirement source refs: 已批准設計規格
- Goals and scope refs: 規格的目標、非目標、驗收條件
- User / scenario refs: 五部 iPad、同一 QR、獨立運行
- Requirement item refs: 觸發狀態、五種內容、離線 PWA、GitHub Pages
- Acceptance / verification criteria refs: 規格測試策略及驗收條件
- Open blocker questions: 無
- Decision: ready

### Change Necessity

- User-visible need: 現有 repo 沒有此人臉觸發 PWA
- No-change / non-code option: 貼上的 HTML 依賴 CDN，沒有可靠離線狀態或 Pages 發佈
- Why code change is necessary: 必須新增本機偵測、觸發狀態、離線快取及發佈資產
- Minimum change boundary: `face-trigger/`、root package scripts、單一 Pages workflow、README 入口
- Decision: code-change

### Existence Check

- Proposed new surface: `face-trigger/` app 與 Pages workflow
- Existing owner / reuse candidate: 現有遊戲均為獨立目錄；無相機／PWA owner
- Why existing surface is insufficient: 現有遊戲使用不同交互及 server 邊界
- Creation proof: 批准規格要求獨立靜態 PWA 與 HTTPS 發佈
- Entropy / retirement impact: app 可整個目錄移除；workflow 只擁有該 artifact
- Decision: add-with-proof

### Architecture Integrity Lens

- Invariant: 每部 iPad 只有本機狀態，相機 frame 永不離開裝置
- Canonical owner / contract: 狀態機擁有觸發規則；controller 擁有瀏覽器 API；Service Worker 擁有快取
- Responsibility overlap: 無；DOM 不擁有觸發規則
- Higher-level simplification: 無後端、無框架、無裝置 ID
- Retirement / falsifier: Safari 證據顯示舊 runtime 失效時，才升級 MediaPipe Tasks
- Verdict: proceed

### Complexity Budget

- Artifact class: 獨立小型 PWA
- Target files / artifacts: 狀態機、controller、UI、worker、測試、workflow
- Current pressure: 新 app，無既有內部複雜度
- Projected post-change pressure: 中；相機與音訊 API 集中於 controller
- Budget result: within-budget
- Planned governance: 狀態邏輯從 controller 分離；不增加通用 abstraction

### Plan-Time Complexity Check

- Target files: `face-trigger/app.js`、`face-trigger/trigger-state.js`
- Existing size / shape signals: 無現有檔案
- Owner fit: 狀態與瀏覽器協調責任分開
- Add-in-place risk: 單檔原型超過千行，難以測試
- Better file boundary: HTML、CSS、狀態、controller、worker 分離
- Recommendation: add owner file

### Plan Pressure Test

- Owner / contract / retirement: owner 清楚；可整個 app 退役
- Architecture integrity / higher-level path: 靜態 Pages 是最低複雜度
- Verification scope: 純邏輯、瀏覽器、離線及實機分層
- Task executability: 路徑、版本與命令已固定
- Pressure result: proceed

## Execution Readiness View

- Intent Lock: 同一 QR、五部 iPad 獨立運行
- Scope Fence: 不加入同步、帳戶、後端、普通話或影像保存
- Baseline Lock: 已批准設計規格與目前 main
- Approved Behavior: 人臉穩定 500ms 觸發；離開 2s 才重置
- Owner / Contract Constraints: `trigger-state.js` 是觸發規則唯一 owner
- Compatibility Boundary: 現有三個遊戲不變
- Retirement Boundary: `face-trigger/` 與 Pages workflow 可獨立移除
- Task Batches: 邏輯；UI/runtime；PWA/vendor；Pages/docs；完整驗證
- Test Obligations: strict RED/GREEN、Playwright、快取檢查、實機清單
- Review Gates: 每個 task 通過 focused verification 才提交
- Drift / Rewind Rules: vendor 或 Safari 不兼容時回到 runtime 選擇，不加 server fallback
- Evidence Required Before Completion: 自動測試、視覺檢查、Pages 狀態；實機限制明示
- Advisory Boundary: method-pack execution guidance only; not GateDecision, PolicySnapshot, or completion authority

## Files

Create：`face-trigger/index.html`、`styles.css`、`trigger-state.js`、`app.js`、`service-worker.js`、`manifest.webmanifest`、`self-check.mjs`、`playtest.spec.js`、`playwright.config.js`、`server.cjs`、`package.json`、`assets/app-icon.svg`、`vendor/**`、`.github/workflows/face-trigger-pages.yml`。

Modify：`package.json` 加測試與本機啟動 scripts；`README.md` 加使用方式。

## Tasks

### Task 1：觸發狀態與設定

- Files: create `face-trigger/self-check.mjs`, `face-trigger/trigger-state.js`。
- Why: 防止同一張臉持續停留時重播，安全讀取每部 iPad 設定。
- Change Necessity: 原型把計時與 DOM 混合；最低邊界是純狀態 owner。
- Impact/Compatibility: 只新增 ES module。
- Verification: `node face-trigger/self-check.mjs`。
- Steps: 先寫 500ms 穩定、誤判、停留、離開 2s、播放期間離開、暫停及 schema fallback 測試並確認 RED；再實作純狀態 API，確認 GREEN；commit `feat: add face trigger state machine`。

### Task 2：介面與音訊

- Files: create `face-trigger/index.html`, `styles.css`, `app.js`, `assets/app-icon.svg`; modify self-check。
- Why: 提供相機主畫面、五種播放內容與無障礙控制。
- Change Necessity: 原型依賴 CDN 並包含已取消的裝置編號。
- Impact/Compatibility: selectors 與 browser API 留在新 app。
- Verification: self-check；本機手動測試五種內容。
- Steps: 先測預設設定只含粵語與 music 並確認 RED；建立 semantic HTML、44px controls、直橫向、安全區及 reduced-motion；實作 localStorage、精確 `zh-HK` voice、原創 Web Audio 旋律、音量／時長／停止；確認 GREEN；commit `feat: build independent face trigger interface`。

### Task 3：本機 MediaPipe 與相機

- Files: create `face-trigger/vendor/**`, `vendor/LICENSES.md`; modify `app.js`。
- Why: 首次載入後不依賴 CDN，frame 只在裝置內處理。
- Change Necessity: 瀏覽器原生 API 沒有人臉模型。
- Impact/Compatibility: vendor 版本固定；無網絡 API。
- Verification: camera smoke test；`rg -n 'https?://' face-trigger` 只容許 canonical URL 及來源文字。
- Steps: `npm pack` 固定 Face Mesh 版本並只複製執行檔；以原生 `getUserMedia` 實作鏡頭啟停／切換，避免 helper 自行彈出錯誤；callback 只傳 boolean 與 timestamp 給狀態機；加入權限、模型及 Wake Lock 錯誤處理；確認 self-check；commit `feat: add local face detection runtime`。

### Task 4：離線 PWA、QR 與 Playwright

- Files: create `manifest.webmanifest`, `service-worker.js`, `playtest.spec.js`, `playwright.config.js`, `server.cjs`, `face-trigger/package.json`; modify `index.html`, `app.js`, root `package.json`。
- Why: 同一固定 QR 可進入，首次快取後可離線。
- Change Necessity: 普通靜態頁沒有離線 readiness 或更新控制。
- Impact/Compatibility: cache 只涵蓋新 app。
- Verification: `npm run test:face-trigger`、`npm run playtest:face-trigger`。
- Steps: 先寫主要 controls、無裝置 ID、五選項、canonical QR、localStorage、iPad layout assertions 並確認 RED；加入 manifest、版本 cache、離線 ready、update ready；vendor QRCode.js；加 package scripts；確認 GREEN；commit `feat: make face trigger installable offline`。

### Task 5：GitHub Pages 與文件

- Files: create `.github/workflows/face-trigger-pages.yml`; modify `README.md`。
- Why: 不用長開 Mac，五部 iPad 可由同一 HTTPS 網址進入。
- Change Necessity: repo 沒有 Pages artifact owner。
- Impact/Compatibility: workflow 只發佈 `face-trigger/`，不改 VM gateway。
- Verification: workflow path 檢查；完整測試。
- Steps: 建立 Pages Actions workflow；README 加本機命令、Pages URL、QR、首次快取及實機清單；執行全測試與 `git diff --check`；commit `docs: add face trigger deployment guide`。

### Task 6：完整驗證

- Files: 只在測試證實問題時改上述 owner。
- Why: 以最新證據確認交付範圍。
- Change Necessity: 驗證本身不新增功能。
- Impact/Compatibility: 不擴大範圍。
- Verification: `npm run test:face-trigger`; `npm run playtest:face-trigger`; `git diff --check`; `git status --short --branch`。
- Steps: 執行全部驗證；檢查 desktop、iPad portrait、landscape；核對未碰既有 Obsidian 檔；如獲授權推送則檢查 Pages，否則交付本機 commit；明示實機驗收仍待 FOX。

## Risks

- iPad 未安裝 `zh-HK` voice：顯示指引，不回退普通話。
- iOS Safari Web Speech、Wake Lock 或 cache 差異：實機驗收；失敗時保留音樂與手動測試。
- MediaPipe 舊 runtime 日後失效：先固定版本，只有實機證據才升級。
- GitHub Pages 可能需要 FOX 在 repo Settings 啟用 Actions source 一次。

## Retirement

移除 `face-trigger/`、Pages workflow、package scripts 及 README 段落即可完整退役。不保留 CDN fallback 或舊原型。

## Execution Route

- Decision: inline
- Evidence: 任務依序共享同一 app 邊界；未獲使用 subagent 的明示要求
- Fallback: vendor 或 Safari 問題擴大時停止並回到 runtime 選擇
- User confirmation required: no
