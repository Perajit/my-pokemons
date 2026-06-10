import { test, expect } from "@playwright/test";

const USER = {
  email: `gameplay-${Date.now()}@example.com`,
  password: "Password1!",
};

test.describe.configure({ mode: "serial" });

test("register and buy Bulbasaur to set up gameplay", async ({ page }) => {
  await page.goto("/register");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");

  await page.goto("/shop");
  await page.getByText("Bulbasaur").click();
  await page.getByRole("button", { name: /^buy$/i }).click();
  await expect(
    page.getByText(/bulbasaur added to your collection/i),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByText("250", { exact: true }),
  ).toBeVisible();
});

test("detail page renders Feed and Play buttons for an active pokemon", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");

  await page.getByRole("link", { name: /open bulbasaur/i }).click();
  await expect(page).toHaveURL(/\/collection\//);
  await expect(page.getByRole("button", { name: "Feed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Play" })).toBeVisible();

  await page.getByRole("link", { name: /back to collection/i }).click();
  await expect(page).toHaveURL("/collection");
});

test("feeding credits coins and starts a cooldown countdown", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await page.getByRole("link", { name: /open bulbasaur/i }).click();

  await page.getByRole("button", { name: "Feed" }).click();

  // 250 starting balance + 3 feedCoinReward
  await expect(
    page.getByRole("banner").getByText("253", { exact: true }),
  ).toBeVisible();
  // Button should now be disabled and show m:ss countdown (e.g., "29:59")
  const feedBtn = page.getByRole("button", { name: "Feed" });
  await expect(feedBtn).toBeDisabled();
  await expect(feedBtn).toHaveText(/\d+:\d{2}/);
});

test("playing credits coins and starts a cooldown countdown", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await page.getByRole("link", { name: /open bulbasaur/i }).click();

  await page.getByRole("button", { name: "Play" }).click();

  // 253 (from previous test) + 3 playCoinReward
  await expect(
    page.getByRole("banner").getByText("256", { exact: true }),
  ).toBeVisible();
  const playBtn = page.getByRole("button", { name: "Play" });
  await expect(playBtn).toBeDisabled();
  await expect(playBtn).toHaveText(/\d+:\d{2}/);
});
