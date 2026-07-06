# Steam Game

這個 repo 目前包含三個課堂遊戲：

- `.`：共享礦場競技
- `fishing-game/`：四人共享海域捕魚競技
- `rocket-game/`：低組學生用空白鍵或拍制控制的 3D 星空火箭升空

## 公開網址

VM 對外只需要開標準 HTTP `80` port，學校 Wi-Fi 較容易通過。

把 `VM外部IP` 換成 Google Cloud 顯示的 External IP：

網址：

- 首頁：`http://VM外部IP/`
- 掘金 Host：`http://VM外部IP/gold/?role=host`
- 掘金 Player：`http://VM外部IP/gold/?player=0`
- 釣魚 Host：`http://VM外部IP/fishing/?role=host`
- 釣魚 Player：`http://VM外部IP/fishing/?player=0`
- 火箭：`http://VM外部IP/rocket/`

## VM 長期運行

第一次部署或更新後，在 VM 執行：

```bash
cd ~/steam-game
git pull origin main
./scripts/install-vm-service.sh
```

之後 VM 重開時，`steam-games.service` 會自動啟動三個後端和 `80` port gateway。

本機開發仍可用內部 port：

- 掘金：`http://localhost:5173/?role=host`
- 釣魚：`http://localhost:5180/?role=host`
- 火箭：`http://localhost:5190/`

## 星空火箭升空

低組學生單鍵 3D 火箭遊戲。學生按住空白鍵或外接拍制時，先出現 `3、2、1、發射` 倒數和音效，然後火箭由陸地升空；鬆開時火箭停止升空；高度到 100% 後出現獎勵畫面。

啟動：

```bash
npm run start:rocket
```

網址：

```text
http://localhost:5190
```

操作：

- 按住 Space / 外接拍制：升空。
- 鬆開：停止升空。
- 首次按下會播放倒數發射音效。
- 背景會由陸地、山和升空台逐漸轉成太空星空。
- 圖形使用 Three.js 3D 場景，已加入天空、太空星空、山形、自然物件、長征五號火箭及火箭升空台 3D 素材。
- 到達 100%：顯示獎勵畫面。
- 獎勵畫面可按「再玩一次」重開。
- 畫面也有大型「按住升空」按鈕，供觸控測試。

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

### 火箭遊戲素材

已放入 `rocket-game/assets/`：

- Day sky: OpenGameArt `Seamless Sky Backgrounds`, Screaming Brain Studios, CC0.
- Space sky: itch.io `Seamless Space Backgrounds`, Screaming Brain Studios, CC0/Public Domain.
- Mountains: Poly Pizza `Mountains`, Quaternius, CC0.
- Nature props: `Nature Kit GLB Pack`, Kenney / Eclair Assets redistribution, CC0.

已下載並放入 `rocket-game/assets/models/`：

- Long March 5 Rocket: Sketchfab, AllThingsSpace (@sunnychen753), CC BY 4.0。
- Proton Rocket Launchpad: Sketchfab, Soviet Model Magic (@mckadefasel), CC BY 4.0。

完整來源和署名記錄在 `rocket-game/assets/licenses/ASSET-SOURCES.txt`。

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
