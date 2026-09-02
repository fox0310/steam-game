import { expect, test } from "@playwright/test";

test("顯示五個獨立播放選項及固定 QR", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-sound]")).toHaveCount(5);
  await expect(page.getByText("裝置編號")).toHaveCount(0);
  await expect(page.getByText("普通話")).toHaveCount(0);

  await page.getByRole("button", { name: "分享 QR" }).click();
  await expect(page.locator("#share-dialog")).toBeVisible();
  await expect(page.locator("#share-url")).toHaveText("https://fox0310.github.io/steam-game/");
  await expect(page.locator("#qr-code img")).toBeVisible();
});

test("每部裝置的選擇保存在本機", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "輕快音樂" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "輕快音樂" })).toHaveAttribute("aria-pressed", "true");
});

test("iPad 直向及橫向沒有水平溢出", async ({ page }) => {
  for (const viewport of [{ width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  }
});

test("首次快取後可以離線重載", async ({ page, context }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.locator("#offline-status")).toHaveText("可離線");

  await context.setOffline(true);
  try {
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "啟動感應器" })).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
