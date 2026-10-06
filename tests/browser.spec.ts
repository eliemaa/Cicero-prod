import { test, expect } from "@playwright/test";
const routes = [
  "/",
  "/platform",
  "/languages",
  "/security",
  "/pricing",
  "/demo",
  "/case-late-production",
  "/insights",
  "/insights/post-one-record",
  "/insights/post-case-is-the-output",
  "/insights/post-matter-analysis",
  "/insights/post-mostly-right",
  "/insights/guide-twelve-questions",
  "/insights/research-four-ways",
];
test("all migrated public routes render content without browser exceptions", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    const response = await page.goto(route, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1")).not.toHaveText("");
    await page.waitForFunction(() =>
      Boolean((window as any).__ciceroUIStarted),
    );
    expect(await page.locator('img[src=""]').count()).toBe(0);
    await expect(page.locator("body")).not.toContainText("{{CMS_");
  }
  expect(errors).toEqual([]);
});
test("booking styles, menu, language selection and legacy redirects survive migration", async ({
  page,
}) => {
  await page.goto("/index.html");
  await expect(page).toHaveURL("/");
  await page.waitForFunction(() => Boolean((window as any).__ciceroUIStarted));
  await expect(page.locator(".nav-right .btn")).toHaveCSS(
    "background-color",
    "rgb(109, 20, 38)",
  );
  await page.locator("#menu-btn").click();
  await expect(page.locator("#menu-sheet")).toBeVisible();
  await page.locator("#ms-close").click();
  await expect(page.locator("#menu-sheet")).not.toBeVisible();
  await page.locator("#lang-btn").click();
  await page.locator('#lang-menu [data-setlang="ar"]').click();
  await expect(page).toHaveURL("/?lang=ar");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.goto("/post-one-record.html?lang=fr");
  await expect(page).toHaveURL("/insights/post-one-record?lang=fr");
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});
test("media operations reject visitors and missing public pages return 404", async ({
  request,
}) => {
  for (const method of ["GET", "POST", "DELETE"]) {
    const response = await request.fetch("/api/admin/media", { method });
    expect(response.status()).toBe(403);
  }
  expect((await request.get("/insights/not-a-published-post")).status()).toBe(
    404,
  );
});
