# Codex 遊戲製作模式記錄

日期：2026-06-19
項目：四人共享礦場競技遊戲
GitHub：<https://github.com/fox0310/steam-game>

## 目的

這份記錄用來保存今次製作遊戲的工作模式，方便之後：

1. 製作另一隻遊戲時使用相同模式。
2. 修改或優化目前已完成的遊戲。
3. 讓 Codex 讀取後快速製作其他遊戲。

## 已完成的遊戲模式

- 以 HTML Canvas 製作前端遊戲畫面。
- 使用 Node.js 內建 HTTP + WebSocket server 做多人同步。
- Server 作為權威來源，負責玩家狀態、金礦、倒數、分數和命中判定。
- Host 畫面顯示全局競技狀態。
- Player 畫面只顯示自己，並且只能用 Space 控制自己。
- 同一批金礦由所有玩家共享。
- Host 可重開遊戲，倒數回到 3 分鐘。
- Server 會自動偵測 LAN IP，Host 畫面會顯示可複製的 Host / Player 連結。

## 推薦重用架構

```text
index.html      畫面與 CSS
game.js         Canvas 渲染、玩家操作、WebSocket client
server.js       HTTP 靜態服務、WebSocket server、權威遊戲狀態
assets/         圖片與素材
package.json    npm start 啟動設定
README.md       部署與使用教學
```

## 製作新遊戲時的流程

1. 先定義最小玩法，不先做複雜功能。
2. 用 Canvas 做可玩的第一版。
3. 單機版本先跑通輸入、分數、倒數和結算。
4. 再加 Node WebSocket server。
5. 所有重要判定都放在 server。
6. Player 端只送操作，例如 `fire`、`move`、`ready`。
7. Server 廣播完整狀態給 Host 和 Player。
8. 最後才處理部署、全螢幕、音效、素材美化。

## 多人同步原則

- Player 不自行決定得分。
- Player 不自行移除共享物件。
- Server 判斷誰先命中。
- Server 廣播最新狀態。
- Host 只管理與觀戰，不代替玩家操作。

## 部署模式

### 本地 / 學校網絡

一部電腦作主機：

```bash
git clone https://github.com/fox0310/steam-game.git
cd steam-game
npm install
npm start
```

其他電腦使用 Host 畫面顯示的 LAN 連結加入。

### 雲端 / VM

在 VM 上執行：

```bash
git clone https://github.com/fox0310/steam-game.git
cd steam-game
npm install
nohup npm start > game.log 2>&1 &
```

需要開放 TCP port `5173`。

## 之後優化目前遊戲可做的事

- 加入正式房間碼。
- 加入準備 / 開始流程。
- 加入手機版 Player UI。
- 加入斷線重連。
- 加入 HTTPS / 網域名。
- 加入更完整音效和動畫。
- 將遊戲狀態拆成更清晰的 `state` / `rules` / `render` 模組。

## 給 Codex 的重用提示

下次製作新遊戲時，可以直接讀取這份記錄，並沿用以下要求：

- 使用最少檔案先完成可玩版本。
- 優先使用原生 Web API 和 Node.js 標準庫。
- 多人同步使用 WebSocket。
- Server 權威判定。
- Host 和 Player 視角分離。
- 先完成核心玩法，再做素材、音效和部署。
