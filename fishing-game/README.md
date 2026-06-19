# 四人共享海域捕魚競技

四人聯網釣魚遊戲。玩家在船上操作左右擺動大炮，按 Space 發射魚網捕魚。

## 開始

```bash
cd fishing-game
node server.js
```

預設 port 是 `5180`。

- Host：`http://localhost:5180/?role=host`
- Player 1：`http://localhost:5180/?player=0`
- Player 2：`http://localhost:5180/?player=1`
- Player 3：`http://localhost:5180/?player=2`
- Player 4：`http://localhost:5180/?player=3`

## 規則

- 共享魚群。
- Server 權威判定捕獲。
- 小魚 100 分。
- 中魚 250 分。
- 大鱼 500 分。
- 稀有金魚 800 分。
- 限時 3 分鐘。
- 魚群會持續補生，畫面有較多魚可捕捉。

## 與掘金遊戲同時運行

在 repo 根目錄執行：

```bash
npm run start:all
```

- 掘金：`http://localhost:5173/?role=host`
- 釣魚：`http://localhost:5180/?role=host`

放到 VM 時把 `localhost` 換成 VM 外部 IP，並開放 TCP `5173` 和 `5180`。
