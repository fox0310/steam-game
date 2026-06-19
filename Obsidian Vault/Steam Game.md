# Steam Game

日期：2026-06-19
GitHub：<https://github.com/fox0310/steam-game>

## 項目總覽

這個文件整合 Steam Game 項目的設計、開發模式、部署方式和之後優化方向。

目前完成的遊戲是「四人共享礦場競技遊戲」：

- Host 顯示全局畫面。
- Player 只顯示自己畫面。
- 所有玩家共享同一批金礦。
- 每位 Player 只用 Space 操作。
- Server 權威判定命中、分數、倒數和金礦狀態。
- 支援 LAN / VM / 公網部署。

## 主要檔案

```text
index.html      畫面與 CSS
game.js         Canvas 渲染、玩家操作、WebSocket client
server.js       HTTP 靜態服務、WebSocket server、權威遊戲狀態
assets/         圖片與素材
package.json    npm start 啟動設定
README.md       部署與使用教學
```

## 已完成功能

- HTML Canvas 遊戲畫面。
- Node.js 內建 HTTP + WebSocket server。
- 4 位玩家同步競技。
- Host / Player 視角分離。
- Player 頁不能控制其他玩家。
- Host 可重開遊戲。
- 3 分鐘倒數。
- 金礦可在遊戲中補生。
- Server 自動偵測 LAN IP。
- Host 畫面顯示可複製的 Host / Player 連結。
- 全螢幕顯示。
- 競技背景音樂。
- GitHub repo 已建立。

## 多人同步原則

- Player 不自行決定得分。
- Player 不自行移除共享物件。
- Player 只送操作，例如 `fire`、`move`、`ready`。
- Server 判斷誰先命中。
- Server 廣播完整狀態。
- Host 只管理與觀戰，不代替玩家操作。

## 製作其他遊戲時沿用模式

1. 先定義最小玩法，不先做複雜功能。
2. 用 Canvas 做可玩的第一版。
3. 單機版本先跑通輸入、分數、倒數和結算。
4. 再加 Node WebSocket server。
5. 所有重要判定放在 server。
6. Server 廣播完整狀態給 Host 和 Player。
7. 最後才處理部署、全螢幕、音效、素材美化。

## 本地 / 學校網絡部署

一部電腦作主機：

```bash
git clone https://github.com/fox0310/steam-game.git
cd steam-game
npm install
npm start
```

其他電腦使用 Host 畫面顯示的 LAN 連結加入。

## 雲端 / VM 部署

在 VM 上執行：

```bash
git clone https://github.com/fox0310/steam-game.git
cd steam-game
npm install
nohup npm start > game.log 2>&1 &
```

需要開放 TCP port `5173`。

Google Cloud VM 外部玩家網址格式：

```text
http://外部IP:5173/?role=host
http://外部IP:5173/?player=0
http://外部IP:5173/?player=1
http://外部IP:5173/?player=2
http://外部IP:5173/?player=3
```

## 之後優化方向

- 加入正式房間碼。
- 加入準備 / 開始流程。
- 加入手機版 Player UI。
- 加入斷線重連。
- 加入 HTTPS / 網域名。
- 加入更完整音效和動畫。
- 將遊戲狀態拆成更清晰的 `state` / `rules` / `render` 模組。

## 給 Codex 的提示

之後修改這個項目或製作其他遊戲時，先讀這份文件。

要求：

- 使用最少檔案先完成可玩版本。
- 優先使用原生 Web API 和 Node.js 標準庫。
- 多人同步使用 WebSocket。
- Server 權威判定。
- Host 和 Player 視角分離。
- 先完成核心玩法，再做素材、音效和部署。
