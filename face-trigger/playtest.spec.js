import { expect, test } from "@playwright/test";

test("直接開啟本機檔案時顯示 HTTPS 指引", async ({ page }) => {
  await page.goto(new URL("./index.html", import.meta.url).href);
  await expect(page.getByRole("heading", { name: "請使用安全網址" })).toBeVisible();
  await expect(page.getByRole("link", { name: "開啟正式版本" })).toHaveAttribute(
    "href",
    "https://fox0310.github.io/steam-game/",
  );
});

test("顯示五個獨立播放選項及固定 QR", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-sound]")).toHaveCount(5);
  await expect(page.getByText("裝置編號")).toHaveCount(0);
  await expect(page.getByText("普通話")).toHaveCount(0);

  await page.getByRole("button", { name: "分享 QR" }).click();
  await expect(page.locator("#share-dialog")).toBeVisible();
  await expect(page.locator("#share-url")).toHaveText("https://fox0310.github.io/steam-game/");
  await expect(page.locator("#qr-code canvas:visible, #qr-code img:visible")).toHaveCount(1);
});

test("每部裝置的選擇保存在本機", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "輕快音樂" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "輕快音樂" })).toHaveAttribute("aria-pressed", "true");
});

test("手機及 iPad 直向橫向沒有水平溢出", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  }
});

test("粵語內容使用內置音檔播放", async ({ page }) => {
  await page.addInitScript(() => {
    window.__audioBufferStarts = 0;
    const originalStart = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) {
      window.__audioBufferStarts += 1;
      return originalStart.apply(this, args);
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error("測試拒絕相機")) },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "立即啟動" }).click();
  await page.getByRole("button", { name: "手動測試播放" }).click();
  await expect.poll(() => page.evaluate(() => window.__audioBufferStarts)).toBeGreaterThan(0);
});

test("本機人臉模型可以完成初始化", async ({ page }) => {
  await page.goto("/");
  const initialized = await page.evaluate(async () => {
    const model = new window.FaceMesh({
      locateFile: (file) => `./vendor/face_mesh/${file}`,
    });
    model.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.55,
      minTrackingConfidence: 0.55,
    });
    try {
      await model.initialize();
      return true;
    } finally {
      await model.close();
    }
  });
  expect(initialized).toBe(true);
});

test("相機權限失敗時仍可手動測試", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: () => Promise.reject(new Error("測試拒絕相機")) },
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "立即啟動" }).click();
  await expect(page.locator("#status-text")).toHaveText("相機未能啟動；仍可手動測試");
  await expect(page.getByRole("button", { name: "手動測試播放" })).toBeEnabled();
});

test("首次快取後可以離線重載", async ({ page, context, browserName }) => {
  test.skip(browserName === "webkit", "Playwright WebKit 的離線模式會內部錯誤；實機 Safari 另行驗收");
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("#offline-status")).toHaveText("可離線");

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "啟動感應器" })).toBeVisible();
    const offlineAudioBytes = await page.evaluate(async () => {
      const response = await fetch("./assets/audio/morning.wav");
      return (await response.arrayBuffer()).byteLength;
    });
    expect(offlineAudioBytes).toBeGreaterThan(1_000);
  } finally {
    await context.setOffline(false);
  }
});
