# Steam Game

這個 repo 目前包含兩個四人聯網 Canvas 遊戲：

- `.`：共享礦場競技
- `fishing-game/`：四人共享海域捕魚競技

## 同時運行兩隻遊戲

同一部電腦 / VM 下載這個 repo 後，可以同時開掘金和釣魚，兩隻遊戲用不同 port，所以不會互相覆蓋。

```bash
npm run start:all
```

網址：

- 掘金 Host：`http://localhost:5173/?role=host`
- 掘金 Player：`http://localhost:5173/?player=0`
- 釣魚 Host：`http://localhost:5180/?role=host`
- 釣魚 Player：`http://localhost:5180/?player=0`

如果放在 VM，把 `localhost` 換成 VM 外部 IP：

```text
http://VM外部IP:5173/?role=host
http://VM外部IP:5180/?role=host
```

防火牆需要同時開 TCP `5173` 和 `5180`。

## 共享礦場競技

四人共享礦場版黃金礦工本地原型。

## 開始

單機測試可直接打開 `index.html`。

網絡四人房間用 Node server：

```bash
npm start
```

然後開 `http://localhost:5173`。

不同電腦連線：Host 電腦執行 `node server.js` 後，其他電腦使用終端顯示的 `LAN` 地址，例如 `http://192.168.x.x:5173/?player=0`。所有電腦必須在同一 Wi-Fi / LAN。

- Host：`http://localhost:5173/?role=host`
- Player 1：`http://localhost:5173/?player=0`
- Player 2：`http://localhost:5173/?player=1`
- Player 3：`http://localhost:5173/?player=2`
- Player 4：`http://localhost:5173/?player=3`

## 學校主機部署

如果不想依賴自己的 Mac，可以把遊戲放到另一部連接學校網絡的電腦，讓它做遊戲主機。

主機電腦需要：

- 已安裝 Node.js 20 或以上
- 已連接學校 Wi-Fi / LAN
- 防火牆允許其他電腦連入 port `5173`

在主機電腦執行：

```bash
git clone https://github.com/fox0310/steam-game.git
cd steam-game
npm install
npm start
```

啟動後 terminal 會顯示類似：

```text
Local: http://localhost:5173
LAN:   http://192.168.1.73:5173
```

Host 畫面也會自動顯示可用連線網址，按一下網址按鈕即可複製。

其他學校網絡內的電腦使用 `LAN` 地址進入：

- Host：`http://192.168.1.73:5173/?role=host`
- Player 1：`http://192.168.1.73:5173/?player=0`
- Player 2：`http://192.168.1.73:5173/?player=1`
- Player 3：`http://192.168.1.73:5173/?player=2`
- Player 4：`http://192.168.1.73:5173/?player=3`

如果想長期使用固定網址，請學校 IT 幫主機電腦設定固定 IP 或內網 DNS，例如：

```text
http://goldminer.school:5173/?role=host
```

## 操作

- 每位 Player 頁面都用 Space 出爪
- Player 頁面只能控制自己
- Host 頁面只負責觀戰
- Host 按「重開」會重置 server 遊戲，倒數回到 3:00
- 每個畫面都有「全螢幕」按鈕
- 競技背景音樂會在首次點擊或按鍵後自動播放

## 已包含

- 4 位玩家
- Host 全局畫面
- Player 個人視角
- 共享金礦
- 鐘擺夾子
- 命中加分與同步消失
- 金礦在 3 分鐘內持續補生
- 3 分鐘倒數
- 即時排名與結算
- Node WebSocket server
- Server 權威判定金礦命中與分數
- LAN 連線地址輸出

## 暫未包含

正式房間碼、斷線重連、手機版 UI。

## 公網測試

最小做法是把本機 server 開 tunnel：

```bash
npx localtunnel --port 5173
```

把產生的 `https://...loca.lt` 地址給其他玩家使用，例如 `https://...loca.lt/?player=0`。

目前測試地址：

- Host：`https://dark-melons-unite.loca.lt/?role=host`
- Player 1：`https://dark-melons-unite.loca.lt/?player=0`
- Player 2：`https://dark-melons-unite.loca.lt/?player=1`
- Player 3：`https://dark-melons-unite.loca.lt/?player=2`
- Player 4：`https://dark-melons-unite.loca.lt/?player=3`

localtunnel 第一次進入會顯示確認頁，password 是：

```text
37.19.205.165
```

正式活動建議改用固定公網部署或 Cloudflare Tunnel，避免免費 tunnel 換網址。

## Koyeb 正式部署

1. 到 Koyeb 建立 `Web Service`。
2. 選擇 GitHub repo：`fox0310/steam-game`。
3. Runtime 選 Node.js。
4. Build command 留空或使用 `npm install`。
5. Run command 使用 `npm start`。
6. 部署完成後，用 Koyeb 網址加參數：

- Host：`https://你的-koyeb-url/?role=host`
- Player 1：`https://你的-koyeb-url/?player=0`
- Player 2：`https://你的-koyeb-url/?player=1`
- Player 3：`https://你的-koyeb-url/?player=2`
- Player 4：`https://你的-koyeb-url/?player=3`

Server 會自動使用 Koyeb 提供的 `PORT`。

## 素材來源

- Cave background: OpenGameArt `Seamless cave background`, PWL, CC0/no usage restrictions.
- Cave/mine cart: OpenGameArt `OPP2017 - Cave and mine cart`, Open Pixel Project, public domain/CC0 note included in `assets/license cc0 - public domain.txt`.
- Gold deposit: OpenGameArt `Gold Mine`, Jinn / Andrettin, CC-BY-SA 3.0 or GPL 2.0.
- Miner sprite: OpenGameArt `Dwarves`, b_o / Andrettin, CC-BY-SA 3.0 or GPL 2.0.
- Claw/hook: OpenGameArt `Grappling Hook`, azureguy, CC0.
- Current miner image and claw crop: user-provided local reference files in `/Users/kille/Downloads`.

## 四人共享海域捕魚競技

玩家在船上操作左右擺動大炮，按 Space 發射魚網捕魚。四位玩家共享同一批魚群，由 server 權威判定命中和分數。

啟動：

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

學校 LAN / VM 使用 terminal 顯示的 LAN 或外部 IP，例如：

```text
http://192.168.x.x:5180/?role=host
http://192.168.x.x:5180/?player=0
```

規則：

- 限時 3 分鐘。
- 小魚 100 分。
- 中魚 250 分。
- 大鱼 500 分。
- 稀有金魚 800 分。
- 畫面保持較多魚，魚群會持續補生。
- Player 頁只能控制自己。
- Host 只觀戰和重開。

釣魚遊戲素材：

- `fishing-game/assets/generated-fishing-assets.png`：生成的寫實風釣魚素材參考圖，包含不同顏色船、魚網、魚類和捕魚大炮。
- 實際遊戲畫面使用 Canvas 繪製高對比船、魚網和魚類，確保不同電腦不需要額外下載素材也能穩定顯示。
