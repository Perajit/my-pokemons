import { test, expect } from "@playwright/test";

const USER = {
  email: `shop-${Date.now()}@example.com`,
  password: "Password1!",
};

test.describe.configure({ mode: "serial" });

test("register lands on empty dashboard with Browse Shop CTA", async ({
  page,
}) => {
  await page.goto("/register");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
  await expect(
    page.getByText("Your collection is waiting to begin."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /browse shop/i })).toBeVisible();
});

test("shop page lists Pokémon and navbar shows starting balance", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
  await page.getByRole("link", { name: /browse shop/i }).click();
  await expect(page).toHaveURL("/shop");
  await expect(page.getByText("Bulbasaur")).toBeVisible();
  await expect(
    page.getByRole("banner").getByText("500", { exact: true }),
  ).toBeVisible();
});

test("buy Bulbasaur deducts coins and shows success toast", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
  await page.goto("/shop");

  await page.getByText("Bulbasaur").click();
  await expect(page.getByText(/a strange seed was planted/i)).toBeVisible();
  await page.getByRole("button", { name: /^buy$/i }).click();

  await expect(
    page.getByText(/bulbasaur added to your collection/i),
  ).toBeVisible();
  await expect(
    page.getByRole("banner").getByText("250", { exact: true }),
  ).toBeVisible();
});

test("dashboard shows purchased Bulbasaur in collection", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
  await expect(page.getByText("Bulbasaur")).toBeVisible();
  await expect(page.getByText("Active")).toBeVisible();
});
