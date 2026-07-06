const { test, expect } = require("@playwright/test");

test("rocket game renders and space lifts", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://localhost:5190", { waitUntil: "networkidle" });
  await expect(page.locator("canvas")).toBeVisible();

  const before = await page.locator("#altitude").textContent();
  await page.keyboard.down("Space");
  await expect(page.locator("#countdown")).toBeVisible();
  await page.waitForTimeout(4300);
  await page.keyboard.up("Space");
  const after = await page.locator("#altitude").textContent();

  expect(parseInt(after, 10)).toBeGreaterThan(parseInt(before, 10));
  expect((await page.locator("canvas").screenshot()).length).toBeGreaterThan(1000);
});

test("reward appears at space target", async ({ page }) => {
  await page.goto("http://localhost:5190", { waitUntil: "networkidle" });
  await page.keyboard.down("Space");
  await expect(page.locator("#reward")).toBeVisible({ timeout: 13000 });
  await page.keyboard.up("Space");
  await expect(page.getByRole("heading", { name: "成功到達太空" })).toBeVisible();
  await page.getByRole("button", { name: "再玩一次" }).click();
  await expect(page.locator("#reward")).toBeHidden();
  await expect(page.locator("#altitude")).toHaveText("0%");
});
