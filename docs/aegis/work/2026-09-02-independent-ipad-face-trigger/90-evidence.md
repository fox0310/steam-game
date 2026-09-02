# Evidence Bundle

- Task 1 RED: `node face-trigger/self-check.mjs` → `ERR_MODULE_NOT_FOUND`，缺少預期 owner。
- Task 1 GREEN: `node face-trigger/self-check.mjs` → `face-trigger self-check: 7 checks passed`。
- Covered: 500ms 穩定、短暫誤判、停留不重播、離開 2s、播放期間離開、暫停、設定 schema、粵語內容清單。
- Task 2 RED: `trigger.forceTrigger is not a function`。
- Task 2 GREEN: `face-trigger self-check: 9 checks passed`；`node --check` 通過 `app.js` 與 `trigger-state.js`。
- Task 2 browser: 頁面可見五個內容選項；選擇輕快音樂後啟動及手動播放，狀態顯示「正在播放：輕快音樂」，計數 0→1，中斷後顯示成功。
- Task 3 RED: 加入本機 Face Mesh wiring assertion 後失敗，確認 runtime owner 尚未存在。
- Task 3 GREEN: `face-trigger self-check: 10 checks passed`；`node --check face-trigger/app.js` 與 `git diff --check` 通過。
- Task 3 runtime: 固定 `@mediapipe/face_mesh@0.4.1633559619` 約 16 MB，所有模型及 WASM 由 `./vendor/face_mesh/` 載入。
- Task 3 camera: 使用原生 `navigator.mediaDevices.getUserMedia` 與單一 frame loop；移除會自行 `alert()` 的 camera helper；錯誤後保留手動測試。
