import { test, expect } from "@playwright/test";

const USER = {
  email: `test-${Date.now()}@example.com`,
  password: "Password1!",
};

test.describe.configure({ mode: "serial" });

test("unauthenticated user is redirected to /login", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/login/);
});

test("register creates account and redirects to /collection", async ({
  page,
}) => {
  await page.goto("/register");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
  await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
});

test("login with valid credentials redirects to /collection", async ({
  page,
}) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
});

test("login with wrong password shows inline error", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", "wrongpassword");
  await page.click("[type=submit]");
  await expect(page.getByText("Invalid email or password")).toBeVisible();
  await expect(page).toHaveURL(/login/);
});

test("register with duplicate email shows inline error", async ({ page }) => {
  await page.goto("/register");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page.getByText("Email already in use")).toBeVisible();
});

test("session persists on page refresh", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
  await page.reload();
  await expect(page).toHaveURL("/collection");
});

test("logout redirects to /login", async ({ page }) => {
  await page.goto("/login");
  await page.fill("[name=email]", USER.email);
  await page.fill("[name=password]", USER.password);
  await page.click("[type=submit]");
  await expect(page).toHaveURL("/collection");
  await page.click("[type=submit]"); // logout button
  await expect(page).toHaveURL(/login/);
});
